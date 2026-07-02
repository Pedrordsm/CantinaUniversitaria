import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { DbProduct, mapProduct } from '../types';

const router = Router();

const PRODUCT_SELECT = `
  SELECT p.*, c.nome AS categoria_nome
  FROM produto p
  LEFT JOIN categoria c ON c.idcategoria = p.fk_idcategoria
`;

// Converte o status do frontend (string) para BOOLEAN do banco
// 'disponivel' → true  |  'em_falta' / 'inativo' → false
function statusToBoolean(status: string): boolean {
  return status === 'disponivel';
}

// GET /api/products  (público — só situacao = true)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, category_id } = req.query;
    const params: unknown[] = [];
    const conditions: string[] = [];

    // Por padrão só retorna os disponíveis (situacao = true)
    // Se passou status explícito, filtra por ele
    if (status && status !== 'inativo') {
      params.push(statusToBoolean(String(status)));
      conditions.push(`p.situacao = $${params.length}`);
    } else if (!status) {
      // sem filtro: mostra todos os ativos (true)
      conditions.push(`p.situacao = true`);
    }
    // status=inativo → retorna vazio (não existe no schema, tratado no frontend)

    if (category_id) {
      params.push(category_id);
      conditions.push(`p.fk_idcategoria = $${params.length}`);
    }
    if (search) {
      params.push(`%${String(search).toLowerCase()}%`);
      conditions.push(`(LOWER(p.nome) LIKE $${params.length} OR LOWER(p.descricao) LIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query<DbProduct>(`${PRODUCT_SELECT} ${where} ORDER BY p.nome`, params);
    res.json(result.rows.map(mapProduct));
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/products/all  (funcionario+ — todos)
router.get('/all', authenticate, authorize('funcionario', 'gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<DbProduct>(`${PRODUCT_SELECT} ORDER BY p.nome`);
    res.json(result.rows.map(mapProduct));
  } catch (err) {
    console.error('Erro ao listar todos os produtos:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/products/:id  (público)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<DbProduct>(`${PRODUCT_SELECT} WHERE p.idproduto = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    res.json(mapProduct(result.rows[0]));
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/products  (funcionario+)
router.post('/', authenticate, authorize('funcionario', 'gerente'), upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, quantity, status, category_id } = req.body;

  if (!name || !price) {
    res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    return;
  }

  try {
    const qty = Number(quantity || 0);
    const situacao = status !== undefined ? statusToBoolean(status) : qty > 0;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query<DbProduct>(
      `INSERT INTO produto (nome, descricao, preco, quantidade, situacao, url_foto, fk_idcategoria)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description || '', price, qty, situacao, imageUrl, category_id || null]
    );

    const full = await pool.query<DbProduct>(`${PRODUCT_SELECT} WHERE p.idproduto = $1`, [result.rows[0].idproduto]);
    res.status(201).json(mapProduct(full.rows[0]));
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PUT /api/products/:id  (funcionario+)
router.put('/:id', authenticate, authorize('funcionario', 'gerente'), upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await pool.query<DbProduct>('SELECT * FROM produto WHERE idproduto = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const current = existing.rows[0];
    const { name, description, price, quantity, status, category_id } = req.body;

    let imageUrl = current.url_foto;
    if (req.file) {
      if (current.url_foto) {
        const oldPath = path.join(process.env.UPLOAD_DIR || 'uploads', path.basename(current.url_foto));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const novaSituacao = status !== undefined ? statusToBoolean(status) : current.situacao;

    await pool.query(
      `UPDATE produto
       SET nome = $1, descricao = $2, preco = $3, quantidade = $4,
           situacao = $5, url_foto = $6, fk_idcategoria = $7
       WHERE idproduto = $8`,
      [
        name ?? current.nome,
        description ?? current.descricao,
        price ?? current.preco,
        quantity ?? current.quantidade,
        novaSituacao,
        imageUrl,
        category_id ?? current.fk_idcategoria,
        id,
      ]
    );

    const full = await pool.query<DbProduct>(`${PRODUCT_SELECT} WHERE p.idproduto = $1`, [id]);
    res.json(mapProduct(full.rows[0]));
  } catch (err) {
    console.error('Erro ao editar produto:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PATCH /api/products/:id/status  (funcionario+)
router.patch('/:id/status', authenticate, authorize('funcionario', 'gerente'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ['disponivel', 'em_falta', 'inativo'];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: 'Status inválido' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE produto SET situacao = $1 WHERE idproduto = $2 RETURNING *`,
      [statusToBoolean(status), id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const full = await pool.query<DbProduct>(`${PRODUCT_SELECT} WHERE p.idproduto = $1`, [id]);
    res.json(mapProduct(full.rows[0]));
  } catch (err) {
    console.error('Erro ao alterar status:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE /api/products/:id  (funcionario+)
router.delete('/:id', authenticate, authorize('funcionario', 'gerente'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const activeOrders = await pool.query(
      `SELECT 1 FROM itens_pedido ip
       JOIN pedido pe ON pe.idpedido = ip.fk_idpedido
       WHERE ip.fk_idproduto = $1
         AND pe.situacao NOT IN ('retirado','cancelado')
       LIMIT 1`,
      [id]
    );

    if (activeOrders.rows.length > 0) {
      // Marca como indisponível em vez de deletar
      await pool.query(`UPDATE produto SET situacao = false WHERE idproduto = $1`, [id]);
      res.json({ message: 'Produto desativado pois está em pedidos ativos' });
      return;
    }

    const product = await pool.query<DbProduct>('SELECT url_foto FROM produto WHERE idproduto = $1', [id]);
    if (product.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    if (product.rows[0].url_foto) {
      const imgPath = path.join(process.env.UPLOAD_DIR || 'uploads', path.basename(product.rows[0].url_foto));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await pool.query('DELETE FROM produto WHERE idproduto = $1', [id]);
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
