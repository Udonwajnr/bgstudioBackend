const express = require("express");
const { protect } = require("../middleware/customerMiddleware");
const router = express.Router();
const asyncHandler = require("express-async-handler")
router.get("/profile", protect, asyncHandler(async (req, res) => {
  res.status(200).json(req.user); // `req.user` contains the user data from the middleware
}));

module.exports = router;
