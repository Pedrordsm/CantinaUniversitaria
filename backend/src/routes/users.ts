import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { DbUser, DbOrder, DbOrderItem, mapUser, mapOrder, mapOrderItem } from '../types';

const router = Router();

// GET /api/users  (gerente)
router.get('/', authenticate, authorize('gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<DbUser>(
      'SELECT * FROM usuario ORDER BY data_criacao DESC'
    );
    res.json(result.rows.map(mapUser));
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PATCH /api/users/:id/ban  (gerente)
router.patch('/:id/ban', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_banned } = req.body;

  try {
    const result = await pool.query<DbUser>(
      'UPDATE usuario SET eh_banido = $1 WHERE idusuario = $2 RETURNING *',
      [Boolean(is_banned), id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(mapUser(result.rows[0]));
  } catch (err) {
    console.error('Erro ao banir/desbanir usuário:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/users/:id/orders  (gerente)
router.get('/:id/orders', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  try {
    const ordersRes = await pool.query<DbOrder>(
      `SELECT o.*, u.nome AS usuario_nome, u.email AS usuario_email
       FROM pedido o
       JOIN usuario u ON u.idusuario = o.fk_idusuario
       WHERE o.fk_idusuario = $1
       ORDER BY o.data_inicio DESC`,
      [req.params.id]
    );

    const orders = await Promise.all(
      ordersRes.rows.map(async (row) => {
        const items = await pool.query<DbOrderItem>(
          'SELECT * FROM itens_pedido WHERE fk_idpedido = $1',
          [row.idpedido]
        );
        return mapOrder(row, items.rows.map(mapOrderItem));
      })
    );

    res.json(orders);
  } catch (err) {
    console.error('Erro ao buscar pedidos do usuário:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
