const asyncHandler = require('express-async-handler');
const PoultryProduct = require('../models/Poultry');

// Create a new product
const createProduct = asyncHandler(async (req, res) => {
    // Extract the image from req.files
    const image = req.files?.image?.[0]?.path; // Assuming Cloudinary or similar storage provides the file path

    // Extract other fields from req.body
    const { productName, category, price, stock } = req.body;

    // Validate required fields
    if (!image) {
        return res.status(400).json({ message: "Image is required" });
    }
    if (!productName || !category || !price || !stock) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new product instance
    const product = new PoultryProduct({
        productName,
        category,
        price,
        stock,
        image, // Save the image path
    });

    // Save the product to the database
    try {
        const savedProduct = await product.save();
        res.status(201).json({
            message: "Product created successfully",
            product: savedProduct,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create product",
            error: error.message,
        });
    }
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

    // Extract the new image if uploaded
    const image = req.files?.image?.[0]?.path; // Assuming Cloudinary or similar storage provides the file path

    // Construct the update object
    const updateFields = { ...req.body };

    if (image) {
        updateFields.image = image; // Add the new image path to the update
    }

    // Update the product in the database
    const updatedProduct = await PoultryProduct.findByIdAndUpdate(id, updateFields, {
        new: true, // Returns the updated document
        runValidators: true, // Ensures validation rules are applied
    });

    if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
    });
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

// Update sales for a product
const updateSales = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantitySold } = req.body;

    if (quantitySold <= 0) {
        return res.status(400).json({ message: 'Quantity sold must be greater than zero' });
    }

    const product = await PoultryProduct.findById(id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantitySold) {
        return res.status(400).json({ message: 'Insufficient stock to complete the sale' });
    }

    product.sales += quantitySold;
    product.stock -= quantitySold;

    await product.save();

    res.status(200).json({ 
        message: 'Sales updated successfully', 
        product 
    });
});

const searchAndFilterProducts = asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice, stockStatus } = req.query;

    const filter = {};

    // Search by product name
    if (search) {
        filter.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Filter by category
    if (category) {
        filter.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Filter by stock status
    if (stockStatus === 'inStock') {
        filter.stock = { $gt: 0 };
    } else if (stockStatus === 'outOfStock') {
        filter.stock = { $eq: 0 };
    }

    const products = await PoultryProduct.find(filter);

    res.status(200).json(products);
});

const deleteMultiplePoultryProducts = asyncHandler(async(req,res)=>{
    const {ids} = req.body;
    if(!ids || !Array.isArray(ids) || ids.length === 0){
        return res.status(400).json({ message: 'Invalid or missing IDs' });
    }

    const result = await PoultryProduct.deleteMany({_id:{$in:ids }});
    if(result.deletedCount ===0){
        return res.status(404).json({message:"no Poultry Product found to delete"})
    }
    res.status(200).json({
        message:`${result.deletedCount} Poultry Product (s) deleted successfully`,
        deletedCount:result.deletedCount
    })

})

module.exports={createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateSales,
    searchAndFilterProducts,
    deleteMultiplePoultryProducts
}