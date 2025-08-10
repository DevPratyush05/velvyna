// gemini

// backend/controllers/uploadController.js
const multer = require("multer"); // Middleware for handling multipart/form-data (file uploads)
const path = require("path"); // Node.js path module for working with file paths
const asyncHandler = require("express-async-handler"); // Simple wrapper for Express async error handling

// 1. Storage Configuration for Multer
const storage = multer.diskStorage({
  // Defines the destination directory for uploaded files
  destination: function (req, file, cb) {
    // `uploads/` is the folder where images will be stored.
    // Make sure this folder exists in your backend directory!
    cb(null, "uploads/");
  },
  // Defines the filename for the uploaded file
  filename: function (req, file, cb) {
    // Creates a unique filename using fieldname (e.g., 'image'), current timestamp,
    // and original file extension (e.g., '.jpg'). Example: 'image-1678888888888.jpg'
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// 2. File Filter for Multer
// This function checks if the uploaded file is an allowed image type.
const fileFilter = (req, file, cb) => {
  // Regular expression to test for common image MIME types and extensions
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype); // Test file's MIME type
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); // Test file's extension

  if (mimetype && extname) {
    return cb(null, true); // Accept the file
  } else {
    // Reject the file and provide an error message
    cb(new Error("Only images (JPEG, JPG, PNG, GIF) are allowed!"), false);
  }
};

// 3. Initialize Multer Upload Middleware
// Configures Multer with the defined storage and file filter.
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5 MB (5 * 1024 * 1024 bytes)
});

/**
 * @desc    Handles the upload of a single product image.
 * @route   POST /api/upload
 * @access  Private/Admin (only administrators can upload images)
 * @returns {string} The path/URL to the newly uploaded file on the server.
 */
const uploadImage = asyncHandler(async (req, res) => {
  // If Multer successfully processed the upload, req.file will contain information about the file.
  if (req.file) {
    // Respond with the path where the image is now accessible on the server.
    // The `/uploads/` prefix makes it accessible via a URL like `http://localhost:5000/uploads/image-123.jpg`
    res.status(200).send(`/${req.file.path}`);
  } else {
    res.status(400); // Bad Request
    throw new Error("No file uploaded or file type not supported");
  }
});

module.exports = { upload, uploadImage };
