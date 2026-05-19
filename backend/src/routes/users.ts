import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/users - Listar usuários (gerente)
router.get('/', authenticate, authorize('gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_banned, cancel_count, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/users/:id/ban - Banir/desbanir usuário (gerente)
router.patch('/:id/ban', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_banned } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET is_banned = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, is_banned',
      [is_banned, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao banir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/users/:id/orders - Histórico de pedidos de um usuário (gerente)
router.get('/:id/orders', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name as user_name
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar pedidos do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
