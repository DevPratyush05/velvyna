// backend/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product"); // Assuming your Product model is here
const connectDB = require("./config/db"); // Assuming your database connection function is here

dotenv.config();
connectDB();

const products = [
  {
    name: "Velvyna Stylish Tee",
    brand: "Velvyna",
    description:
      "A stylish and comfortable tee, perfect for casual wear. Made from 100% organic cotton.",
    category: "T-shirt",
    price: 799,
    image: "/images/products/tee-1.jpg", // Ensure you have this image
    countInStock: 25,
    rating: 4.5,
    numReviews: 12,
    sizes: ["S", "M", "L", "XL"],
    variants: [
      { name: "Black", type: "color", hex: "#000000" },
      { name: "White", type: "color", hex: "#FFFFFF" },
      { name: "Navy", type: "color", hex: "#000080" },
    ],
  },
  {
    name: "Cozy Hoodie",
    brand: "Velvyna",
    description:
      "Stay warm and comfortable with this cozy hoodie. Perfect for a relaxed evening out or a chilly day in.",
    category: "Hoodie",
    price: 1299,
    image: "/images/products/hoodie-1.jpg",
    countInStock: 15,
    rating: 4.8,
    numReviews: 8,
    sizes: ["S", "M", "L"],
    variants: [
      { name: "Heather Grey", type: "color", hex: "#D3D3D3" },
      { name: "Charcoal", type: "color", hex: "#36454F" },
    ],
  },
  {
    name: "Denim Jeans",
    brand: "Velvyna",
    description:
      "Classic fit denim jeans, designed for durability and style. A timeless addition to any wardrobe.",
    category: "Jeans",
    price: 1499,
    image: "/images/products/jeans-1.jpg",
    countInStock: 30,
    rating: 4.2,
    numReviews: 15,
    sizes: ["28", "30", "32", "34", "36"],
    variants: [
      { name: "Dark Wash", type: "color", hex: "#1C3144" },
      { name: "Light Wash", type: "color", hex: "#A8DADC" },
    ],
  },
];

const importData = async () => {
  try {
    await Product.deleteMany(); // Clear any existing products
    await Product.insertMany(products); // Insert the new products

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
