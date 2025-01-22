const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer"); // Adjust the path to your Customer model

const protect = asyncHandler(async (req, res, next) => {
  let token;
  // Check if the token is provided in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Extract the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the token

      // Attach the user object to `req` for downstream usage
      req.user = await Customer.findById(decoded.id).select("-password"); // Exclude the password field
      if (!req.user) {
        res.status(404);
        throw new Error("User not found");
      }

      next(); // Continue to the next middleware or route handler
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

module.exports = { protect };
