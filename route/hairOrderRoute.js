const express = require('express');
const {
  createHairOrder,
  verifyPayment,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/hairOrderController');

const router = express.Router();

// Create a new order
router.post('/', createHairOrder);

// Verify payment
router.get('/verify-payment', verifyPayment);

// Get all orders
router.get('/', getAllOrders);

// Get an order by ID
router.get('/:orderId', getOrderById);

// Update order status
router.patch('/:id/status', updateOrderStatus);

// Delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
