import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { DbCategory, mapCategory } from '../types';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<DbCategory>('SELECT * FROM categoria ORDER BY nome');
    res.json(result.rows.map(mapCategory));
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/categories  (funcionario+)
router.post('/', authenticate, authorize('funcionario', 'gerente'), async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    return;
  }

  try {
    const result = await pool.query<DbCategory>(
      'INSERT INTO categoria (nome) VALUES ($1) RETURNING *',
      [String(name).trim()]
    );
    res.status(201).json(mapCategory(result.rows[0]));
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE /api/categories/:id  (funcionario+)
router.delete('/:id', authenticate, authorize('funcionario', 'gerente'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM categoria WHERE idcategoria = $1', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }

    res.json({ message: 'Categoria excluída' });
  } catch (err: any) {
    if (err.code === '23503') {
      res.status(409).json({ error: 'Categoria possui produtos vinculados e não pode ser excluída' });
      return;
    }
    console.error('Erro ao excluir categoria:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
