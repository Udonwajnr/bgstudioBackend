const asyncHandler = require('express-async-handler');
const HairProduct = require('../models/HairProduct');
const upload = require('../upload/multerConfig');

// Create a new Hair Product
const createHairProduct = asyncHandler(async (req, res) => {
    try {
      // Extract uploaded file URLs from Multer
      const photos = req.files.photos?.map((file) => file.path); // Cloudinary URLs for photos
      const video = req.files.video?.[0]?.path;                 // Cloudinary URL for video
  
      // Combine file URLs with the request body
      const productData = {
        ...req.body,
        photos,
        video,
      };
      
      console.log(req.body)
      // Automatically calculate discount price if provided
      if (productData.discountPrice && productData.discountPrice >= productData.price) {
        return res.status(400).json({ message: 'Discount price must be less than the original price' });
      }
  
      // Save the new product to the database
      const newProduct = new HairProduct(productData);
      const savedProduct = await newProduct.save();
      res.status(201).json({ success: true, data: savedProduct });
      
    } catch (error) {
        console.log('Error creating hair product:', error.stack || error);
        res.status(500).json({ success: false, message: 'An error occurred during video upload' });

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
    // Find the existing product
    const product = await HairProduct.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Extract new uploaded files
    const newPhotos = req.files.photos?.map((file) => file.path); // New photo URLs
    const newVideo = req.files.video?.[0]?.path;                 // New video URL

    // Merge new files with existing ones if not replacing
    const updatedPhotos = newPhotos
      ? [...(product.photos || []), ...newPhotos]
      : product.photos;

    const updatedVideo = newVideo || product.video;

    // Handle removal of specific photos or videos if specified
    if (req.body.removePhotos) {
      const photosToRemove = JSON.parse(req.body.removePhotos); // Expecting a JSON array of URLs
      photosToRemove.forEach((photo) => {
        const index = updatedPhotos.indexOf(photo);
        if (index > -1) updatedPhotos.splice(index, 1);
      });
    }

    if (req.body.removeVideo && updatedVideo === req.body.removeVideo) {
      updatedVideo = null;
    }

    // Combine updated data
    const updatedData = {
      ...req.body,
      photos: updatedPhotos,
      video: updatedVideo,
    };

    // Validate discount logic
    if (updatedData.discountPrice && updatedData.discountPrice >= updatedData.price) {
      return res.status(400).json({ message: 'Discount price must be less than the original price' });
    }

    // Update product in the database
    const updatedProduct = await HairProduct.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Error updating hair product:', error.stack || error);
    res.status(500).json({ success: false, message: 'An error occurred during product update' });
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