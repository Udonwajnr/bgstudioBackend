const mongoose = require('mongoose');

const poultryProductSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    sales: {
        type: Number,
        default: 0,
        min: 0,
    },
    image: {
        type: String, // URL of the image
        required: true,
    },
});

const PoultryProduct = mongoose.model('PoultryProduct', poultryProductSchema);

module.exports = PoultryProduct;
