const mongoose = require('mongoose');

const PoultryProductSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
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
        default: 0, // Starts with 0 sales
        min: 0,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('PoultryProduct', PoultryProductSchema);
