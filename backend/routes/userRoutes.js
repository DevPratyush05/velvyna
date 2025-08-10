// backend/routes/userRoutes.js
// This file simply re-exports routes from authRoutes.js for clarity
const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");

router.use("/", authRoutes);

module.exports = router;
