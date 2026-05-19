import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET /api/products - Listar produtos (público)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category_id, search } = req.query;

    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status != 'inativo'
    `;
    const params: unknown[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND p.status = $${paramCount++}`;
      params.push(status);
    }

    if (category_id) {
      query += ` AND p.category_id = $${paramCount++}`;
      params.push(category_id);
    }

    if (search) {
      query += ` AND (lower(p.name) LIKE lower($${paramCount}) OR lower(COALESCE(p.description, '')) LIKE lower($${paramCount}))`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY p.name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/products/all - Listar todos incluindo inativos (funcionário/gerente)
router.get('/all', authenticate, authorize('funcionario', 'gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.status ASC, p.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/products - Criar produto (funcionário/gerente)
router.post(
  '/',
  authenticate,
  authorize('funcionario', 'gerente'),
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('price').isFloat({ min: 0.01 }).withMessage('Preço deve ser maior que zero'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantidade deve ser um número inteiro não negativo'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, description, price, quantity, category_id } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const qty = parseInt(quantity);
    const status = qty > 0 ? 'disponivel' : 'em_falta';

    try {
      const result = await pool.query(
        `INSERT INTO products (name, description, price, quantity, image_url, status, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, description || null, parseFloat(price), qty, imageUrl, status, category_id || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// PUT /api/products/:id - Atualizar produto (funcionário/gerente)
router.put(
  '/:id',
  authenticate,
  authorize('funcionario', 'gerente'),
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, price, quantity, category_id, status } = req.body;

    try {
      const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      const product = existing.rows[0];
      let imageUrl = product.image_url;

      if (req.file) {
        // Remove imagem antiga
        if (product.image_url) {
          const oldPath = path.join(__dirname, '../../', product.image_url);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const newQty = quantity !== undefined ? parseInt(quantity) : product.quantity;
      let newStatus = status || product.status;

      // Auto-atualiza status baseado na quantidade
      if (quantity !== undefined) {
        if (newQty === 0 && newStatus === 'disponivel') {
          newStatus = 'em_falta';
        } else if (newQty > 0 && newStatus === 'em_falta') {
          newStatus = 'disponivel';
        }
      }

      const result = await pool.query(
        `UPDATE products SET
          name = $1, description = $2, price = $3, quantity = $4,
          image_url = $5, status = $6, category_id = $7, updated_at = NOW()
         WHERE id = $8 RETURNING *`,
        [
          name || product.name,
          description !== undefined ? description : product.description,
          price !== undefined ? parseFloat(price) : product.price,
          newQty,
          imageUrl,
          newStatus,
          category_id !== undefined ? category_id || null : product.category_id,
          id,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// PATCH /api/products/:id/status - Alterar status (funcionário/gerente)
router.patch(
  '/:id/status',
  authenticate,
  authorize('funcionario', 'gerente'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['disponivel', 'em_falta', 'inativo'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Status inválido' });
      return;
    }

    try {
      const result = await pool.query(
        'UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// DELETE /api/products/:id - Excluir produto (funcionário/gerente)
router.delete(
  '/:id',
  authenticate,
  authorize('funcionario', 'gerente'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      const product = existing.rows[0];

      // Verifica se produto está em pedidos ativos
      const activeOrders = await pool.query(
        `SELECT COUNT(*) as count FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.product_id = $1 AND o.status NOT IN ('retirado', 'cancelado')`,
        [id]
      );

      if (parseInt(activeOrders.rows[0].count) > 0) {
        // Inativa ao invés de deletar
        await pool.query('UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2', ['inativo', id]);
        res.json({ message: 'Produto inativado pois está em pedidos ativos' });
        return;
      }

      // Remove imagem
      if (product.image_url) {
        const imgPath = path.join(__dirname, '../../', product.image_url);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }

      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      res.json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
