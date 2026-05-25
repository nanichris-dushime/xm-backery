const db = require('../config/db');

async function salesReport(req, res, next) {
  try {
    const { from, to } = req.query;
    const filters = [];
    const values  = [];

    if (from) { filters.push('DATE(o.created_at) >= ?'); values.push(from); }
    if (to)   { filters.push('DATE(o.created_at) <= ?'); values.push(to); }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const [daily] = await db.query(
      `SELECT
         DATE(o.created_at)            AS date,
         COUNT(DISTINCT o.id)          AS orders_count,
         SUM(oi.quantity)              AS items_sold,
         SUM(oi.quantity * oi.price)   AS revenue
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       ${where}
       GROUP BY DATE(o.created_at)
       ORDER BY DATE(o.created_at) DESC`,
      values
    );

    const [[totals]] = await db.query(
      `SELECT
         COUNT(DISTINCT o.id)         AS total_orders,
         SUM(oi.quantity)             AS total_items_sold,
         SUM(oi.quantity * oi.price)  AS total_revenue
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       ${where}`,
      values
    );

    const [topProducts] = await db.query(
      `SELECT
         p.id,
         p.name,
         p.category,
         SUM(oi.quantity)             AS units_sold,
         SUM(oi.quantity * oi.price)  AS revenue
       FROM order_items oi
       JOIN orders o   ON o.id  = oi.order_id
       JOIN products p ON p.id  = oi.product_id
       ${where}
       GROUP BY p.id, p.name, p.category
       ORDER BY revenue DESC
       LIMIT 5`,
      values
    );

    res.json({
      period: { from: from || 'all time', to: to || 'all time' },
      summary: totals,
      daily,
      top_products: topProducts,
    });
  } catch (err) {
    next(err);
  }
}

async function totalRevenue(req, res, next) {
  try {
    const { from, to } = req.query;
    const filters = [];
    const values  = [];

    if (from) { filters.push('DATE(o.created_at) >= ?'); values.push(from); }
    if (to)   { filters.push('DATE(o.created_at) <= ?'); values.push(to); }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const [[row]] = await db.query(
      `SELECT
         COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue,
         COUNT(DISTINCT o.id)                      AS total_orders,
         COALESCE(SUM(oi.quantity), 0)             AS total_items_sold
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       ${where}`,
      values
    );

    res.json({ period: { from: from || 'all time', to: to || 'all time' }, ...row });
  } catch (err) {
    next(err);
  }
}

async function inventoryLevels(req, res, next) {
  try {
    const { category, sortBy, order } = req.query;
    const filters = [];
    const values  = [];

    let sql = `
      SELECT
        id, name, category, description,
        price, quantity,
        CASE
          WHEN quantity = 0   THEN 'out_of_stock'
          WHEN quantity <= 10 THEN 'low_stock'
          ELSE                     'in_stock'
        END AS stock_status
      FROM products
      WHERE 1=1
    `;

    if (category) { filters.push('category = ?'); values.push(category); }
    if (filters.length) sql += ' AND ' + filters.join(' AND ');

    const sortableColumns = ['name', 'price', 'category', 'quantity'];
    const col   = sortableColumns.includes(sortBy) ? sortBy : 'quantity';
    const dir   = order === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${col} ${dir}`;

    const [rows] = await db.query(sql, values);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function lowStockAlerts(req, res, next) {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 10;
    const [rows] = await db.query(
      `SELECT
         id, name, category, quantity, price,
         CASE WHEN quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END AS status
       FROM products
       WHERE quantity <= ?
       ORDER BY quantity ASC`,
      [threshold]
    );

    res.json({
      threshold,
      count: rows.length,
      alerts: rows,
    });
  } catch (err) {
    next(err);
  }
}

async function inventorySummary(req, res, next) {
  try {
    const [[overall]] = await db.query(
      `SELECT
         COUNT(*)                                          AS total_products,
         SUM(quantity)                                     AS total_units,
         SUM(quantity * price)                             AS total_inventory_value,
         SUM(CASE WHEN quantity = 0   THEN 1 ELSE 0 END)  AS out_of_stock_count,
         SUM(CASE WHEN quantity <= 10 AND quantity > 0 THEN 1 ELSE 0 END) AS low_stock_count,
         SUM(CASE WHEN quantity > 10  THEN 1 ELSE 0 END)  AS in_stock_count
       FROM products`
    );

    const [byCategory] = await db.query(
      `SELECT
         category,
         COUNT(*)             AS products,
         SUM(quantity)        AS total_units,
         SUM(quantity*price)  AS inventory_value,
         MIN(price)           AS min_price,
         MAX(price)           AS max_price,
         AVG(price)           AS avg_price
       FROM products
       GROUP BY category
       ORDER BY inventory_value DESC`
    );

    res.json({ overall, by_category: byCategory });
  } catch (err) {
    next(err);
  }
}

async function customerOrdersReport(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT
         c.id    AS customer_id,
         c.name,
         c.email,
         c.phone,
         COUNT(DISTINCT o.id)         AS orders_count,
         COALESCE(SUM(oi.quantity * oi.price), 0) AS total_spent
       FROM customers c
       LEFT JOIN orders      o  ON c.id = o.customer_id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY c.id, c.name, c.email, c.phone
       ORDER BY total_spent DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  salesReport,
  totalRevenue,
  inventoryLevels,
  lowStockAlerts,
  inventorySummary,
  customerOrdersReport,
};
