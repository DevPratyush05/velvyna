// frontend/public/js/pages/products.js

import { apiFetch, showMessage } from "../utils/api.js";
import { renderProductCard } from "../utils/productRendering.js";

let allProducts = []; // Stores all products fetched from the API

/**
 * Loads and renders all products on the products page.
 */
export async function loadProductsPage() {
  const productList = document.getElementById("product-list");
  if (!productList) {
    console.error("Product list container not found for products page.");
    return;
  }
  productList.innerHTML = "<h2>Loading products...</h2>"; // Show a loading message

  try {
    const response = await apiFetch("/api/products");
    allProducts = response.products || []; // Backend returns an object with a 'products' array

    renderProducts(allProducts); // Render the initial list of products
    populateFilters(allProducts); // Populate filter options (e.g., categories)
    setupFilterListeners(); // Set up listeners for filters and search
    setupViewDetailsButtons(); // Crucially, set up listeners for 'View Details' buttons
  } catch (error) {
    console.error("Error loading products:", error);
    showMessage("Failed to load products: " + error.message, "error");
    productList.innerHTML =
      "<p>Failed to load products. Please try again later.</p>";
  }
}

/**
 * Renders an array of product objects into the product list container.
 * @param {Array} productsToRender - The array of product objects to display.
 */
function renderProducts(productsToRender) {
  const productList = document.getElementById("product-list");
  if (!productList) return;

  productList.innerHTML = ""; // Clear existing products

  if (productsToRender.length === 0) {
    productList.innerHTML = "<p>No products match your criteria.</p>";
    return;
  }

  productsToRender.forEach((product) => {
    // Appends each product card (created by renderProductCard) to the list
    productList.appendChild(renderProductCard(product));
  });
}

/**
 * Populates the category filter dropdown with unique categories from the products.
 * @param {Array} products - All product objects.
 */
function populateFilters(products) {
  const categoryFilter = document.getElementById("category-filter");
  if (!categoryFilter) return;

  // Extract unique categories and add 'All Categories' option
  const categories = [...new Set(products.map((p) => p.category))];
  categoryFilter.innerHTML = '<option value="">All Categories</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });
}

/**
 * Sets up event listeners for filter and search input changes.
 */
function setupFilterListeners() {
  const applyFiltersBtn = document.getElementById("apply-filters");
  const productSearchInput = document.getElementById("product-search");
  const priceRangeInput = document.getElementById("price-range");
  const priceDisplay = document.getElementById("price-display");

  // Remove existing listeners to prevent duplicate calls if this function runs multiple times
  if (applyFiltersBtn) {
    applyFiltersBtn.removeEventListener("click", handleFilters);
    applyFiltersBtn.addEventListener("click", handleFilters);
  }
  if (productSearchInput) {
    productSearchInput.removeEventListener("input", handleFilters); // Use 'input' for live search
    productSearchInput.addEventListener("input", handleFilters);
  }
  if (priceRangeInput) {
    priceRangeInput.removeEventListener("input", updatePriceDisplay);
    priceRangeInput.addEventListener("input", updatePriceDisplay);
    // Initialize price display
    if (priceDisplay) priceDisplay.textContent = priceRangeInput.value;
  }
}

/**
 * Updates the displayed value of the price range slider.
 * @param {Event} e - The input event from the price range slider.
 */
function updatePriceDisplay(e) {
  const priceDisplay = document.getElementById("price-display");
  if (priceDisplay) {
    priceDisplay.textContent = e.target.value;
    handleFilters(); // Apply filters immediately when slider changes
  }
}

/**
 * Applies active filters (category, price, search) to the product list and re-renders.
 */
function handleFilters() {
  const categoryFilter = document.getElementById("category-filter");
  const priceRangeInput = document.getElementById("price-range");
  const productSearchInput = document.getElementById("product-search");

  const selectedCategory = categoryFilter ? categoryFilter.value : "";
  const maxPrice = priceRangeInput
    ? parseFloat(priceRangeInput.value)
    : Infinity;
  const searchTerm = productSearchInput
    ? productSearchInput.value.toLowerCase()
    : "";

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    const matchesPrice = product.price <= maxPrice;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesPrice && matchesSearch;
  });

  renderProducts(filteredProducts);
  setupViewDetailsButtons(); // Re-attach listeners because product cards were re-rendered
}

/**
 * Attaches click event listeners to all 'View Details' buttons on the page.
 * This needs to be called after rendering products, as these buttons are dynamic.
 */
function setupViewDetailsButtons() {
  document.querySelectorAll(".view-details-btn").forEach((button) => {
    button.removeEventListener("click", handleViewDetailsClick); // Prevent duplicate listeners
    button.addEventListener("click", handleViewDetailsClick);
  });
}

/**
 * Event handler for 'View Details' button clicks.
 * Extracts the product ID and navigates to the product detail page.
 * @param {Event} e - The click event.
 */
function handleViewDetailsClick(e) {
  // Get the product ID from the 'data-product-id' attribute of the clicked button
  const productId = e.target.dataset.productId;
  if (productId) {
    // Update the URL hash to trigger the router to load the product detail page
    window.location.hash = `#product-detail?id=${productId}`;
  } else {
    showMessage("Product ID not found for details.", "error");
  }
}
