const mongoose = require('mongoose');

const HairProductSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['wig', 'hairProduct'], // Limiting to specific categories
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },

    // stock
    quantity: {//stock
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default:0
  },
    brand: {
      type: String,
    },
    careInstructions: {
      type: String,
    },
    tags: {
      type: [String], // Array of tags/keywords
    },
    discountPrice: {
      type: Number,
    },
    deliveryTime: {
      type: String,
    },
    returnPolicy: {
      type: String,
    },
    photos: {
      type: [String], // Array of URLs for product photos
      required: true,
    
    },
    video: {
      type: String, // URL for video (if any)
    },
    // Specific fields for wigs
    hairType: {
      type: String,
      // enum: ['human', 'synthetic', 'blended'],
    },
    wigStyle: {
      type: String,
      // enum: ['curly', 'straight', 'wavy', 'braided'],
    },
    hairLength: {
      type: String,
    },
    hairColor: {
      type: String,
    },
    density: {
      type: String,
    },
    capSize: {
      type: String,
      // enum: ['small', 'medium', 'large'],
    },
    capType: {
      type: String,
      // enum: ['laceFront', 'fullLace', 'uPart', '360Lace'],
    },
    adjustableStraps: {
      type: Boolean,
    },
    combsIncluded: {
      type: Boolean,
    },
    heatResistance: {
      type: Boolean,
    },
    prePlucked: {
      type: Boolean,
    },
    babyHairs: {
      type: Boolean,
    },
    bleachedKnots: {
      type: Boolean,
    },
    customizable: {
      type: Boolean,
    },
    // Specific fields for hair products
    productType: {
      type: String,
      // enum: ['shampoo', 'conditioner', 'oil', 'serum', 'mask', 'gel', 'spray'],
    },
    targetHairType: {
      type: [String], // Array of target hair types
    }, 
    hairConcerns: {
      type: [String], // Array of hair concerns addressed
    },
    size: {
      type: String,
    },
    scent: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically include createdAt and updatedAt
  }
);

module.exports = mongoose.model('HairProduct', HairProductSchema);
