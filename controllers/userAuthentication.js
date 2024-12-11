const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/users"); // Adjust the path based on your project structure

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
  
    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
  
    // Create a new user
    const newUser = await User.create({
      username,
      email: normalizedEmail,
      password ,
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
                              <!-- Header with Logo -->
                              <tr>
                                  <td align="center" style="padding: 30px 0; background-color: #000000;">
                                      <img src="https://res.cloudinary.com/djwombdbg/image/upload/f_auto,q_auto/x1ulyjciqb1r38h5c47j"alt="BG Unisex Salon" width="120" style="display: block;border-radius: 100%;">
                                  </td>
                              </tr>
                              
                              <!-- Main Content -->
                              <tr>
                                  <td style="padding: 40px 30px;">
                                      <h1 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: bold; text-align: center;">Welcome to BG Unisex Salon</h1>
                                      
                                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                          Hello ${newUser.username},
                                      </p>
                                      
                                      <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                          Thank you for joining our community. To start your journey with us, please verify your email address.
                                      </p>
                                      
                                      <!-- Verification Button -->
                                      <table role="presentation" style="width: 100%;">
                                          <tr>
                                              <td style="text-align: center;">
                                                  <a href="${verificationLink}" style="display: inline-block; padding: 14px 30px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Verify Email</a>
                                              </td>
                                          </tr>
                                      </table>
                                  </td>
                              </tr>
                              
                              <!-- Footer -->
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
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
  
    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
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
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        }, 
        });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset Request</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 0;">
                                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    <!-- Header with Logo -->
                                    <tr>
                                       <td align="center" style="padding: 30px 0; background-color: #000000;">
                                          <img src="https://res.cloudinary.com/djwombdbg/image/upload/f_auto,q_auto/x1ulyjciqb1r38h5c47j"alt="BG Unisex Salon" width="120" style="display: block;border-radius: 100%;">
                                        </td>
                                    </tr>
                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h1 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: bold; text-align: center;">Password Reset Request</h1>
                                            
                                            <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                                You've requested to reset your password for your BG Unisex Salon account. If you didn't make this request, please ignore this email.
                                            </p>
                                            
                                            <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                                To reset your password, click the button below:
                                            </p>
                                            
                                            <!-- Reset Password Button -->
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="text-align: center;">
                                                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 30px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Reset Password</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5; text-align: center;">
                                                If the button doesn't work, you can copy and paste this link into your browser:
                                                <br>
                                                <a href="${resetUrl}" style="color: #000000; text-decoration: underline;">${resetUrl}</a>
                                            </p>
                                            
                                            <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.5; text-align: center;">
                                                This password reset link will expire in 24 hours for security reasons.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                  <tr>
                                      <td style="padding: 20px 30px; background-color: #f6f6f6; text-align: center;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">BG Unisex Salon</p>
                                          <div class="footer">
                                              <p>&copy; ${new Date().getFullYear()} BG Unisex Salon. All rights reserved.</p>
                                          </div>
                                      </td>
                                  </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>`,
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
        { id: decoded.id,role: decoded.role},
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
    const { newPassword,confirmPassword } = req.body;
  
    if(newPassword !== confirmPassword){
        return res.status(400).json({ msg: "Passwords do not match" });
    }
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
    html: `
    <!DOCTYPE html>
              <html lang="en">
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
                                  <!-- Header with Logo -->
                                 <tr>
                                      <td align="center" style="padding: 30px 0; background-color: #000000;">
                                          <img src="https://res.cloudinary.com/djwombdbg/image/upload/f_auto,q_auto/x1ulyjciqb1r38h5c47j"alt="BG Unisex Salon" width="120" style="display: block;border-radius: 100%;">
                                      </td>
                                  </tr>
                                  
                                  <!-- Main Content -->
                                  <tr>
                                      <td style="padding: 40px 30px;">
                                          <h1 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: bold; text-align: center;">Verify Your Email</h1>
                                          
                                          <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                              Hi ${user.username},
                                          </p>
                                          
                                          <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                                              Thank you for signing up with BG Unisex Salon. To complete your registration and ensure the security of your account, please verify your email address.
                                          </p>
                                          
                                          <!-- Verification Button -->
                                          <table role="presentation" style="width: 100%;">
                                              <tr>
                                                  <td style="text-align: center;">
                                                      <a href="${verificationUrl}" style="display: inline-block; padding: 14px 30px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Verify Email</a>
                                                  </td>
                                              </tr>
                                          </table>
                                          
                                          <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5; text-align: center;">
                                              If the button doesn't work, you can copy and paste this link into your browser:
                                              <br>
                                              <a href="${verificationUrl}" style="color: #000000; text-decoration: underline;">${verificationUrl}</a>
                                          </p>
                                          
                                          <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.5; text-align: center;">
                                              If you did not request this, please ignore this email.
                                          </p>
                                      </td>
                                  </tr>
                                  
                                  <!-- Footer -->
                                 <tr>
                                    <td style="padding: 20px 30px; background-color: #f6f6f6; text-align: center;">
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">BG Unisex Salon</p>
                                        <div class="footer">
                                            <p>&copy; ${new Date().getFullYear()} BG Unisex Salon. All rights reserved.</p>
                                        </div>
                                    </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                  </table>
              </body>
              </html>
          `,
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

const authorizeUserRole = asyncHandler(async(req,res)=>{
  try {
    const { role } = req.body;
    const validRoles = ["admin", "manager", "customer", "superuser"]; // List of allowed roles

    // Check if the provided role is valid
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    // Find and update the user's role
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "User role updated successfully.", user });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
})

module.exports = {
  RegisterUser,
  VerifyUser,
  forgotPassword,
  refreshAccessToken,
  resetPassword,
  loginUser,
  authorizeUserRole,
  resendVerificationLink,
  logoutUser
};