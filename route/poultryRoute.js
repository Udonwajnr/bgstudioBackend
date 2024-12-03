const express = require('express');
const router = express.Router();
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/PoultryProductController');

// Create a product
router.post('/', createProduct);

// Get all products
router.get('/', getAllProducts);

// Get a single product by ID
router.get('/:id', getProductById);

// Update a product
router.put('/:id', updateProduct);

// Delete a product
router.delete('/:id', deleteProduct);

module.exports = router;
