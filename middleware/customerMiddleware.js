const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer"); // Adjust the path to your Customer model

const protect = asyncHandler(async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // If the user is authenticated via Passport session
    req.user = req.user; // Passport automatically attaches the user to `req.user`
    return next();
  }

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

      return next(); // Continue to the next middleware or route handler
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  }

  // If neither session nor JWT is valid
  res.status(401);
  throw new Error("Not authorized, no token or session provided");
});

module.exports = { protect };
