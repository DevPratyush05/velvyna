const mongoose = require("mongoose");

// Define a sub-schema for ordered items
const orderItemSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  color: { type: String, required: false },
  size: { type: String, required: false },
});

// Main Order Schema
const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      address: { type: String, required: true },
      addressLaneOrHouseNumber: { type: String, required: false }, // NEW: Address lane/house number
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      recipientName: { type: String, required: true }, // NEW: Recipient's name
      phoneNumber: { type: String, required: true }, // NEW: Recipient's phone number
    },
    paymentMethod: {
      // Remains a string to store 'UPI', 'COD', etc.
      type: String,
      required: true,
    },
    messageForDelivery: { type: String, required: false }, // NEW: Customer's delivery message
    giftWrapped: { type: Boolean, required: false, default: false }, // NEW: Gift wrap option

    // --- NEW ADMIN TRACKING CHECKBOXES ---
    paymentConfirmedByAdmin: { type: Boolean, required: false, default: false },
    orderPlacedWithQikink: { type: Boolean, required: false, default: false },
    fulfilmentDone: { type: Boolean, required: false, default: false },

    // --- EXISTING PAYMENT/DELIVERY FIELDS ---
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },

    // --- FINANCIAL DETAILS ---
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
