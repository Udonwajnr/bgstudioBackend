// routes/auth.js
const express = require("express");
const passport = require("passport");

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
  

module.exports = router;
