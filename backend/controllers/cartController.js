// backend/controllers/cartController.js
const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const Product = require("../models/Product"); // Import Product model to check stock

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getUserCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    // NEW: Populate the 'product' field within each 'items' array entry.
    // We only need the name, image, and price for cart display.
    .populate("items.product", "name image price");

  if (cart) {
    res.json(cart);
  } else {
    // If no cart exists for the user, return an empty cart structure
    res.json({ user: req.user._id, items: [] });
  }
});

/**
 * @desc    Add item to cart or update quantity
 * @route   POST /api/cart
 * @access  Private
 */
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, color, size } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.countInStock < quantity) {
    res.status(400);
    throw new Error(
      `Not enough stock for ${product.name}. Available: ${product.countInStock}`
    );
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    // Cart exists for user
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId && // Compare ObjectId
        item.color === color &&
        item.size === size
    );

    if (itemIndex > -1) {
      // Item exists in cart, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({ product: productId, quantity, color, size });
    }
  } else {
    // No cart for user, create a new one
    cart = new Cart({
      user: req.user._id,
      items: [{ product: productId, quantity, color, size }],
    });
  }

  const updatedCart = await cart.save();
  // Populate after saving to ensure the response includes product details for the new/updated item
  await updatedCart.populate("items.product", "name image price"); // Populate the product details

  res.status(200).json({
    message: "Item added/updated in cart!",
    cart: updatedCart,
  });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found for this user");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === itemId
  );

  if (itemIndex > -1) {
    const cartItem = cart.items[itemIndex];
    const product = await Product.findById(cartItem.product); // Get product to check stock

    if (!product) {
      res.status(404);
      throw new Error("Product associated with cart item not found");
    }

    if (product.countInStock < quantity) {
      res.status(400);
      throw new Error(
        `Not enough stock for ${product.name}. Available: ${product.countInStock}`
      );
    }

    cart.items[itemIndex].quantity = quantity;
    const updatedCart = await cart.save();
    await updatedCart.populate("items.product", "name image price"); // Populate
    res.json({ message: "Cart item quantity updated", cart: updatedCart });
  } else {
    res.status(404);
    throw new Error("Cart item not found");
  }
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found for this user");
  }

  // Filter out the item to be removed
  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

  if (cart.items.length === initialLength) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  const updatedCart = await cart.save();
  await updatedCart.populate("items.product", "name image price"); // Populate
  res.json({ message: "Item removed from cart", cart: updatedCart });
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = []; // Empty the items array
    await cart.save();
    res.json({ message: "Cart cleared successfully" });
  } else {
    res.status(404);
    throw new Error("Cart not found for this user");
  }
});

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
