// backend/routes/cartRoutes.js
const express = require("express");
const {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getUserCart).post(protect, addItemToCart);

router.route("/clear").delete(protect, clearCart);

router
  .route("/:itemId")
  .put(protect, updateCartItemQuantity)
  .delete(protect, removeCartItem);

module.exports = router;
