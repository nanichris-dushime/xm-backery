const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  placeOrder,
  getOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

// IMPORTANT: /my must be declared before /:id to avoid route conflict
router.get('/my',    auth, role('customer'),        getMyOrders);
router.post('/',     auth, role('admin', 'customer'), placeOrder);
router.get('/',      auth, role('admin'),             getOrders);
router.get('/:id',   auth, role('admin', 'customer'), getOrder);
router.put('/:id/status', auth, role('admin'),        updateOrderStatus);
router.delete('/:id', auth, role('admin'),            deleteOrder);

module.exports = router;
