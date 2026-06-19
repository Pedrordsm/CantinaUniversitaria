import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate } from '../middleware/auth';
import { DbNotification, mapNotification } from '../types';

const router = Router();

// GET /api/notifications
// Schema real: notificacao não tem role_alvo — só fk_idusuario
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<DbNotification>(
      `SELECT * FROM notificacao
       WHERE fk_idusuario = $1
       ORDER BY data_envio DESC
       LIMIT 50`,
      [req.user!.id]
    );
    res.json(result.rows.map(mapNotification));
  } catch (err) {
    console.error('Erro ao listar notificações:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notificacao
       WHERE fk_idusuario = $1 AND foi_lida = FALSE`,
      [req.user!.id]
    );
    res.json({ count: Number(result.rows[0].count) });
  } catch (err) {
    console.error('Erro ao contar notificações:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query(
      `UPDATE notificacao SET foi_lida = TRUE
       WHERE fk_idusuario = $1 AND foi_lida = FALSE`,
      [req.user!.id]
    );
    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (err) {
    console.error('Erro ao marcar notificações:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PATCH /api/notifications/:id
router.patch('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query(
      'UPDATE notificacao SET foi_lida = TRUE WHERE idnotificacao = $1',
      [req.params.id]
    );
    res.json({ message: 'Notificação marcada como lida' });
  } catch (err) {
    console.error('Erro ao marcar notificação:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
