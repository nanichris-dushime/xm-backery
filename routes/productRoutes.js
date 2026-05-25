const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const {
  validateProduct
} = require('../middleware/validation');

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');


// CREATE
router.post(
  '/',
  auth,
  role('admin'),
  validateProduct,
  createProduct
);


// GET ALL
router.get('/', auth, getProducts);


// GET SINGLE
router.get('/:id', auth, getProduct);


// UPDATE
router.put(
  '/:id',
  auth,
  role('admin'),
  validateProduct,
  updateProduct
);


// DELETE
router.delete(
  '/:id',
  auth,
  role('admin'),
  deleteProduct
);


module.exports = router;