// Importing dependencies
const express = require("express");
const dotenv = require("dotenv").config();
const connectDb = require("./config/db");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");

// Middleware for API key validation (commented out for now)
const apiKeyMiddleware = require("./authMiddleware");

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000','https://bgstudio-admin.vercel.app,',"https://bg-salon.vercel.app/"
        ];
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

// Application setup
const app = express();
const port = 8000;

// Middleware
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Utility function for structured responses
const sendResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        message,
        data,
    });
};

// Root route
app.get('/', (req, res) => {
    sendResponse(res, 200, 'Hello World! This is a success message');
});

// Routes
// Authentication routes
app.use("/api/auth", require("./route/userRoute"));
app.use("/api", require("./route/authenticateToken")); // Protected route

// Salon routes
app.use("/api/salon", require("./route/bookingRoute"));

// Poultry routes
app.use("/api/poultry", require("./route/poultryRoute"));
app.use("/api/poultry-order", require("./route/poultryOrderRoute"));
app.use("/api/poultry-shipping", require("./route/poultryShippingRoutes"));

// Hair product routes
app.use("/api/hair", require("./route/hairProductRoute"));
app.use("/api/hair-order", require("./route/hairOrderRoute"));
app.use("/api/hair-shipping", require("./route/hairShippingRoutes"));

// Uncomment when needed
// app.use('/api/hair-payments', require("./route/hairPaymentRoutes"));
// app.use('/api/poultry-payments', require("./route/poultryPaymentRoutes"));

// Database connection and server startup
connectDb();
app.listen(port, () => {
    console.log(`This is running on port ${port}`.green.bold);
});
