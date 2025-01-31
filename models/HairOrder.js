const mongoose = require('mongoose');
const Counter = require('./counter'); // For generating unique order IDs

const HairOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    customer: { 
      type: mongoose.Schema.Types.ObjectId,
       ref: "Customer",
       required: true
     }, // Reference to Customer,
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
          ref: 'HairProduct',
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
        discountPrice: {
          type: Number,
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

    transactionReference:{
      type: String,
      unique: true,
      sparse: true,
    }

  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Pre-save hook to generate unique orderId
HairOrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: 'hairOrderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true } // Create the counter if it doesn't exist
      );
      this.orderId = `ORD${String(counter.seq).padStart(4, '0')}`; // Example: ORD0001
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const HairOrder = mongoose.model('HairOrder', HairOrderSchema);

module.exports = HairOrder;
