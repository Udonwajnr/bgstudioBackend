const JWT = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const authenticateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Assumes Bearer token
    if (!token) {
        return res.status(401).json({ msg: 'No token provided' });
    }
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Debugging log
        req.user = decoded; // Attach the entire decoded token (which includes role)
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('Token verification failed:', err); // Log error for debugging
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        return res.status(403).json({ msg: 'Invalid token' });
    }
});

module.exports = { authenticateToken };
