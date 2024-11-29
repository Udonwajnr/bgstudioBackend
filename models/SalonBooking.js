const mongoose = require('mongoose');

const salonBookingSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true,
    },
    service: {
        type: String,
        required: true,
    },
    dateTime: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > new Date(); // Ensures the booking is not in the past
            },
            message: 'Booking date must be in the future',
        },
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending',
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    stylist: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        default: 50,
    },
    uniqueCode: {
        type: String,
        required: true,
        unique: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('SalonBooking', salonBookingSchema);
