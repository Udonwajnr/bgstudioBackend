const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");

const protect = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Assumes Bearer token

    if (!token) {
        return res.status(401).json({ msg: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await Customer.findById(decoded._id).select("-password"); // Attach user object

        if (!req.user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        return res.status(403).json({ msg: 'Invalid token' });
    }
});

module.exports = { protect };
