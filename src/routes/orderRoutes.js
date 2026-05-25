const express = require('express');
const router = express.Router();
const { placeOrder, listOrders, getOrder, updateDeliveryStatus, deleteOrder } = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_id, items, delivery_address]
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               delivery_address:
 *                 type: string
 *                 example: KG 123 St, Kigali
 *               delivery_status:
 *                 type: string
 *                 enum: [pending, in_transit, delivered]
 *                 example: pending
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 example:
 *                   - product_id: 1
 *                     quantity: 2
 *                   - product_id: 2
 *                     quantity: 1
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order placed successfully
 *                 orderId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Validation failed / product not found / insufficient quantity
 */
router.post('/', authenticateToken, authorizeRoles('customer', 'admin', 'staff'), placeOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List all orders (admin/staff only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: query
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, in_transit, delivered]
 *           example: pending
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Orders list returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       customer_id:
 *                         type: integer
 *                         example: 1
 *                       customer_name:
 *                         type: string
 *                         example: Alice Doe
 *                       delivery_address:
 *                         type: string
 *                         example: KG 123 St, Kigali
 *                       delivery_status:
 *                         type: string
 *                         example: pending
 *                       created_at:
 *                         type: string
 *                         example: "2025-07-20T10:00:00.000Z"
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'staff'), listOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID including items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Order returned with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 customer_name:
 *                   type: string
 *                   example: Alice Doe
 *                 delivery_address:
 *                   type: string
 *                   example: KG 123 St, Kigali
 *                 delivery_status:
 *                   type: string
 *                   example: pending
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_name:
 *                         type: string
 *                         example: Sourdough Loaf
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                       price:
 *                         type: number
 *                         example: 4.99
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticateToken, getOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update delivery status (admin/staff only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_transit, delivered]
 *                 example: in_transit
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid delivery status
 *       404:
 *         description: Order not found
 */
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'staff'), updateDeliveryStatus);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order and restore inventory (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteOrder);

module.exports = router;
