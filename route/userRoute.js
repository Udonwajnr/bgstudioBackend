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
  authorizeUserRole
} = require("../controllers/userAuthentication");
const {authenticateToken} = require("../middleware/authenticateMiddle"); // Middleware for authentication
const authorizeRole=require("../middleware/roleMiddleware")

const router = express.Router();

// User registration
router.post("/register", RegisterUser);

// Verify email
router.get("/verify/:token", VerifyUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Refresh access token
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Reset password
router.post("/reset-password/:token", resetPassword);

router.put(
  "/update-role/:id",
  authenticateToken,
  authorizeRole(["superuser"]),
  authorizeUserRole
)
// User login

// Resend verification link
router.post("/resend-verification", resendVerificationLink); 

// Logout user
router.post("/logout", logoutUser);



module.exports = router;
