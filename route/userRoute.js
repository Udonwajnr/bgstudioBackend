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
} = require("../controllers/userAuthentication");

const router = express.Router();

// User registration
router.post("/register", RegisterUser);

// Verify email
router.get("/verify/:token", VerifyUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Refresh access token
router.get("/refresh-token", refreshAccessToken);

// Reset password
router.post("/reset-password/:token", resetPassword);

// User login
router.post("/login", loginUser);

// Resend verification link
router.post("/resend-verification", resendVerificationLink); 

// Logout user
router.post("/logout", logoutUser);

module.exports = router;
