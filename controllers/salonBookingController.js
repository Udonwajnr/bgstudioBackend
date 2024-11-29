const express = require('express');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto'); // To generate unique code
const SalonBooking = require('../models/SalonBooking');
const sendEmail = require('../utils/sendEmail'); // Utility to send emails

const createBooking = asyncHandler(async (req, res) => {
    const { clientName, service, dateTime, phoneNumber, email, stylist } = req.body;

    if (!clientName || !service || !dateTime || !phoneNumber || !email || !stylist) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const date = new Date(dateTime);
    if (date <= new Date()) {
        return res.status(400).json({ message: 'Booking date must be in the future' });
    }

    const uniqueCode = crypto.randomBytes(4).toString('hex'); // Generate a unique code

    const newBooking = await SalonBooking.create({
        clientName,
        service,
        dateTime,
        phoneNumber,
        email,
        stylist,
        uniqueCode,
    });

    if(newBooking.email){
        const bookingDetails = `
            Hello ${clientName},
            
            Your booking has been confirmed:
            Service: ${service}
            Stylist: ${stylist}
            Date: ${date.toDateString()} at ${date.toLocaleTimeString()}
            Unique Code: ${uniqueCode}
            
            To cancel, click the link below:
            http://localhost:3000/api/salon/cancel/${uniqueCode}
        `;
    
        await sendEmail(email, 'Salon Booking Confirmation', bookingDetails);
    }
    // Send confirmation email

    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
});

const getBookings = asyncHandler(async (req, res) => {
    const bookings = await SalonBooking.find();
    res.status(200).json(bookings);
});

const updateBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await SalonBooking.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({ message: 'Booking status updated', booking });
});

const deleteBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find and delete the booking by ID
    const booking = await SalonBooking.findByIdAndDelete(id);

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({ message: 'Booking deleted successfully', booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
    const { uniqueCode } = req.params;

    const booking = await SalonBooking.findOne({ uniqueCode });

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'Completed') {
        return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    await booking.deleteOne();

    const cancellationMessage = `
        Hello ${booking.clientName},
        
        Your booking for ${booking.service} on ${booking.dateTime.toDateString()} has been cancelled.
    `;

    await sendEmail(booking.email, 'Salon Booking Cancellation', cancellationMessage);

    res.status(200).json({ message: 'Booking cancelled successfully' });
});

module.exports={ 
    createBooking,
    cancelBooking,
    getBookings,
    deleteBooking,
    updateBookingStatus
}