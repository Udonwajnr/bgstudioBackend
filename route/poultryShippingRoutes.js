const express = require('express');
const {
  createShipping,
  getAllShipping,
  getShippingById,
  updateShippingStatus,
  deleteShipping,
} = require('../controllers/poultryShippingController');

const router = express.Router();

// Create a new shipping entry
router.post('/', createShipping);

// Get all shipping entries
router.get('/', getAllShipping);

// Get a shipping entry by ID
router.get('/:id', getShippingById);

// Update shipping status
router.patch('/:id/status', updateShippingStatus);

// Delete a shipping entry
router.delete('/:id', deleteShipping);

module.exports = router;