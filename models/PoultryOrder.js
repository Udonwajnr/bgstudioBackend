const mongoose = require('mongoose');
const Counter = require('./counter');

const PoultryOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    customer: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PoultryProduct',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    flutterwaveTransactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate unique orderId
PoultryOrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.orderId = `ORD${String(counter.seq).padStart(3, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const PoultryOrder = mongoose.model('PoultryOrder', PoultryOrderSchema);

module.exports = PoultryOrder;
