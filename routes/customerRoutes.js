const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const role = require('../middleware/role');

const {
  validateCustomer
} = require('../middleware/validation');

const {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');


// CREATE
router.post(
  '/',
  auth,
  role('admin'),
  validateCustomer,
  createCustomer
);


// GET ALL
router.get('/', auth, getCustomers);


// UPDATE
router.put(
  '/:id',
  auth,
  role('admin'),
  validateCustomer,
  updateCustomer
);


// DELETE
router.delete(
  '/:id',
  auth,
  role('admin'),
  deleteCustomer
);


module.exports = router;