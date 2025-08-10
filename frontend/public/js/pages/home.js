// frontend/public/js/pages/home.js

import { apiFetch, showMessage } from "../utils/api.js";
import { renderProductCard } from "../utils/productRendering.js";

/**
 * Loads and renders a list of products for the home page.
 */
export async function loadHomePageProducts() {
  const productsContainer = document.getElementById(
    "featured-products-container"
  );
  if (!productsContainer) {
    console.error("Home page products container not found.");
    return;
  }

  productsContainer.innerHTML = ""; // Clear previous content
  productsContainer.innerHTML = "<h2>Loading featured products...</h2>"; // Show loading message

  try {
    const response = await apiFetch("/api/products");
    const products = response.products || []; // The backend returns an object with a 'products' array

    productsContainer.innerHTML = ""; // Clear loading message

    // Display a limited number of products for the home page
    products.slice(0, 8).forEach((product) => {
      productsContainer.appendChild(renderProductCard(product));
    });

    // NEW: Attach event listeners to the 'View Details' buttons on the home page
    setupHomePageViewDetailsButtons();
  } catch (error) {
    showMessage("Failed to load products: " + error.message, "error");
    productsContainer.innerHTML =
      "<p>Failed to load featured products. Please try again later.</p>";
  }
}

/**
 * Attaches event listeners to all 'View Details' buttons on the home page.
 * This function should be called after product cards are rendered.
 */
function setupHomePageViewDetailsButtons() {
  // Selects buttons only within the 'featured-products-section' to avoid conflicts
  document
    .querySelectorAll("#featured-products-section .view-details-btn")
    .forEach((button) => {
      // Remove existing listeners to prevent duplicates if function is called multiple times
      button.removeEventListener("click", handleViewDetailsClick);
      button.addEventListener("click", handleViewDetailsClick);
    });
}

/**
 * Handles click on 'View Details' button, navigating to product detail page.
 * This is a shared handler with products.js if its structure is similar.
 */
function handleViewDetailsClick(e) {
  // Get the product ID from the button's data attribute
  const productId = e.target.dataset.productId;
  if (productId) {
    // Navigate using hash and query parameter
    window.location.hash = `#product-detail?id=${productId}`;
  } else {
    showMessage("Product ID not found for details.", "error");
  }
}
