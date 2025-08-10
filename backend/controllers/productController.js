// backend/controllers/productController.js

const asyncHandler = require("express-async-handler");
const Product = require("../models/Product"); // Assuming your Product model is correctly defined

/**
 * @desc    Fetch all products
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  // Fetch all products from your database
  const products = await Product.find({});
  // Return them in an object with a 'products' key, as frontend expects
  res.json({ products });
});

/**
 * @desc    Fetch single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  // Get the product ID from the request parameters
  const productId = req.params.id;

  // Find the product by its MongoDB _id
  const product = await Product.findById(productId);

  if (product) {
    // If product is found, send the product object directly
    res.json(product);
  } else {
    // If product is not found, send a 404 Not Found response
    res.status(404);
    throw new Error("Product not found");
  }
});

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    brand,
    category,
    countInStock,
    sizes, // Array of strings, e.g., ['S', 'M', 'L']
    colors, // Array of strings, e.g., ['Red', 'Blue', '#FFFFFF']
    colorImages,
    additionalImages,
  } = req.body;

  // Create a product instance
  const product = new Product({
    user: req.user._id, // Assign the product to the creating admin user
    name: name || "Sample Name", // Provide defaults if not sent, adjust as needed
    price: price || 0,
    description: description || "Sample description",
    image: image || "/images/sample.jpg", // Default image if none provided
    brand: brand || "Sample Brand",
    category: category || "Electronics", // Default category
    countInStock: countInStock || 0,
    numReviews: 0,
    rating: 0,
    sizes: sizes || [],
    colors: colors || [],
    colorImages: colorImages || [],
    additionalImages: additionalImages || [], // NEW: Save additionalImages
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct); // Respond with the newly created product
});

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    brand,
    category,
    countInStock,
    sizes,
    colors,
    colorImages,
    additionalImages, // NEW: Destructure additionalImages from req.body
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    // Update product fields if they are provided in the request body
    product.name = name || product.name;
    product.price = price !== undefined ? price : product.price; // Allow 0 to be set
    product.description = description || product.description;
    product.image = image || product.image;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock =
      countInStock !== undefined ? countInStock : product.countInStock;
    product.sizes = sizes !== undefined ? sizes : product.sizes;
    product.colors = colors !== undefined ? colors : product.colors;
    product.colorImages =
      colorImages !== undefined ? colorImages : product.colorImages;
    product.additionalImages =
      additionalImages !== undefined
        ? additionalImages
        : product.additionalImages; // NEW: Update additionalImages

    const updatedProduct = await product.save(); // Save the updated product
    res.json(updatedProduct); // Respond with the updated product
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne(); // Use deleteOne() on the document itself
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
