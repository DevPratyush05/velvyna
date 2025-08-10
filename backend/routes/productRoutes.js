// backend/routes/productRoutes.js

const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct, // New: for creating products
  updateProduct, // New: for updating products
  deleteProduct, // New: for deleting products
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware"); // Import protect and admin middleware

// Public routes (accessible to everyone)
router.route("/").get(getProducts); // GET /api/products - gets all products
router.route("/:id").get(getProductById); // GET /api/products/:id - gets a single product by ID

// Admin routes (require authentication and admin privileges)
router.route("/").post(protect, admin, createProduct); // POST /api/products - create a new product

router
  .route("/:id")
  .put(protect, admin, updateProduct) // PUT /api/products/:id - update a product by ID
  .delete(protect, admin, deleteProduct); // DELETE /api/products/:id - delete a product by ID

module.exports = router;
