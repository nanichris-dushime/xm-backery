const express = require('express');
const router = express.Router();
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  listCategories,
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog management
 */

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: List all unique product categories
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of category names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Breads", "Pastries", "Cakes"]
 */
router.get('/categories', authenticateToken, listCategories);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products with filters, search, sorting and pagination
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Search by name, description or category
 *         schema:
 *           type: string
 *           example: sourdough
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           example: Breads
 *       - name: minPrice
 *         in: query
 *         schema:
 *           type: number
 *           example: 1.00
 *       - name: maxPrice
 *         in: query
 *         schema:
 *           type: number
 *           example: 20.00
 *       - name: minQuantity
 *         in: query
 *         schema:
 *           type: integer
 *           example: 0
 *       - name: maxQuantity
 *         in: query
 *         schema:
 *           type: integer
 *           example: 100
 *       - name: sortBy
 *         in: query
 *         description: "Field to sort by: name, price, category, quantity, created_at"
 *         schema:
 *           type: string
 *           example: price
 *       - name: order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: asc
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
 *         description: Paginated product list
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
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 pages:
 *                   type: integer
 *                   example: 1
 *                 data:
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
 *                       description:
 *                         type: string
 *                         example: Classic tangy sourdough
 *                       price:
 *                         type: number
 *                         example: 4.99
 *                       category:
 *                         type: string
 *                         example: Breads
 *                       quantity:
 *                         type: integer
 *                         example: 50
 */
router.get('/', authenticateToken, listProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (admin/staff only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, category, quantity]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sourdough Loaf
 *               description:
 *                 type: string
 *                 example: Classic tangy sourdough
 *               price:
 *                 type: number
 *                 example: 4.99
 *               category:
 *                 type: string
 *                 example: Breads
 *               quantity:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product created
 *                 productId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Insufficient privileges
 */
router.post('/', authenticateToken, authorizeRoles('admin', 'staff'), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
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
 *         description: Product found
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
 *                   example: Sourdough Loaf
 *                 description:
 *                   type: string
 *                   example: Classic tangy sourdough
 *                 price:
 *                   type: number
 *                   example: 4.99
 *                 category:
 *                   type: string
 *                   example: Breads
 *                 quantity:
 *                   type: integer
 *                   example: 50
 *       404:
 *         description: Product not found
 */
router.get('/:id', authenticateToken, getProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product (admin/staff only)
 *     tags: [Products]
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
 *                 example: Sourdough Loaf
 *               description:
 *                 type: string
 *                 example: Updated description
 *               price:
 *                 type: number
 *                 example: 5.99
 *               category:
 *                 type: string
 *                 example: Breads
 *               quantity:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       200:
 *         description: Product updated
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Product not found
 */
router.put('/:id', authenticateToken, authorizeRoles('admin', 'staff'), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product (admin only)
 *     tags: [Products]
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
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteProduct);

module.exports = router;
