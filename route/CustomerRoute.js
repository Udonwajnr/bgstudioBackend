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
const jwt = require("jsonwebtoken");
const router = express.Router();

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "accessSecretKey",
    { expiresIn: "1h" } // Access token valid for 1 hour
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET || "refreshSecretKey",
    { expiresIn: "7d" } // Refresh token valid for 7 days
  );
};

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication failed" });
      }

      // Generate tokens
      const accessToken = generateAccessToken(req.user);
      const refreshToken = generateRefreshToken(req.user);

      // Store refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use HTTPS in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });

      // Respond with client-side script to signal parent window and close the popup
      res.send(`
        <script>
          window.opener.postMessage('success', '*'); // Signal to parent window
          window.close(); // Close the popup
        </script>
      `);
    } catch (error) {
      console.error("Error generating tokens:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
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
