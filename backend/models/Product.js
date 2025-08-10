// backend/models/Product.js

const mongoose = require("mongoose");

// --- NEW CODE INSERTION START ---
// Define a sub-schema for color-specific images
// const colorImageSchema = mongoose.Schema({
//   color: { type: String, required: true },
//   imageUrl: { type: String, required: true },
// });

const colorImageSchema = mongoose.Schema({
  color: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Changed from true to false for seeding
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    // --- NEW CODE INSERTION START ---
    additionalImages: [
      // NEW FIELD: Array of strings for additional image URLs
      {
        type: String,
        required: false,
      },
    ],
    // --- NEW CODE INSERTION END ---
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    sizes: [
      {
        type: String,
        required: false,
      },
    ],
    variants: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        hex: { type: String, required: false },
      },
    ],
    colors: [
      {
        type: String,
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
