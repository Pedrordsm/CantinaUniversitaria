import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/reports/summary
router.get('/summary', authenticate, authorize('gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const [orders, products, users, revenue] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE situacao = 'pendente')::int    AS pendente,
          COUNT(*) FILTER (WHERE situacao = 'aceito')::int      AS aceito,
          COUNT(*) FILTER (WHERE situacao = 'em_preparo')::int  AS em_preparo,
          COUNT(*) FILTER (WHERE situacao = 'pronto')::int      AS pronto,
          COUNT(*) FILTER (WHERE situacao = 'retirado')::int    AS retirado,
          COUNT(*) FILTER (WHERE situacao = 'cancelado')::int   AS cancelado
        FROM pedido
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE situacao = true)::int   AS disponivel,
          COUNT(*) FILTER (WHERE situacao = false)::int  AS em_falta,
          0::int                                         AS inativo
        FROM produto
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE funcao = 'cliente')::int  AS clientes,
          COUNT(*) FILTER (WHERE eh_banido = TRUE)::int    AS banidos
        FROM usuario
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(valor_total), 0)::float AS total_revenue,
          COALESCE(SUM(valor_total) FILTER (WHERE data_inicio::date = NOW()::date), 0)::float AS today_revenue,
          COALESCE(SUM(valor_total) FILTER (WHERE
            DATE_TRUNC('month', data_inicio) = DATE_TRUNC('month', NOW())
          ), 0)::float AS month_revenue
        FROM pedido
        WHERE situacao != 'cancelado'
      `),
    ]);

    res.json({
      orders: orders.rows[0],
      products: products.rows[0],
      users: users.rows[0],
      revenue: revenue.rows[0],
    });
  } catch (err) {
    console.error('Erro ao gerar resumo:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/reports/top-products
router.get('/top-products', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.max(0, Math.floor(Number(req.query.limit || 0)));
    const params: unknown[] = [];
    const limitClause = limit > 0 ? `LIMIT $${(params.push(limit), params.length)}` : '';

    const result = await pool.query(`
      SELECT
        p.idproduto::text      AS id,
        p.nome                 AS name,
        p.preco::float         AS price,
        p.situacao             AS status,
        SUM(ip.quantidade)::int        AS total_sold,
        SUM(ip.subtotal)::float        AS total_revenue,
        COUNT(DISTINCT ip.fk_idpedido)::int AS order_count
      FROM itens_pedido ip
      JOIN produto p ON p.idproduto = ip.fk_idproduto
      JOIN pedido pe ON pe.idpedido = ip.fk_idpedido
      WHERE pe.situacao != 'cancelado'
      GROUP BY p.idproduto, p.nome, p.preco, p.situacao
      ORDER BY total_sold DESC, total_revenue DESC, name ASC
      ${limitClause}
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao gerar top produtos:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/reports/peak-hours
router.get('/peak-hours', authenticate, authorize('gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM data_fim)::int AS hour,
        COUNT(*)::int                    AS order_count,
        COALESCE(SUM(valor_total), 0)::float AS total_revenue
      FROM pedido
      WHERE situacao = 'retirado' AND data_fim IS NOT NULL
      GROUP BY hour
      ORDER BY hour
    `);

    const hours = Array.from({ length: 24 }, (_, h) => {
      const found = result.rows.find((r: { hour: number }) => r.hour === h);
      return { hour: h, order_count: found?.order_count ?? 0, total_revenue: found?.total_revenue ?? 0 };
    });

    res.json(hours);
  } catch (err) {
    console.error('Erro ao gerar horários de pico:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/reports/cancellations
router.get('/cancellations', authenticate, authorize('gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        p.idproduto::text      AS id,
        p.nome                 AS name,
        p.preco::float         AS price,
        p.situacao             AS status,
        COUNT(DISTINCT pe.idpedido)::int     AS cancel_count,
        COALESCE(SUM(ip.subtotal), 0)::float AS total_value_cancelled
      FROM itens_pedido ip
      JOIN produto p ON p.idproduto = ip.fk_idproduto
      JOIN pedido pe ON pe.idpedido = ip.fk_idpedido
      WHERE pe.situacao = 'cancelado'
      GROUP BY p.idproduto, p.nome, p.preco, p.situacao
      ORDER BY cancel_count DESC, total_value_cancelled DESC, name ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao gerar relatório de cancelamentos:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/reports/user-cancellations
router.get('/user-cancellations', authenticate, authorize('gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        u.idusuario::text  AS id,
        u.nome             AS name,
        u.email,
        u.qtd_cancelamentos AS cancel_count,
        u.eh_banido         AS is_banned
      FROM usuario u
      WHERE u.funcao = 'cliente'
      ORDER BY u.qtd_cancelamentos DESC, u.nome ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao gerar relatório de cancelamentos por usuário:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
