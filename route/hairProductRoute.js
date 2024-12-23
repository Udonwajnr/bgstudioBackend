const express = require('express');
const router = express.Router();
const upload = require("../upload/multerConfig")
const {
    createHairProduct,
    getAllHairProducts,
    getHairProductById,
    updateHairProduct,
    deleteHairProduct,
    updateStock,
} = require('../controllers/HairProductController');

// Create a new Hair Product
router.post('/', upload.fields([
    { name: 'photos', maxCount: 5 }, // Allow up to 5 photos
    { name: 'video', maxCount: 1 }, // Allow only 1 video
  ]),createHairProduct,);

// Get all Hair Products with filtering, sorting, and pagination
router.get('/', getAllHairProducts);

// Get a single Hair Product by ID
router.get('/:id', getHairProductById);

// Update a Hair Product
router.put('/:id', updateHairProduct);

// Delete a Hair Product
router.delete('/:id', deleteHairProduct);

// Update Stock
router.put('/:id/stock', updateStock);

module.exports = router;
