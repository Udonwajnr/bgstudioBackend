const asyncHandler = require('express-async-handler');
const PoultryProduct = require('../models/Poultry');

// Create a new product
const createProduct = asyncHandler(async (req, res) => {
    const { productName, category, price, stock } = req.body;

    const newProduct = await PoultryProduct.create({
        productName,
        category,
        price,
        stock,
    });

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
});

// Get all products
const getAllProducts = asyncHandler(async (req, res) => {
    const products = await PoultryProduct.find();
    res.status(200).json(products);
});

// Get a single product by ID
const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await PoultryProduct.findById(id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
});

// Update a product
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const updatedProduct = await PoultryProduct.findByIdAndUpdate(id, req.body, {
        new: true, // Returns the updated document
        runValidators: true, // Ensures validation rules are applied
    });

    if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
});

// Delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await PoultryProduct.findByIdAndDelete(id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
});


module.exports={createProduct,getAllProducts,getProductById,updateProduct,deleteProduct}