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
router.post('/orders', createOrder);

// Get all orders
router.get('/orders', getAllOrders);

// Get an order by ID
router.get('/orders/:id', getOrderById);

// Update order status
router.patch('/orders/:id/status', updateOrderStatus);

// Delete an order
router.delete('/orders/:id', deleteOrder);

module.exports = router;
