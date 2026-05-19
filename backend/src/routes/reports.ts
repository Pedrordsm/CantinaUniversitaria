import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/reports/top-products - Produtos mais vendidos
router.get('/top-products', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, limit = '10' } = req.query;

    let dateFilter = '';
    const params: unknown[] = [];
    let paramCount = 1;

    if (start_date) {
      dateFilter += ` AND o.created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      dateFilter += ` AND o.created_at <= $${paramCount++}`;
      params.push(new Date(end_date as string).setHours(23, 59, 59));
    }

    params.push(parseInt(limit as string));

    const result = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.price,
        p.image_url,
        c.name as category_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status NOT IN ('cancelado')${dateFilter}
       GROUP BY p.id, p.name, p.price, p.image_url, c.name
       ORDER BY total_sold DESC
       LIMIT $${paramCount}`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro no relatório de produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/peak-hours - Horários de pico de retirada
router.get('/peak-hours', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params: unknown[] = [];
    let paramCount = 1;

    if (start_date) {
      dateFilter += ` AND updated_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      dateFilter += ` AND updated_at <= $${paramCount++}`;
      params.push(end_date);
    }

    const result = await pool.query(
      `SELECT
        EXTRACT(HOUR FROM updated_at) as hour,
        COUNT(*) as order_count,
        SUM(total) as total_revenue
       FROM orders
       WHERE status = 'retirado'${dateFilter}
       GROUP BY hour
       ORDER BY hour ASC`,
      params
    );

    // Preenche horas sem pedidos com 0
    const hourMap: Record<number, { hour: number; order_count: number; total_revenue: number }> = {};
    result.rows.forEach((row: { hour: string; order_count: string; total_revenue: string }) => {
      hourMap[parseInt(row.hour)] = {
        hour: parseInt(row.hour),
        order_count: parseInt(row.order_count),
        total_revenue: parseFloat(row.total_revenue),
      };
    });

    const allHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      order_count: hourMap[i]?.order_count || 0,
      total_revenue: hourMap[i]?.total_revenue || 0,
    }));

    res.json(allHours);
  } catch (error) {
    console.error('Erro no relatório de horários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/cancellations - Pedidos mais cancelados por produto
router.get('/cancellations', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params: unknown[] = [];
    let paramCount = 1;

    if (start_date) {
      dateFilter += ` AND o.created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      dateFilter += ` AND o.created_at <= $${paramCount++}`;
      params.push(end_date);
    }

    const result = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.image_url,
        COUNT(DISTINCT o.id) as cancel_count,
        SUM(oi.quantity) as total_quantity_cancelled,
        SUM(oi.subtotal) as total_value_cancelled
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'cancelado'${dateFilter}
       GROUP BY p.id, p.name, p.image_url
       ORDER BY cancel_count DESC
       LIMIT 10`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro no relatório de cancelamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/user-cancellations - Usuários que mais cancelam
router.get('/user-cancellations', authenticate, authorize('gerente'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.cancel_count,
        u.is_banned,
        u.created_at,
        COUNT(o.id) as total_orders,
        ROUND(
          CASE WHEN COUNT(o.id) > 0
            THEN (u.cancel_count::decimal / COUNT(o.id)) * 100
            ELSE 0
          END, 2
        ) as cancel_rate
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id
       WHERE u.role = 'cliente'
       GROUP BY u.id, u.name, u.email, u.cancel_count, u.is_banned, u.created_at
       ORDER BY u.cancel_count DESC
       LIMIT 20`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro no relatório de usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/summary - Resumo geral
router.get('/summary', authenticate, authorize('gerente'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const [ordersStats, productsStats, usersStats, revenueStats] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pendente') as pendente,
          COUNT(*) FILTER (WHERE status = 'aceito') as aceito,
          COUNT(*) FILTER (WHERE status = 'em_preparo') as em_preparo,
          COUNT(*) FILTER (WHERE status = 'pronto') as pronto,
          COUNT(*) FILTER (WHERE status = 'retirado') as retirado,
          COUNT(*) FILTER (WHERE status = 'cancelado') as cancelado
        FROM orders
      `),
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'disponivel') as disponivel,
          COUNT(*) FILTER (WHERE status = 'em_falta') as em_falta,
          COUNT(*) FILTER (WHERE status = 'inativo') as inativo
        FROM products
      `),
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE role = 'cliente') as clientes,
          COUNT(*) FILTER (WHERE is_banned = TRUE) as banidos
        FROM users
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(SUM(total) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as today_revenue,
          COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())), 0) as month_revenue
        FROM orders
        WHERE status NOT IN ('cancelado')
      `),
    ]);

    res.json({
      orders: ordersStats.rows[0],
      products: productsStats.rows[0],
      users: usersStats.rows[0],
      revenue: revenueStats.rows[0],
    });
  } catch (error) {
    console.error('Erro no resumo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
