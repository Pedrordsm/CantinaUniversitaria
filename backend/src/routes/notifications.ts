import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userId, role } = req.user!;

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR role = $2)
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId, role]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userId, role } = req.user!;

    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE (user_id = $1 OR role = $2) AND is_read = FALSE`,
      [userId, role]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userId, role } = req.user!;

    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE (user_id = $1 OR role = $2) AND is_read = FALSE`,
      [userId, role]
    );

    res.json({ message: 'Notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
