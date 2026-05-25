const express = require('express');
const router = express.Router();
const { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: List all customers (admin/staff only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
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
 *                     example: Alice Doe
 *                   email:
 *                     type: string
 *                     example: alice@email.com
 *                   phone:
 *                     type: string
 *                     example: "+250 78 000 0000"
 *                   address:
 *                     type: string
 *                     example: KG 123 St, Kigali
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient privileges
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'staff'), listCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customers]
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
 *         description: Customer found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Alice Doe
 *                 email:
 *                   type: string
 *                   example: alice@email.com
 *                 phone:
 *                   type: string
 *                   example: "+250 78 000 0000"
 *                 address:
 *                   type: string
 *                   example: KG 123 St, Kigali
 *       404:
 *         description: Customer not found
 */
router.get('/:id', authenticateToken, authorizeRoles('admin', 'staff', 'customer'), getCustomer);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer (admin/staff only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alice Doe
 *               email:
 *                 type: string
 *                 example: alice@email.com
 *               phone:
 *                 type: string
 *                 example: "+250 78 000 0000"
 *               address:
 *                 type: string
 *                 example: KG 123 St, Kigali
 *     responses:
 *       201:
 *         description: Customer created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Customer created
 *                 customerId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email already exists
 */
router.post('/', authenticateToken, authorizeRoles('admin', 'staff'), createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update a customer (admin/staff only)
 *     tags: [Customers]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alice Doe
 *               email:
 *                 type: string
 *                 example: alice@email.com
 *               phone:
 *                 type: string
 *                 example: "+250 78 111 1111"
 *               address:
 *                 type: string
 *                 example: KG 456 St, Kigali
 *     responses:
 *       200:
 *         description: Customer updated
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Customer not found
 */
router.put('/:id', authenticateToken, authorizeRoles('admin', 'staff'), updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete a customer (admin only)
 *     tags: [Customers]
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
 *         description: Customer deleted
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteCustomer);

module.exports = router;
