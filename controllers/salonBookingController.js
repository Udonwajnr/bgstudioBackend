const express = require('express');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto'); // To generate unique code
const SalonBooking = require('../models/SalonBooking');
const sendEmail = require('../utils/sendEmail'); // Utility to send emails
const fs = require('fs');
const path = require('path');

// Read and convert the image to Base64
const imagePath = path.join(__dirname, '../IMG-20241130-WA0002.jpg'); // Replace with your image path
const imageBase64 = fs.readFileSync(imagePath).toString('base64');
// console.log(imageBase64)


const createBooking = asyncHandler(async (req, res) => {
    const { clientName, service, dateTime, phoneNumber, email, stylist } = req.body;

    if (!clientName || !service || !dateTime || !phoneNumber) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const normalizedEmail = email.toLowerCase();
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
        email:normalizedEmail,
        stylist,
        uniqueCode,
    });

    if(newBooking.email){
        const bookingDetails = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Confirmation - BG Unisex Salon</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f6f6;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <tr>
                        <td align="center" style="padding: 40px 0; background-color: #000000;">
                            <img src="https://res.cloudinary.com/djwombdbg/image/upload/f_auto,q_auto/x1ulyjciqb1r38h5c47j"alt="BG Unisex Salon" width="150" style="display: block;border-radius: 100%;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h1 style="color: #000000; font-size: 24px; margin-bottom: 20px; text-align: center;">Booking Confirmed!</h1>
                            <p style="color: #666666; font-size: 16px; line-height: 24px;">Hello ${clientName},</p>
                            <p style="color: #666666; font-size: 16px; line-height: 24px;">Your booking has been confirmed for the following service:</p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9; border-radius: 4px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px;"><strong>Service:</strong> ${service}</p>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px;"><strong>Date:</strong> ${date.toDateString()}</p>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px;"><strong>Time:</strong> ${date.toLocaleTimeString()}</p>
                                        <p style="color: #666666; font-size: 14px; margin: 0;"><strong>Booking Code:</strong> ${uniqueCode}</p>
                                    </td>
                                </tr>
                            </table>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="http://localhost:3000/api/salon/cancel/${uniqueCode}" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Cancel Booking</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f6f6f6; text-align: center;">
                            <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">BG Unisex Salon</p>
                            <div class="footer">
                                <p>&copy; ${new Date().getFullYear()} BG Unisex Salon. All rights reserved.</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
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

const getBooking = asyncHandler(async (req, res) => {
    const {id} = req.params
    const booking = await SalonBooking.findById(id);
    res.status(200).json(booking);
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

const updateBooking = asyncHandler(async (req, res) => {
    const { id } = req.params; // Booking ID
    const updates = req.body; // Data to update

    // Validate and process updates if `dateTime` is included
    if (updates.dateTime) {
        const newDateTime = new Date(updates.dateTime);
        const currentDateTime = new Date();

        if (newDateTime <= currentDateTime) {
            return res.status(400).json({ message: 'Booking date must be in the future.' });
        }
    }

    try {
        // Find the booking by ID
        const booking = await SalonBooking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // Update only fields present in the request
        Object.keys(updates).forEach((key) => {
            booking[key] = updates[key];
        });

        // Save the updated booking
        await booking.save();

        res.status(200).json({
            message: 'Booking updated successfully',
            booking,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking.', error: error.message });
    }
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

    // Find the booking by uniqueCode
    const booking = await SalonBooking.findOne({ uniqueCode });

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the booking is already completed
    if (booking.status === 'Completed') {
        return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    // Check if the booking is already cancelled
    if (booking.status === 'Cancelled') {
        return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Update the booking status to "Cancelled"
    booking.status = 'Cancelled';
    await booking.save();

    // Send a cancellation email
    const cancellationMessage = `
        Hello ${booking.clientName},

        Your booking for ${booking.service} on ${booking.dateTime.toDateString()} has been cancelled.
    `;

    await sendEmail(booking.email, 'Salon Booking Cancellation', cancellationMessage);

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
});

module.exports={ 
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    updateBookingStatus,
    cancelBooking,
    deleteBooking,
}