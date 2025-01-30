const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log("Headers:", req.headers);
    console.log("Cookies:", req.cookies)
  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // If no Bearer token, check for httpOnly cookie
  else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  console.log(req.cookies.accessToken)

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in DB (excluding password)
    req.user = await Customer.findById(decoded._id).select("-password");
    
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Proceed to next middleware
    return next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
});


module.exports = {protect};
