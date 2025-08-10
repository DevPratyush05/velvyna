// backend/routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderAdminStatus, // NEW: Import the new controller function
  getMyOrders,
  getOrders,
} = require("../controllers/orderController");
const { protect, admin } = require("../middleware/authMiddleware"); // Assuming you have admin middleware

// Routes for authenticated users
router.route("/").post(protect, addOrderItems); // Create new order
router.route("/myorders").get(protect, getMyOrders); // Get logged in user orders
router.route("/:id").get(protect, getOrderById); // Get single order by ID

// Admin-specific routes
router.route("/:id/pay").put(protect, updateOrderToPaid); // This one is usually for user/payment gateway callback
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered); // Admin marks as delivered

// --- NEW ROUTE INSERTION START ---
// Admin update order tracking status (payment confirmed, Qikink placed, fulfillment done)
router.route("/:id/admin-status").put(protect, admin, updateOrderAdminStatus);
// --- NEW ROUTE INSERTION END ---

// Route to get all orders (Admin only) - ensure this is last or before specific :id routes to avoid conflicts
router.route("/").get(protect, admin, getOrders);

module.exports = router;
