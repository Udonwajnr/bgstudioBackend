const express = require('express');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/hairOrderController');

const router = express.Router();

// Create a new order
router.post('/', createOrder);

// Get all orders
router.get('/', getAllOrders);

// Get an order by ID
router.get('/:id', getOrderById);

// Update order status
router.patch('/:id/status', updateOrderStatus);

// Delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
