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
} = require("../controllers/customerController");

const router = express.Router();

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user; // Passport attaches the authenticated user to req.user
    res.status(200).json(user);
  },
  (err, req, res, next) => {
    console.error("Google Callback Error:", err.message);
    res.status(400).send({ error: err.message });
  }
);

// Facebook Auth
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  },
  (err, req, res, next) => {
    console.error("Facebook Callback Error:", err.message);
    res.status(400).send({ error: err.message });
  }
);

// Get Authenticated User (Universal for Google, Facebook, or other login methods)
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user); // Send the authenticated user's data
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

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
