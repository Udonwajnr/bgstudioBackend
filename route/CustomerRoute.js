// routes/auth.js
const express = require("express");
const passport = require("passport");
const {CreateUser,verifyEmail,login,logout,forgotPassword,resendVerificationLink,resetPassword} = require('../controllers/customerController')
const router = express.Router();

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/dashboard");
    },
    (err, req, res, next) => {
      console.error("Google Callback Error:", err); // Log the error
      res.status(500).send("An error occurred during Google authentication.");
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
      console.error("Facebook Callback Error:", err); // Log the error
      res.status(500).send("An error occurred during Facebook authentication.");
    }
  );

router.post('/', CreateUser)
router.post("/login", login);       // User login
router.post("/logout", logout);     // Logout user
router.get("/verify/:token", verifyEmail);                   // Verify email
router.post("/resend-verification", resendVerificationLink); // Resend verification link


module.exports = router;
