const express = require('express');
const router = express.Router();
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateSales,
    searchAndFilterProducts,
    deleteMultiplePoultryProducts
} = require('../controllers/PoultryProductController');

 // Search and filter products
router.get('/search', searchAndFilterProducts);

// Create a product
router.post('/', createProduct);

// Get all products
router.get('/', getAllProducts);

// Get a single product by ID
router.get('/:id', getProductById);

// Update a product
router.put('/:id', updateProduct);

// Update sales
router.put('/:id/sales', updateSales); 

// Delete a product
router.delete('/:id', deleteProduct);

router.post('/delete-multiple-poultry-product', deleteMultiplePoultryProducts);


module.exports = router;
