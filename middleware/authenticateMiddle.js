const JWT = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const authenticateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization']; // Retrieve Authorization header
    const token = authHeader && authHeader.split(' ')[1]; // Assumes Bearer token format

    if (!token) {
        return res.status(401).json({ msg: 'No token provided' }); // 401 Unauthorized
    }

    try {
        // Verify token using secret key
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        // console.log('Decoded token:', decoded); // Debug log (remove in production)

        // Attach necessary fields to req.user
        req.user = { id: decoded.id, role: decoded.role, username:decoded.username, email:decoded.email, isVerified:decoded.isVerified}; // Attach only required data
        next(); // Proceed to next middleware
    } catch (err) {
        console.error('Token verification failed:', err); // Debugging log
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' }); // Specific error for expired token
        }
        return res.status(403).json({ msg: 'Invalid token' }); // 403 Forbidden for invalid token
    }
});

module.exports = { authenticateToken };
