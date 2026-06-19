import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { DbOrder, DbOrderItem, DbUser, mapOrder, mapOrderItem } from '../types';

const router = Router();

const ORDER_SELECT = `
  SELECT o.*, u.nome AS usuario_nome, u.email AS usuario_email
  FROM pedido o
  JOIN usuario u ON u.idusuario = o.fk_idusuario
`;

async function getOrderWithItems(orderId: number) {
  const orderRes = await pool.query<DbOrder>(`${ORDER_SELECT} WHERE o.idpedido = $1`, [orderId]);
  if (orderRes.rows.length === 0) return null;

  const itemsRes = await pool.query<DbOrderItem>(
    `SELECT * FROM itens_pedido WHERE fk_idpedido = $1`,
    [orderId]
  );

  return mapOrder(orderRes.rows[0], itemsRes.rows.map(mapOrderItem));
}

// GET /api/orders
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (req.user!.role === 'cliente') {
      params.push(req.user!.id);
      conditions.push(`o.fk_idusuario = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`o.situacao = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query<DbOrder>(
      `${ORDER_SELECT} ${where} ORDER BY o.data_inicio DESC`,
      params
    );

    const orders = await Promise.all(
      result.rows.map(async (row) => {
        const items = await pool.query<DbOrderItem>(
          'SELECT * FROM itens_pedido WHERE fk_idpedido = $1',
          [row.idpedido]
        );
        return mapOrder(row, items.rows.map(mapOrderItem));
      })
    );

    res.json(orders);
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await getOrderWithItems(Number(req.params.id));
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    if (req.user!.role === 'cliente' && order.user_id !== String(req.user!.id)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    res.json(order);
  } catch (err) {
    console.error('Erro ao buscar pedido:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/orders  (cliente)
router.post('/', authenticate, authorize('cliente'), async (req: Request, res: Response): Promise<void> => {
  const { items, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'O pedido deve ter ao menos um item' });
    return;
  }

  const client = await pool.connect();
  try {
    const userRes = await client.query<DbUser>('SELECT eh_banido FROM usuario WHERE idusuario = $1', [req.user!.id]);
    if (userRes.rows[0]?.eh_banido) {
      res.status(403).json({ error: 'Sua conta está banida' });
      return;
    }

    await client.query('BEGIN');

    let total = 0;
    const orderItems: Array<{ productId: number; nome: string; preco: number; qty: number; url_foto: string | null }> = [];

    for (const item of items) {
      const prodRes = await client.query(
        'SELECT idproduto, nome, preco, quantidade, situacao, url_foto FROM produto WHERE idproduto = $1 FOR UPDATE',
        [item.product_id]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Produto ${item.product_id} não encontrado` });
        return;
      }

      const prod = prodRes.rows[0];

      if (prod.situacao !== 'disponivel') {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Produto "${prod.nome}" não está disponível` });
        return;
      }

      const qty = Number(item.quantity);
      if (prod.quantidade < qty) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Quantidade insuficiente para "${prod.nome}"` });
        return;
      }

      const novaQtd = prod.quantidade - qty;
      const novaSituacao = novaQtd <= 0 ? 'em_falta' : 'disponivel';
      await client.query(
        'UPDATE produto SET quantidade = $1, situacao = $2, data_atualizacao = NOW() WHERE idproduto = $3',
        [novaQtd, novaSituacao, prod.idproduto]
      );

      total += Number(prod.preco) * qty;
      orderItems.push({ productId: prod.idproduto, nome: prod.nome, preco: Number(prod.preco), qty, url_foto: prod.url_foto });
    }

    const orderRes = await client.query<DbOrder>(
      `INSERT INTO pedido (valor_total, situacao, observacoes, fk_idusuario, data_inicio)
       VALUES ($1, 'pendente', $2, $3, NOW())
       RETURNING *`,
      [total, notes || null, req.user!.id]
    );

    const orderId = orderRes.rows[0].idpedido;

    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO itens_pedido (quantidade, nome_produto, preco_produto, subtotal, url_foto_produto, fk_idproduto, fk_idpedido)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [oi.qty, oi.nome, oi.preco, oi.preco * oi.qty, oi.url_foto, oi.productId, orderId]
      );
    }

    await client.query('COMMIT');

    const order = await getOrderWithItems(orderId);
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status  (funcionario+)
router.patch('/:id/status', authenticate, authorize('funcionario', 'gerente'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, cancel_reason } = req.body;

  const allowed = ['aceito', 'em_preparo', 'pronto', 'retirado', 'cancelado'];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: 'Status inválido' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query<DbOrder>(
      'SELECT * FROM pedido WHERE idpedido = $1 FOR UPDATE',
      [id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    const order = orderRes.rows[0];
    const prevStatus = order.situacao;

    await client.query(
      `UPDATE pedido
       SET situacao = $1, motivo_cancelamento = $2,
           data_fim = CASE WHEN $1 IN ('retirado','cancelado') THEN NOW() ELSE data_fim END
       WHERE idpedido = $4`,
      [
        status,
        status === 'cancelado' ? (cancel_reason || 'Cancelado pela cantina') : order.motivo_cancelamento,
        id,
      ]
    );

    if (status === 'cancelado' && prevStatus !== 'cancelado') {
      const itemsRes = await client.query<DbOrderItem>(
        'SELECT * FROM itens_pedido WHERE fk_idpedido = $1',
        [id]
      );
      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE produto
           SET quantidade = quantidade + $1,
               situacao = CASE WHEN situacao = 'em_falta' THEN 'disponivel' ELSE situacao END,
               data_atualizacao = NOW()
           WHERE idproduto = $2`,
          [item.quantidade, item.fk_idproduto]
        );
      }
    }

    await client.query('COMMIT');

    const updated = await getOrderWithItems(Number(id));
    res.json(updated);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar status do pedido:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/cancel  (cliente)
router.patch('/:id/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { cancel_reason } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query<DbOrder>(
      'SELECT * FROM pedido WHERE idpedido = $1 FOR UPDATE',
      [id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    const order = orderRes.rows[0];

    if (req.user!.role === 'cliente') {
      if (order.fk_idusuario !== req.user!.id) {
        await client.query('ROLLBACK');
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }
      if (order.situacao !== 'pendente') {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Só é possível cancelar pedidos com status pendente' });
        return;
      }
    }

    if (order.situacao === 'cancelado') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Pedido já cancelado' });
      return;
    }

    await client.query(
      `UPDATE pedido
       SET situacao = 'cancelado', motivo_cancelamento = $1, data_fim = NOW()
       WHERE idpedido = $2`,
      [cancel_reason || 'Cancelado pelo cliente', id]
    );

    if (req.user!.role === 'cliente') {
      await client.query(
        'UPDATE usuario SET qtd_cancelamentos = qtd_cancelamentos + 1 WHERE idusuario = $1',
        [req.user!.id]
      );
    }

    const itemsRes = await client.query<DbOrderItem>(
      'SELECT * FROM itens_pedido WHERE fk_idpedido = $1',
      [id]
    );
    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE produto
         SET quantidade = quantidade + $1,
             situacao = CASE WHEN situacao = 'em_falta' THEN 'disponivel' ELSE situacao END,
             data_atualizacao = NOW()
         WHERE idproduto = $2`,
        [item.quantidade, item.fk_idproduto]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Pedido cancelado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao cancelar pedido:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  } finally {
    client.release();
  }
});

export default router;
