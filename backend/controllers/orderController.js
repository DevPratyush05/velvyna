// backend/controllers/orderController.js
const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems, // Note: This 'orderItems' is from the request, but we'll use the server's cart for safety
    shippingAddress,
    paymentMethod,
    itemsPrice, // These prices are sent from frontend, but backend re-calculates for security
    taxPrice,
    shippingPrice,
    totalPrice,
    messageForDelivery,
    giftWrapped,
  } = req.body;

  // Validate incoming order data
  // (We'll still rely on fetching cart for actual items/prices later)
  if (
    !shippingAddress ||
    !shippingAddress.recipientName ||
    !shippingAddress.phoneNumber
  ) {
    res.status(400);
    throw new Error(
      "Shipping address, recipient name, or phone number is missing"
    );
  } else if (!paymentMethod) {
    res.status(400);
    throw new Error("Payment method is missing");
  }

  // Fetch the user's current cart from the database using 'items.product'
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("No items in cart to create an order.");
  }

  // Build order items from cart items, fetching latest prices from the database
  const finalOrderItems = [];
  let calculatedItemsPrice = 0;

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product._id); // product is already populated here
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${cartItem.product._id}`);
    }

    if (product.countInStock < cartItem.quantity) {
      res.status(400);
      throw new Error(
        `Not enough stock for ${product.name}. Available: ${product.countInStock}`
      );
    }

    finalOrderItems.push({
      name: product.name,
      quantity: cartItem.quantity,
      image: product.image,
      price: product.price, // Use price from database
      product: product._id,
      color: cartItem.color,
      size: cartItem.size,
    });
    calculatedItemsPrice += product.price * cartItem.quantity;

    // Optional: Decrease product stock
    product.countInStock -= cartItem.quantity;
    await product.save();
  }

  // Calculate taxes, shipping, etc. on the backend for security and accuracy
  const calculatedTaxPrice = calculatedItemsPrice * 0.15; // 15% tax
  const calculatedShippingPrice = calculatedItemsPrice > 1000 ? 0 : 100; // Free shipping over ₹1000
  const calculatedTotalPrice =
    calculatedItemsPrice + calculatedTaxPrice + calculatedShippingPrice;

  const order = new Order({
    user: req.user._id,
    orderItems: finalOrderItems,
    shippingAddress: {
      // Ensure all fields are passed as per Order model
      address: shippingAddress.address,
      addressLaneOrHouseNumber: shippingAddress.addressLaneOrHouseNumber,
      city: shippingAddress.city,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      recipientName: shippingAddress.recipientName,
      phoneNumber: shippingAddress.phoneNumber,
    },
    paymentMethod,
    messageForDelivery: messageForDelivery || "",
    giftWrapped: giftWrapped || false,
    // Admin tracking fields default to false on creation as per schema
    paymentConfirmedByAdmin: false, // Explicitly set default
    orderPlacedWithQikink: false, // Explicitly set default
    fulfilmentDone: false, // Explicitly set default
    isPaid: false, // Default to false, updated by updateOrderToPaid
    paidAt: undefined,
    isDelivered: false, // Default to false, updated by updateOrderToDelivered
    deliveredAt: undefined,
    itemsPrice: calculatedItemsPrice,
    taxPrice: calculatedTaxPrice,
    shippingPrice: calculatedShippingPrice,
    totalPrice: calculatedTotalPrice,
  });

  const createdOrder = await order.save();

  // After a successful order, clear the user's cart
  cart.items = [];
  await cart.save();

  res.status(201).json(createdOrder);
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (order) {
    // Ensure only the user who owns the order or an admin can view it
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      res.status(401);
      throw new Error("Not authorized to view this order");
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

/**
 * @desc    Update order to paid
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      // This field might not exist in your Order model, remove if causing errors.
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

/**
 * @desc    Update order to delivered (Admin only)
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

/**
 * @desc    Update order admin tracking status (Admin only)
 * @route   PUT /api/orders/:id/admin-status
 * @access  Private/Admin
 */
const updateOrderAdminStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    // Only update fields that are explicitly sent in the request body
    if (req.body.paymentConfirmedByAdmin !== undefined) {
      order.paymentConfirmedByAdmin = req.body.paymentConfirmedByAdmin;
    }
    if (req.body.orderPlacedWithQikink !== undefined) {
      order.orderPlacedWithQikink = req.body.orderPlacedWithQikink;
    }
    if (req.body.fulfilmentDone !== undefined) {
      order.fulfilmentDone = req.body.fulfilmentDone;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

/**
 * @desc    Get all orders by authenticated user
 * @route   GET /api/orders/myorders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
const getOrders = asyncHandler(async (req, res) => {
  // Populate user details and order item product details
  const orders = await Order.find({})
    .populate("user", "id name email")
    .populate("orderItems.product", "name image price"); // Populate product details for each order item
  res.json(orders);
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderAdminStatus, // NEW: Export the new admin status update function
  getMyOrders,
  getOrders,
};
