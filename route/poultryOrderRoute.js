const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  verifyPayment,
  
} = require('../controllers/poultryOrderController');

// CRUD endpoints for orders
router.get('/', getAllOrders);
router.get('/:orderId', getOrderById);
router.post('/', createOrder);
router.post('/verify-payment', verifyPayment);
router.put('/:id', updateOrderStatus);
router.delete('/:id', deleteOrder);

module.exports = router;