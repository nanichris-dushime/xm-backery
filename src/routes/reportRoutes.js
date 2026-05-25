const express = require('express');
const router  = express.Router();
const {
  salesReport,
  totalRevenue,
  inventoryLevels,
  lowStockAlerts,
  inventorySummary,
  customerOrdersReport,
} = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const adminStaff = [authenticateToken, authorizeRoles('admin', 'staff')];

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytics and reporting (admin/staff only)
 */

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Daily sales report with optional date range
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: from
 *         in: query
 *         description: Start date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           example: "2025-07-01"
 *       - name: to
 *         in: query
 *         description: End date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           example: "2025-07-31"
 *     responses:
 *       200:
 *         description: Daily breakdown + summary + top 5 products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       example: "2025-07-01"
 *                     to:
 *                       type: string
 *                       example: "2025-07-31"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_orders:
 *                       type: integer
 *                       example: 10
 *                     total_items_sold:
 *                       type: integer
 *                       example: 35
 *                     total_revenue:
 *                       type: number
 *                       example: 174.65
 *                 daily:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2025-07-20"
 *                       orders_count:
 *                         type: integer
 *                         example: 3
 *                       items_sold:
 *                         type: integer
 *                         example: 8
 *                       revenue:
 *                         type: number
 *                         example: 49.92
 *                 top_products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Sourdough Loaf
 *                       units_sold:
 *                         type: integer
 *                         example: 12
 *                       revenue:
 *                         type: number
 *                         example: 59.88
 */
router.get('/sales', ...adminStaff, salesReport);

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Total revenue with optional date range
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: from
 *         in: query
 *         schema:
 *           type: string
 *           example: "2025-07-01"
 *       - name: to
 *         in: query
 *         schema:
 *           type: string
 *           example: "2025-07-31"
 *     responses:
 *       200:
 *         description: Total revenue, orders and items sold
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       example: "2025-07-01"
 *                     to:
 *                       type: string
 *                       example: "2025-07-31"
 *                 total_revenue:
 *                   type: number
 *                   example: 174.65
 *                 total_orders:
 *                   type: integer
 *                   example: 10
 *                 total_items_sold:
 *                   type: integer
 *                   example: 35
 */
router.get('/revenue', ...adminStaff, totalRevenue);

/**
 * @swagger
 * /api/reports/inventory:
 *   get:
 *     summary: All inventory levels with stock status
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           example: Breads
 *       - name: sortBy
 *         in: query
 *         description: "name, price, category or quantity"
 *         schema:
 *           type: string
 *           example: quantity
 *       - name: order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: asc
 *     responses:
 *       200:
 *         description: Products with in_stock / low_stock / out_of_stock status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Sourdough Loaf
 *                   category:
 *                     type: string
 *                     example: Breads
 *                   price:
 *                     type: number
 *                     example: 4.99
 *                   quantity:
 *                     type: integer
 *                     example: 5
 *                   stock_status:
 *                     type: string
 *                     enum: [in_stock, low_stock, out_of_stock]
 *                     example: low_stock
 */
router.get('/inventory', ...adminStaff, inventoryLevels);

/**
 * @swagger
 * /api/reports/low-stock:
 *   get:
 *     summary: Products at or below stock threshold
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: threshold
 *         in: query
 *         description: Quantity threshold (default 10)
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Low stock alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threshold:
 *                   type: integer
 *                   example: 10
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Sourdough Loaf
 *                       quantity:
 *                         type: integer
 *                         example: 3
 *                       status:
 *                         type: string
 *                         example: low_stock
 */
router.get('/low-stock', ...adminStaff, lowStockAlerts);

/**
 * @swagger
 * /api/reports/inventory-summary:
 *   get:
 *     summary: Inventory summary — totals and breakdown by category
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall totals and per-category breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: object
 *                   properties:
 *                     total_products:
 *                       type: integer
 *                       example: 10
 *                     total_units:
 *                       type: integer
 *                       example: 250
 *                     total_inventory_value:
 *                       type: number
 *                       example: 1245.50
 *                     out_of_stock_count:
 *                       type: integer
 *                       example: 1
 *                     low_stock_count:
 *                       type: integer
 *                       example: 2
 *                     in_stock_count:
 *                       type: integer
 *                       example: 7
 *                 by_category:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: Breads
 *                       products:
 *                         type: integer
 *                         example: 4
 *                       total_units:
 *                         type: integer
 *                         example: 120
 *                       inventory_value:
 *                         type: number
 *                         example: 598.80
 */
router.get('/inventory-summary', ...adminStaff, inventorySummary);

/**
 * @swagger
 * /api/reports/customer-orders:
 *   get:
 *     summary: Customer orders report ranked by total spent
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All customers ranked by total amount spent
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   customer_id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Alice Doe
 *                   email:
 *                     type: string
 *                     example: alice@email.com
 *                   orders_count:
 *                     type: integer
 *                     example: 5
 *                   total_spent:
 *                     type: number
 *                     example: 124.95
 */
router.get('/customer-orders', ...adminStaff, customerOrdersReport);

module.exports = router;
