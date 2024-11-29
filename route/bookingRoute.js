const express = require('express');
const router = express.Router();
const {
    createBooking,
    cancelBooking,
    getBookings,
    updateBookingStatus,
    deleteBooking
} = require('../controllers/salonBookingController');

// Routes
router.post('/', createBooking); // Create a booking
router.get('/', getBookings); // Get all bookings
router.patch('/:id/status', updateBookingStatus); // Update booking status
router.delete('/cancel/:uniqueCode', cancelBooking); // Cancel a booking
router.delete('/:id', deleteBooking); // Delete a booking by ID

module.exports = router;
