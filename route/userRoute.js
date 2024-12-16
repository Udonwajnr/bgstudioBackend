const express = require("express");
const {
  RegisterUser,
  VerifyUser,
  forgotPassword,
  refreshAccessToken,
  resetPassword,
  loginUser,
  resendVerificationLink,
  logoutUser,
  authorizeUserRole,
} = require("../controllers/userAuthentication");
const { authenticateToken } = require("../middleware/authenticateMiddle"); // Middleware for authentication
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();

// **User Authentication**
router.post("/register", RegisterUser); // User registration
router.post("/login", loginUser);       // User login
router.post("/logout", logoutUser);     // Logout user
router.post("/refresh-token", refreshAccessToken); // Refresh access token

// **Email Verification**
router.get("/verify/:token", VerifyUser);                   // Verify email
router.post("/resend-verification", resendVerificationLink); // Resend verification link

// **Password Management**
router.post("/forgot-password", forgotPassword);          // Forgot password
router.post("/reset-password/:token", resetPassword);     // Reset password

// **User Role Management**
router.put(
  "/update-role/:id",
  authenticateToken,
  authorizeRole(["superuser"]),
  authorizeUserRole
); // Update user role

module.exports = router;
