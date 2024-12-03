const mongoose = require('mongoose');

const poultryShippingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order', // Reference to the Order model
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    shippingDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    trackingNumber: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate a unique tracking number
poultryShippingSchema.pre('save', function (next) {
  if (this.isNew) {
    this.trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
  next();
});

const PoultryShipping = mongoose.model('PoultryShipping', poultryShippingSchema);

module.exports = PoultryShipping;
