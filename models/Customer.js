// models/Customer.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // Make sure bcrypt is installed

// Define the customer schema
const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String, // Optional for OAuth users
    require:true
  },
  phoneNumber: {
    type: String,
    // required:true
  },
  provider: {
    type: String,
    enum: ["manual", "google", "facebook"], // Identify how they signed up
    default: "manual",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: false,
  },
  tokenExpiresAt: {
    type: Date,
    required: false,
  },
  resetPasswordToken: {
    type: String,
    required: false,
  },
  resetPasswordExpire: {
    type: Date,
  },
  refreshToken: { type: String },
  image: {
    type: String
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL Index for automatic token expiration
customerSchema.index({ tokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware for password hashing
customerSchema.pre("save", async function (next) {
  // If the password is not modified, skip hashing
  if (!this.isModified("password")) {
    return next();
  }
  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to match entered password with hashed password
customerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the model
const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
