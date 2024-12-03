const express = require('express');
const {
  createShipping,
  getAllShipping,
  getShippingById,
  updateShippingStatus,
  deleteShipping,
} = require('../controllers/hairShippingController');

const router = express.Router();

// Create a new shipping entry
router.post('/shipping', createShipping);

// Get all shipping entries
router.get('/shipping', getAllShipping);

// Get a shipping entry by ID
router.get('/shipping/:id', getShippingById);

// Update shipping status
router.patch('/shipping/:id/status', updateShippingStatus);

// Delete a shipping entry
router.delete('/shipping/:id', deleteShipping);

module.exports = router;
