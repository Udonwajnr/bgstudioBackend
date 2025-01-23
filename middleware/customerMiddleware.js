const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer"); // Adjust the path to your Customer model

const protect = asyncHandler(async (req, res, next) => {
  // Debug Logs
  console.log("Authorization Header:", req.headers.authorization);
  console.log("Is Authenticated (Session):", req.isAuthenticated && req.isAuthenticated());

  // Check for Passport session-based authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("Authenticated via Passport session");
    return next();
  }

  // If no session, fall back to JWT
  let token;
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

      console.log("Authenticated via JWT token");
      return next(); // Continue to the next middleware or route handler
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  }

  // If neither session nor JWT is valid
  console.log("No valid session or token found");
  res.status(401);
  throw new Error("Not authorized, no token or session provided");
});


module.exports = { protect };
