import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { authenticate } from '../middleware/auth';
import { DbUser, mapUser } from '../types';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    return;
  }

  try {
    const existing = await pool.query('SELECT idusuario FROM usuario WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query<DbUser>(
      `INSERT INTO usuario (nome, email, senha, funcao, eh_banido, qtd_cancelamentos, data_criacao)
       VALUES ($1, $2, $3, 'cliente', FALSE, 0, NOW())
       RETURNING *`,
      [name, email, hash]
    );

    const user = mapUser(result.rows[0]);
    const token = jwt.sign(
      { userId: result.rows[0].idusuario, role: 'cliente' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query<DbUser>(
      'SELECT * FROM usuario WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    const row = result.rows[0];

    const valid = await bcrypt.compare(password, row.senha);
    if (!valid) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    if (row.eh_banido) {
      res.status(403).json({ error: 'Sua conta foi banida. Entre em contato com a cantina.' });
      return;
    }

    const user = mapUser(row);
    const token = jwt.sign(
      { userId: row.idusuario, role: row.funcao },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<DbUser>(
      'SELECT * FROM usuario WHERE idusuario = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(mapUser(result.rows[0]));
  } catch (err) {
    console.error('Erro no /me:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
