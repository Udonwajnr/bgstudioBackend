const asyncHandler = require('express-async-handler');
const HairProduct = require('../models/HairProduct');

// Create a new Hair Product
const createHairProduct = asyncHandler(async (req, res) => {
    try {
        const newProduct = new HairProduct(req.body);

        // Automatically calculate discount price if provided
        if (req.body.discountPrice && req.body.discountPrice >= req.body.price) {
            return res.status(400).json({ message: 'Discount price must be less than the original price' });
        }

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all Hair Products with filtering, sorting, pagination, and search
const getAllHairProducts = asyncHandler(async (req, res) => {
    const {
        category,
        productType,
        hairType,
        search,
        sortBy = 'createdAt', // Sort by createdAt by default
        order = 'desc', // Default order: descending
        minPrice,
        maxPrice,
        inStock,
        page = 1,
        limit = 10,
    } = req.query;

    const filter = {};

    // Apply filters
    if (category) filter.category = category;
    if (productType) filter.productType = productType;
    if (hairType) filter.hairType = hairType;
    if (minPrice) filter.price = { ...filter.price, $gte: minPrice };
    if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };
    if (inStock) filter.quantity = { $gt: 0 };
    if (search) filter.name = { $regex: search, $options: 'i' };

    try {
        const products = await HairProduct.find(filter)
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const totalProducts = await HairProduct.countDocuments(filter);

        res.status(200).json({
            totalProducts,
            currentPage: Number(page),
            totalPages: Math.ceil(totalProducts / limit),
            products,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single Hair Product by ID
const getHairProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const product = await HairProduct.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a Hair Product
const updateHairProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const updatedProduct = await HairProduct.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check discount logic
        if (req.body.discountPrice && req.body.discountPrice >= updatedProduct.price) {
            return res.status(400).json({ message: 'Discount price must be less than the original price' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a Hair Product
const deleteHairProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const deletedProduct = await HairProduct.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Stock for Hair Product
const updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantitySold } = req.body;

    try {
        const product = await HairProduct.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (quantitySold > product.quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        product.quantity -= quantitySold;
        await product.save();

        res.status(200).json({
            message: 'Stock updated successfully',
            product,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports ={createHairProduct,getAllHairProducts,getHairProductById,updateHairProduct,deleteHairProduct,updateStock}