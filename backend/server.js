// backend/server.js

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");

// Import database connection function
const connectDB = require("./config/db");

// Import route files
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes"); // Your user/auth routes
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Import custom error handling middleware
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config();

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use("/api/products", productRoutes);
app.use("/api/users", authRoutes); // Ensure this correctly maps to your authRoutes (containing login/register/profile)
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, "../frontend/public")));

// For any other requests, serve the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// --- Error Handling Middleware ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  )
);

if (process.env.RENDER) {
  setInterval(() => {
    fetch("https://velvyna-backend.onrender.com")
      .then((res) =>
        console.log("Self-ping OK at", new Date().toLocaleTimeString())
      )
      .catch((err) => console.error("Self-ping failed", err));
  }, 20 * 60 * 1000); // every 20 minutes
}
