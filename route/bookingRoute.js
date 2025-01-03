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
    deleteMultipleBookings
} = require('../controllers/salonBookingController');
// const {authenticateToken} = require("../middleware/authenticateMiddle");
// Routes

// router.use(authenticateToken)
router.post('/book', createBooking); // Create a booking
router.get('/', getBookings); // Get all bookings
router.get('/:id', getBooking); // Get all bookings
router.patch('/:id/status', updateBookingStatus); // Update booking status
router.put('/:id', updateBooking);
router.delete('/cancel/:uniqueCode', cancelBooking); // Cancel a booking
router.delete('/:id', deleteBooking); // Delete a booking by ID
router.post('/delete-multiple-bookings', deleteMultipleBookings);
module.exports = router;