const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Customer = require("../models/Customer"); // Adjust the path based on your project structure


const CreateUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, confirmPassword, phoneNumber } = req.body;

  // Validate input
  if (!fullName || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error("All fields are required");
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: "Passwords do not match" });
  }

  const normalizedEmail = email.toLowerCase();

  // Check if user already exists
  const userExists = await Customer.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Generate a verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Temporarily save user with verification token
  const newUser = new Customer({
    fullName,
    email: normalizedEmail,
    password,
    phoneNumber,
    verificationToken,
    isVerified: false, // User is not verified yet
  });

  await newUser.save(); // Save user with verification token

  // Send a verification email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: newUser.email,
    subject: "Verify Your Email",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                  <td style="padding: 0;">
                      <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                          <tr>
                              <td align="center" style="padding: 30px 0; background-color: #000000;">
                                  <img src="https://res.cloudinary.com/djwombdbg/image/upload/f_auto,q_auto/x1ulyjciqb1r38h5c47j" alt="BG Unisex Salon" width="120" style="display: block;border-radius: 100%;">
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 40px 30px;">
                                  <h1 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: bold; text-align: center;">Welcome to BG Unisex Salon</h1>
                                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                      Hello ${newUser.fullName},
                                  </p>
                                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                      Thank you for joining our community. To start your journey with us, please verify your email address.
                                  </p>
                                  <table role="presentation" style="width: 100%;">
                                      <tr>
                                          <td style="text-align: center;">
                                              <a href="${verificationLink}" style="display: inline-block; padding: 14px 30px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Verify Email</a>
                                          </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 20px 30px; background-color: #f6f6f6; text-align: center;">
                                  <p style="margin: 0; color: #999999; font-size: 14px;">
                                      &copy; ${new Date().getFullYear()} BG Unisex Salon. All rights reserved.
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending email:", err);
      res.status(500).json({ msg: "Error sending verification email" });
      return;
    }
    console.log("Verification email sent:", info.response);
    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
    });
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find the user by the verification token
  const user = await Customer.findOne({ verificationToken: token });
  
  // If user does not exist, return a proper error message
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification token" });
  }

  // Check if the email is already verified
  if (user.isVerified) {
    return res.status(200).json({ message: "Email already verified" });
  }

  // Mark the user as verified
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  // Return a success message
  return res.status(200).json({ message: "Email verified successfully. You can now log in." });
});


const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }
    const normalizedEmail = email.toLowerCase();
    const user = await Customer.findOne({ email:normalizedEmail });
  
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
  
    if (!user.isVerified) {
      res.status(400);
      throw new Error("Please verify your email before logging in");
    }
  
    const isPasswordMatch = await bcrypt.compare(password, user.password);
  
    if (!isPasswordMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }
  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
  
    res.status(200).json({
      message: "Login successful",
      token,
    });
  });
  
  // Logout function
  const logout = asyncHandler(async (req, res) => {
    res.status(200).json({ message: "Logout successful" });
  });
  
  // Forgot password function
  const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }
  
    const user = await Customer.findOne({ email });
  
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
  
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();
  
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
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
      subject: "Password Reset Request",
      html: `<p>Please click <a href='${resetLink}'>here</a> to reset your password. This link will expire in 1 hour.</p>`
    };
  
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ msg: "Error sending password reset email" });
        return;
      }
      console.log("Password reset email sent:", info.response);
      res.status(200).json({
        message: "Password reset email sent successfully. Please check your email.",
      });
    });
  });
  
  // Resend verification link function
  const resendVerificationLink = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }
  
    const user = await Customer.findOne({ email });
  
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
  
    if (user.isVerified) {
      res.status(400);
      throw new Error("User is already verified");
    }
  
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();
  
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  
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
      subject: "Resend Email Verification",
      html: `<p>Please click <a href='${verificationLink}'>here</a> to verify your email.</p>`
    };
  
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ msg: "Error resending verification email" });
        return;
      }
      console.log("Verification email resent:", info.response);
      res.status(200).json({
        message: "Verification email resent successfully. Please check your email.",
      });
    });
  });
  
  // Reset password function
  const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
  
    if (!token || !newPassword) {
      res.status(400);
      throw new Error("Token and new password are required");
    }
  
    const user = await Customer.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure the token has not expired
    });
  
    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired reset token");
    }
  
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();
  
    res.status(200).json({ message: "Password reset successfully" });
  });

  const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    // Query the user by _id if id refers to the MongoDB ObjectId
    const user = await Customer.findById(id);
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    return res.status(200).json(user);
  });
  
  
  module.exports = {
    CreateUser,
    verifyEmail,
    login,
    logout,
    forgotPassword,
    resendVerificationLink,
    resetPassword,
    getUser
  };