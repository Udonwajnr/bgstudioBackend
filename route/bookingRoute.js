const express = require('express');
const router = express.Router();
const {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    cancelBooking,
} = require('../controllers/salonBookingController');

// Routes
router.post('/book', createBooking); // Create a booking
router.get('/', getBookings); // Get all bookings
router.get('/:id', getBooking); // Get all bookings
router.patch('/:id/status', updateBookingStatus); // Update booking status
router.put('/:id', updateBooking);
router.delete('/cancel/:uniqueCode', cancelBooking); // Cancel a booking
router.delete('/:id', deleteBooking); // Delete a booking by ID

module.exports = router;