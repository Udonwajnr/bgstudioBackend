const express = require("express");
const passport = require("passport");
const {
  CreateUser,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resendVerificationLink,
  resetPassword,
  getUser,

  googleAuth
} = require("../controllers/customerController");
const jwt = require("jsonwebtoken");
const router = express.Router();

//THird party outh 
router.get('/google',googleAuth)
// Other Routes
router.post("/", CreateUser);
router.post("/login", login); // User login
router.post("/logout", logout); // Logout user
router.get("/:id", getUser); // Get user by ID
router.get("/verify/:token", verifyEmail); // Verify email
router.post("/resend-verification", resendVerificationLink); // Resend verification link
router.post("/forgot-password", forgotPassword); // Forgot password
router.post("/reset-password/:token", resetPassword); // Reset password

module.exports = router;
