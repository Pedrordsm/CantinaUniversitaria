import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router();

// Função para criar notificação e emitir via socket
async function createNotification(
  userId: string | null,
  role: string | null,
  title: string,
  message: string,
  type: string,
  orderId: string
) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, role, title, message, type, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, role, title, message, type, orderId]
    );

    const io = getIO();
    const payload = { title, message, type, order_id: orderId, created_at: new Date() };

    if (userId) {
      io.to(`user:${userId}`).emit('notification', payload);
    }
    if (role) {
      io.to(`role:${role}`).emit('notification', payload);
    }
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}

// GET /api/orders - Listar pedidos
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, id: userId } = req.user!;
    const { status, page = '1', limit = '20' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramCount = 1;

    // Clientes só veem seus próprios pedidos
    if (role === 'cliente') {
      query += ` AND o.user_id = $${paramCount++}`;
      params.push(userId);
    }

    if (status) {
      query += ` AND o.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    // Busca itens de cada pedido
    const orders = await Promise.all(
      result.rows.map(async (order) => {
        const items = await pool.query(
          `SELECT oi.*, p.name as product_name, p.image_url as product_image
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1`,
          [order.id]
        );
        return { ...order, items: items.rows };
      })
    );

    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, id: userId } = req.user!;

    const result = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    const order = result.rows[0];

    // Cliente só pode ver seus próprios pedidos
    if (role === 'cliente' && order.user_id !== userId) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    const items = await pool.query(
      `SELECT oi.*, p.name as product_name, p.image_url as product_image
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    res.json({ ...order, items: items.rows });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/orders - Criar pedido (cliente)
router.post('/', authenticate, authorize('cliente'), async (req: Request, res: Response): Promise<void> => {
  const { items, notes } = req.body;
  const userId = req.user!.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Itens do pedido são obrigatórios' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifica se usuário está banido
    const userCheck = await client.query('SELECT is_banned FROM users WHERE id = $1', [userId]);
    if (userCheck.rows[0]?.is_banned) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Sua conta está banida' });
      return;
    }

    let total = 0;
    const validatedItems: Array<{ product_id: string; quantity: number; unit_price: number; subtotal: number }> = [];

    // Valida e calcula total
    for (const item of items) {
      const productResult = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id]);

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Produto ${item.product_id} não encontrado` });
        return;
      }

      const product = productResult.rows[0];

      if (product.status !== 'disponivel') {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Produto "${product.name}" não está disponível` });
        return;
      }

      if (product.quantity < item.quantity) {
        await client.query('ROLLBACK');
        res.status(400).json({
          error: `Quantidade insuficiente para "${product.name}". Disponível: ${product.quantity}`,
        });
        return;
      }

      const subtotal = product.price * item.quantity;
      total += subtotal;
      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal,
      });
    }

    // Cria o pedido
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, notes) VALUES ($1, $2, $3) RETURNING *',
      [userId, total, notes || null]
    );
    const order = orderResult.rows[0];

    // Insere itens e decrementa estoque
    for (const item of validatedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );

      // Decrementa quantidade
      await client.query(
        `UPDATE products SET quantity = quantity - $1,
          status = CASE WHEN quantity - $1 <= 0 THEN 'em_falta' ELSE status END,
          updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');

    // Notifica funcionários sobre novo pedido
    await createNotification(
      null,
      'funcionario',
      '🛒 Novo Pedido',
      `Novo pedido #${order.id.slice(0, 8)} recebido! Total: R$ ${total.toFixed(2)}`,
      'new_order',
      order.id
    );
    await createNotification(
      null,
      'gerente',
      '🛒 Novo Pedido',
      `Novo pedido #${order.id.slice(0, 8)} recebido! Total: R$ ${total.toFixed(2)}`,
      'new_order',
      order.id
    );

    // Emite evento de novo pedido para funcionários
    getIO().to('role:funcionario').emit('new_order', { order_id: order.id });
    getIO().to('role:gerente').emit('new_order', { order_id: order.id });

    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status - Atualizar status (funcionário/gerente)
router.patch(
  '/:id/status',
  authenticate,
  authorize('funcionario', 'gerente'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    const validTransitions: Record<string, string[]> = {
      pendente: ['aceito', 'cancelado'],
      aceito: ['em_preparo', 'cancelado'],
      em_preparo: ['pronto', 'cancelado'],
      pronto: ['retirado'],
      retirado: [],
      cancelado: [],
    };

    try {
      const orderResult = await pool.query(
        'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1',
        [id]
      );

      if (orderResult.rows.length === 0) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      const order = orderResult.rows[0];
      const allowed = validTransitions[order.status] || [];

      if (!allowed.includes(status)) {
        res.status(400).json({
          error: `Transição inválida: ${order.status} → ${status}`,
        });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const updateData: unknown[] = [status, id];
        let updateQuery = 'UPDATE orders SET status = $1, updated_at = NOW()';

        if (status === 'cancelado') {
          updateQuery += ', cancelled_by = $3, cancel_reason = $4';
          updateData.push(req.user!.role, req.body.cancel_reason || 'Cancelado pelo funcionário');
        }

        updateQuery += ` WHERE id = $2 RETURNING *`;
        const result = await client.query(updateQuery, updateData);

        // Se cancelado, devolve estoque
        if (status === 'cancelado') {
          const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
          for (const item of items.rows) {
            await client.query(
              `UPDATE products SET quantity = quantity + $1,
                status = CASE WHEN status = 'em_falta' AND quantity + $1 > 0 THEN 'disponivel' ELSE status END,
                updated_at = NOW()
               WHERE id = $2`,
              [item.quantity, item.product_id]
            );
          }
        }

        await client.query('COMMIT');

        // Notificações
        if (status === 'cancelado') {
          await createNotification(
            order.user_id, null,
            '❌ Pedido Cancelado',
            `Seu pedido #${id.slice(0, 8)} foi cancelado pelo funcionário.`,
            'order_cancelled', id
          );
        } else if (status === 'pronto') {
          await createNotification(
            order.user_id, null,
            '✅ Pedido Pronto',
            `Seu pedido #${id.slice(0, 8)} está pronto para retirada!`,
            'order_ready', id
          );
        } else if (status === 'aceito') {
          await createNotification(
            order.user_id, null,
            '👍 Pedido Aceito',
            `Seu pedido #${id.slice(0, 8)} foi aceito e está sendo preparado.`,
            'order_accepted', id
          );
        }

        res.json(result.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// PATCH /api/orders/:id/cancel - Cancelar pedido (cliente)
router.patch('/:id/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role, id: userId } = req.user!;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    const order = orderResult.rows[0];

    // Cliente só pode cancelar seus próprios pedidos
    if (role === 'cliente' && order.user_id !== userId) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    // Cliente só pode cancelar pedidos pendentes
    if (role === 'cliente' && order.status !== 'pendente') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Só é possível cancelar pedidos com status "pendente"' });
      return;
    }

    if (order.status === 'cancelado' || order.status === 'retirado') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Este pedido não pode ser cancelado' });
      return;
    }

    await client.query(
      `UPDATE orders SET status = 'cancelado', cancelled_by = $1, cancel_reason = $2, updated_at = NOW() WHERE id = $3`,
      [role, req.body.cancel_reason || 'Cancelado pelo cliente', id]
    );

    // Devolve estoque
    const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    for (const item of items.rows) {
      await client.query(
        `UPDATE products SET quantity = quantity + $1,
          status = CASE WHEN status = 'em_falta' AND quantity + $1 > 0 THEN 'disponivel' ELSE status END,
          updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Incrementa contador de cancelamentos do cliente
    if (role === 'cliente') {
      await client.query('UPDATE users SET cancel_count = cancel_count + 1 WHERE id = $1', [userId]);
    }

    await client.query('COMMIT');

    // Notifica funcionários
    await createNotification(
      null, 'funcionario',
      '❌ Pedido Cancelado',
      `Pedido #${id.slice(0, 8)} foi cancelado pelo cliente.`,
      'order_cancelled', id
    );

    if (role === 'cliente') {
      await createNotification(
        null, 'gerente',
        '❌ Pedido Cancelado',
        `Pedido #${id.slice(0, 8)} foi cancelado pelo cliente.`,
        'order_cancelled', id
      );
    }

    res.json({ message: 'Pedido cancelado com sucesso' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

export default router;
