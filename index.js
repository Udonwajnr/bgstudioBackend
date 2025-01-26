// Importing dependencies
const express = require("express");
const dotenv = require("dotenv").config();
const connectDb = require("./config/db");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const MongoStore = require("connect-mongo");

// Middleware for API key validation (commented out for now)
const apiKeyMiddleware = require("./authMiddleware");

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://bgstudio-admin.vercel.app",
      "https://bg-salon.vercel.app",
      // "https://bgstudiobackend-1.onrender.com"
    ];
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
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

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret", // Replace with strong secret
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // MongoDB connection string
      ttl: 14 * 24 * 60 * 60, // Session expiration: 14 days
    }),
    cookie: {
      secure: true, // Use secure cookies in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration: 7 days
    },
  })
);

app.use((req, res, next) => {
  console.log('Session data:', req.session); // Log session data on every request
  next();
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Utility function for structured responses
const sendResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return next(err);
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.redirect('/'); // Redirect to the home or login page
    });
  });
});

// Root route
app.get("/", (req, res) => {
  sendResponse(res, 200, "Hello World! This is a success message");
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

// customer for the bg salon
app.use("/auth", require("./route/CustomerRoute"));
app.use("/api/customer", require("./route/customerProtectedRoute")); // Protected route

// Hair product routes
app.use("/api/hair", require("./route/hairProductRoute"));
app.use("/api/hair-order", require("./route/hairOrderRoute"));
app.use("/api/hair-shipping", require("./route/hairShippingRoutes"));

// Uncomment when needed
// app.use("/api/hair-payments", require("./route/hairPaymentRoutes"));
// app.use("/api/poultry-payments", require("./route/poultryPaymentRoutes"));

// Error logging middleware (optional)
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack || err.message); // Log errors globally
  res.status(500).send("Something went wrong!");
});

// Database connection and server startup
connectDb();
app.listen(port, () => {
  console.log(`This is running on port ${port}`.green.bold);
});
