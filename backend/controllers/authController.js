// backend/controllers/authController.js
const asyncHandler = require("express-async-handler");
const User = require("../models/User"); // Assuming your User model is correctly defined here
const generateToken = require("../utils/generateToken"); // Assuming generateToken is correct

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if a user with the provided email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    // If user already exists, send a 400 Bad Request status
    res.status(400);
    throw new Error("User already exists");
  }

  // Create a new user in the database
  const user = await User.create({
    name,
    email,
    password, // Password will be hashed by the pre-save middleware in User.js
  });

  if (user) {
    // If user creation is successful, send a 201 Created status
    res.status(201).json({
      message: "Registration successful", // Added a success message
      user: {
        // <--- THIS IS THE CRUCIAL NESTING!
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      token: generateToken(user._id), // Generate a JWT for the new user
    });
  } else {
    // If user creation fails, send a 400 Bad Request status
    res.status(400);
    throw new Error("Invalid user data");
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  // Find the user by email in the database
  const user = await User.findOne({ email });

  // Check if the user exists and if the provided password matches the hashed password
  // The `matchPassword` method is defined in the User model
  if (user && (await user.matchPassword(password))) {
    // If authentication is successful, send a 200 OK status
    res.json({
      message: "Login successful", // Added a success message
      user: {
        // <--- THIS IS THE CRUCIAL NESTING!
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      token: generateToken(user._id), // Generate a JWT for the authenticated user
    });
  } else {
    // If authentication fails, send a 401 Unauthorized status
    res.status(401);
    throw new Error("Invalid email or password"); // Ensure this is a proper Error object
  }
});

/**
 * @desc    Get user profile (private route)
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  // `req.user` is populated by the `protect` middleware
  // This expects req.user to already be the user document from the database
  const user = await User.findById(req.user._id).select("-password"); // Re-fetch to ensure it's fresh and without password

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/**
 * @desc    Update user profile (private route)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  // `req.user` is populated by the `protect` middleware
  const user = await User.findById(req.user._id);

  if (user) {
    // Update user fields if provided in the request body
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // Only update password if a new password is provided
    if (req.body.password) {
      user.password = req.body.password; // The pre-save middleware will hash this
    }

    const updatedUser = await user.save(); // Save the updated user to the database

    res.json({
      message: "Profile updated successfully", // Added a success message
      user: {
        // <--- THIS IS THE CRUCIAL NESTING!
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      },
      token: generateToken(updatedUser._id), // Generate a new token if profile updated (especially if password changed)
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
