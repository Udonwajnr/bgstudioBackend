// models/Customer.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  fullName: {
     type: String, required: true
     },
  email: { type: String,
     required: true,
    unique: true
 },
  password: {
     type: String
   }, // Optional for OAuth users
  phoneNumber: { 
    type: String
 },
  provider: { 
    type: String,
     enum: ["manual", "google", "facebook"],
      default: "manual"
 }, // Identify how they signed up
  createdAt: { type: Date,
     default: Date.now
     },
});

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
