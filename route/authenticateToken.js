const express = require('express');
const { authenticateToken } = require('../middleware/authenticateMiddle');

const router = express.Router();

router.get('/protected-route', authenticateToken, (req, res) => {
    // Handle protected route
    res.status(200).json({ msg: 'Access granted', user: req.user });
});

module.exports = router;