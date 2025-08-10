// gemini

// backend/routes/uploadRoutes.js
const express = require("express");
const { upload, uploadImage } = require("../controllers/uploadController"); // Import Multer middleware and upload controller
const { protect, admin } = require("../middleware/authMiddleware"); // Import authentication and admin middleware

const router = express.Router(); // Create an Express router instance

// Route for file uploads:
// POST /api/upload
// This route is protected and only accessible by users with an 'admin' role.
// `upload.single('image')` is Multer middleware that handles a single file upload
// where the field name in the form data is 'image'.
router.post("/", protect, admin, upload.single("image"), uploadImage);

module.exports = router; // Export the router to be used in server.js
