const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../model/users"); // Adjust the path based on your project structure

// Register a new user
const RegisterUser = asyncHandler(async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
  
    // Check if all fields are provided
    if (!username || !email || !password || !confirmPassword) {
      res.status(400);
      throw new Error("All fields are required");
    }
  
    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }
  
    const normalizedEmail = email.toLowerCase();
  
    // Check if the user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
  
    // Create a new user
    const newUser = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      verificationToken,
    });
  
    if (newUser) {
      // Send a verification email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const verificationLink = `${process.env.CLIENT_URL}/verify/${verificationToken}`;
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: newUser.email,
        subject: "Verify Your Email",
        text: `Hello ${newUser.username},\n\nPlease verify your email by clicking the link below:\n${verificationLink}`,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Verification email sent:", info.response);
        }
      });
  
      res.status(201).json({
        message: "Registration successful. Please check your email to verify your account.",
      });
    } else {
      res.status(500);
      throw new Error("Failed to create user");
    }
  });

  const VerifyUser = asyncHandler(async (req, res) => {
    const { token } = req.params;
  
    // Find user by token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }
  
    // Update user's verification status
    user.isVerified = true;
    user.verificationToken = null; // Clear the token
    await user.save();
  
    res.status(200).json({ msg: "Email verified successfully. You can now log in." });
  });
  
// Log in an existing user
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    // Check if email and password are provided
    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide email and password");
    }
  
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  
    // Match the entered password with the hashed password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  
    // Check if user is verified
    if (!user.isVerified) {
      res.status(403);
      throw new Error("Please verify your email before logging in");
    }
  
    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
  
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
  
    // Set the refresh token in an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  
    // Respond with the access token
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      accessToken,
    });
  });

//   forgot password
  
const forgotPassword = asyncHandler(async (req, res) => {
const { email } = req.body;

if (!email) {
    res.status(400);
    throw new Error("Email is required");
}

const user = await User.findOne({ email });
if (!user) {
    res.status(404);
    throw new Error("User not found");
}

// Generate reset token
const resetToken = crypto.randomBytes(32).toString("hex");
user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
await user.save();

// Send email
const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
const transporter = nodemailer.createTransport({ /* Configure transporter */ });
const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset",
    text: `You requested a password reset. Click here to reset your password: ${resetUrl}`,
};

await transporter.sendMail(mailOptions);

res.status(200).json({ message: "Password reset link sent to your email" });
});

// refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
  
    if (!refreshToken) {
      res.status(403);
      throw new Error("No refresh token found");
    }
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  
      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
  
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(403);
      throw new Error("Invalid or expired refresh token");
    }
  });
  
// logout user
const logoutUser = asyncHandler(async (req, res) => {
res.cookie("refreshToken", "", { httpOnly: true, expires: new Date(0) });
res.status(200).json({ message: "Logged out successfully" });
});


// reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired token");
    }
  
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  
    res.status(200).json({ message: "Password reset successful" });
  });


// Resend Verification Link
const resendVerificationLink = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email input
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if user is already verified
  if (user.isVerified) {
    res.status(400);
    throw new Error("User is already verified");
  }

  // Generate a new verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  await user.save();

  // Send email with verification link
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Email Verification Link",
    text: `Hi ${user.username},\n\nPlease verify your email by clicking the link below:\n\n${verificationUrl}\n\nIf you did not request this, please ignore this email.`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending verification email:", err);
      res.status(500);
      throw new Error("Failed to send verification email");
    } else {
      console.log("Verification email sent:", info.response);
      res.status(200).json({ message: "Verification link sent successfully" });
    }
  });
});


module.exports = {
  RegisterUser,
  VerifyUser,
  forgotPassword,
  refreshAccessToken,
  resetPassword,
  loginUser,
  resendVerificationLink,
  logoutUser
};