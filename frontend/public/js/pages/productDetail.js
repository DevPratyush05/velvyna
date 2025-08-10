// frontend/public/js/pages/productDetail.js

import { apiFetch, showMessage } from "../utils/api.js";
import { handleCheckout, __setCartData } from "./cart.js";

let currentProduct = null; // Stores the product details once fetched

/**
 * Loads and displays product details for a given product ID on the product detail page.
 * @param {string} productId - The ID of the product to display.
 */
export async function loadProductDetailPage(productId) {
  console.log(`Attempting to load product detail for ID: ${productId}`);

  const productNameElement = document.getElementById("product-name");
  const productDescriptionElement = document.getElementById(
    "product-description"
  );
  const productPriceElement = document.getElementById("product-price");
  const productImageElement = document.getElementById("product-image");
  const sizeSelectElement = document.getElementById("size-select");
  const colorVariantsContainer = document.getElementById("color-variants");
  const quantityInputElement = document.getElementById("quantity-input");
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  const buyNowBtn = document.getElementById("buy-now-btn");
  const additionalImagesThumbnailsContainer = document.getElementById(
    "additional-images-thumbnails"
  ); // NEW: Get container for thumbnails

  // Defensive checks for all essential elements
  if (
    !productNameElement ||
    !productDescriptionElement ||
    !productPriceElement ||
    !productImageElement ||
    !sizeSelectElement ||
    !colorVariantsContainer ||
    !quantityInputElement ||
    !addToCartBtn ||
    !buyNowBtn ||
    !additionalImagesThumbnailsContainer // NEW: Include thumbnail container in check
  ) {
    console.error(
      "One or more product detail page elements not found in the DOM. Cannot render product details."
    );
    showMessage(
      "Missing product detail elements. Please check index.html structure.",
      "error"
    );
    window.location.hash = "#products"; // Redirect if critical elements are missing
    return;
  }

  // Show loading state and clear previous content
  productNameElement.textContent = "Loading product...";
  productDescriptionElement.textContent = "";
  productPriceElement.textContent = "";
  productImageElement.src =
    "https://placehold.co/600x600/eeeeee/222222?text=Loading"; // Placeholder while loading
  sizeSelectElement.innerHTML = "";
  colorVariantsContainer.innerHTML = "";
  quantityInputElement.value = 1;
  additionalImagesThumbnailsContainer.innerHTML = ""; // Clear previous thumbnails

  try {
    const product = await apiFetch(`/api/products/${productId}`);
    currentProduct = product; // Store the product globally for handlers

    // Populate the product's main information
    productNameElement.textContent = product.name;
    productDescriptionElement.textContent = product.description;
    productPriceElement.textContent = `₹${product.price.toFixed(2)}`;
    productImageElement.src = product.image; // Set initial main image

    // Populate size options
    const productOptionGroupSize = sizeSelectElement.closest(
      ".product-option-group"
    );
    if (product.sizes && product.sizes.length > 0) {
      sizeSelectElement.innerHTML = product.sizes
        .map((size) => `<option value="${size}">${size}</option>`)
        .join("");
      productOptionGroupSize.classList.remove("hidden"); // Show size option group
    } else {
      productOptionGroupSize.classList.add("hidden"); // Hide if no sizes
      sizeSelectElement.innerHTML = "";
    }

    // Populate color variants and set up image switching
    const productOptionGroupColor = colorVariantsContainer.closest(
      ".product-option-group"
    );
    if (product.colors && product.colors.length > 0) {
      colorVariantsContainer.innerHTML = product.colors
        .map(
          (color) =>
            `<div class="color-swatch" style="background-color:${color.toLowerCase()}" data-color="${color.toLowerCase()}" title="${color}"></div>`
        )
        .join("");
      productOptionGroupColor.classList.remove("hidden"); // Show color option group

      // Attach click listeners to color swatches
      document.querySelectorAll(".color-swatch").forEach((swatch) => {
        swatch.removeEventListener("click", handleColorSwatchClick); // Prevent duplicate listeners
        swatch.addEventListener("click", handleColorSwatchClick);
      });

      // Set the first color as active and update main image based on its specific image URL
      if (document.querySelector(".color-swatch")) {
        const firstSwatch = document.querySelector(".color-swatch");
        firstSwatch.classList.add("active");
        // If product has colorImages, update main image based on first color
        if (product.colorImages && product.colorImages.length > 0) {
          updateProductImageBasedOnColor(firstSwatch.dataset.color);
        }
      }
    } else {
      productOptionGroupColor.classList.add("hidden"); // Hide if no colors
      colorVariantsContainer.innerHTML = "";
    }

    // NEW: Display additional images as thumbnails
    // Add the main image as the first thumbnail
    const mainImageThumbnail = document.createElement("img");
    mainImageThumbnail.src = product.image;
    mainImageThumbnail.alt = `Main image of ${product.name}`;
    mainImageThumbnail.classList.add("additional-image-thumbnail", "active"); // Mark as active initially
    mainImageThumbnail.dataset.imageUrl = product.image; // Store URL for switching
    mainImageThumbnail.addEventListener("click", handleThumbnailClick);
    additionalImagesThumbnailsContainer.appendChild(mainImageThumbnail);

    if (product.additionalImages && product.additionalImages.length > 0) {
      product.additionalImages.forEach((imageUrl) => {
        const thumbnail = document.createElement("img");
        thumbnail.src = imageUrl;
        thumbnail.alt = `Additional image of ${product.name}`;
        thumbnail.classList.add("additional-image-thumbnail");
        thumbnail.dataset.imageUrl = imageUrl; // Store URL for switching
        thumbnail.addEventListener("click", handleThumbnailClick);
        additionalImagesThumbnailsContainer.appendChild(thumbnail);
      });
    }

    // Attach event listeners for Add to Cart and Buy Now buttons
    addToCartBtn.removeEventListener("click", handleAddToCart);
    addToCartBtn.addEventListener("click", handleAddToCart);

    buyNowBtn.removeEventListener("click", handleBuyNow);
    buyNowBtn.addEventListener("click", handleBuyNow);
  } catch (error) {
    console.error("Error loading product detail:", error);
    showMessage(
      `Failed to load product details: ${
        error.message || "Product might not exist or network error."
      }`,
      "error"
    );
    window.location.hash = "#products"; // Redirect to products page on error
  }
}

/**
 * Handles clicking on a color swatch to activate it and potentially change the main product image.
 * @param {Event} e - The click event.
 */
function handleColorSwatchClick(e) {
  document
    .querySelectorAll(".color-swatch")
    .forEach((s) => s.classList.remove("active"));
  e.target.classList.add("active");
  const selectedColor = e.target.dataset.color; // Get the color value from data-color attribute
  updateProductImageBasedOnColor(selectedColor); // Call function to update image
}

/**
 * Updates the main product image based on the selected color.
 * Uses the `colorImages` array from `currentProduct`.
 * @param {string} selectedColor - The color string (e.g., 'red', 'blue', '#FFFFFF').
 */
function updateProductImageBasedOnColor(selectedColor) {
  const productImageElement = document.getElementById("product-image");
  // Ensure product and colorImages exist
  if (
    !productImageElement ||
    !currentProduct ||
    !currentProduct.colorImages ||
    currentProduct.colorImages.length === 0
  ) {
    // If no colorImages, fall back to the main product image (or the currently selected additional image)
    // No change needed to additional image selection.
    return;
  }

  // Find the image URL corresponding to the selected color
  const colorImageEntry = currentProduct.colorImages.find(
    (item) => item.color.toLowerCase() === selectedColor.toLowerCase()
  );

  if (colorImageEntry && colorImageEntry.imageUrl) {
    productImageElement.src = colorImageEntry.imageUrl;
    // When a color is selected, deselect any active additional image thumbnails
    document
      .querySelectorAll(".additional-image-thumbnail")
      .forEach((thumb) => {
        thumb.classList.remove("active");
      });
  } else {
    // Fallback: If no specific image for the selected color, use the main product image
    // Or, more accurately, don't change the main image if it was previously set by additionalImages.
    // For simplicity, we'll reset to the default product.image if no color-specific image exists.
    productImageElement.src = currentProduct.image;
    // And reactivate the main image thumbnail
    const mainImageThumbnail = document.querySelector(
      '.additional-image-thumbnail[data-image-url="' +
        currentProduct.image +
        '"]'
    );
    if (mainImageThumbnail) {
      mainImageThumbnail.classList.add("active");
    }
  }
}

/**
 * Handles clicking on a product image thumbnail to change the main product image.
 * @param {Event} e - The click event.
 */
function handleThumbnailClick(e) {
  const mainImage = document.getElementById("product-image");
  const clickedThumbnailUrl = e.target.dataset.imageUrl;

  if (mainImage && clickedThumbnailUrl) {
    mainImage.src = clickedThumbnailUrl;

    // Update active class for thumbnails
    document
      .querySelectorAll(".additional-image-thumbnail")
      .forEach((thumb) => {
        thumb.classList.remove("active");
      });
    e.target.classList.add("active");

    // When an additional image thumbnail is clicked, remove active state from color swatches
    document.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.classList.remove("active");
    });
  }
}

/**
 * Handles adding the current product to the user's cart.
 */
async function handleAddToCart() {
  if (!currentProduct) {
    showMessage("No product selected for adding to cart.", "error");
    return;
  }

  const quantityInput = document.getElementById("quantity-input");
  const sizeSelect = document.getElementById("size-select");
  const activeColorSwatch = document.querySelector(".color-swatch.active");

  const quantity = parseInt(quantityInput.value, 10);
  const selectedSize = sizeSelect && sizeSelect.value ? sizeSelect.value : null;
  const selectedColor = activeColorSwatch
    ? activeColorSwatch.dataset.color
    : null;

  if (isNaN(quantity) || quantity < 1) {
    showMessage("Please enter a valid quantity.", "error");
    return;
  }

  if (
    currentProduct.sizes &&
    currentProduct.sizes.length > 0 &&
    !selectedSize
  ) {
    showMessage("Please select a size for this product.", "error");
    return;
  }
  if (
    currentProduct.colors &&
    currentProduct.colors.length > 0 &&
    !selectedColor
  ) {
    showMessage("Please select a color for this product.", "error");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Please log in to add items to your cart.", "info");
      window.location.hash = "#auth";
      return;
    }

    const cartItemData = {
      productId: currentProduct._id,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
    };

    const response = await apiFetch("/api/cart", {
      method: "POST",
      body: JSON.stringify(cartItemData),
    });

    showMessage(
      response.message || `${currentProduct.name} added to cart!`,
      "success"
    );
  } catch (error) {
    console.error("Failed to add to cart:", error);
    showMessage(
      `Failed to add to cart: ${error.message || "Server error"}`,
      "error"
    );
  }
}

/**
 * Handles the "Buy Now" action: adds item to cart and immediately proceeds to checkout.
 */
async function handleBuyNow() {
  if (!currentProduct) {
    showMessage("No product selected for immediate purchase.", "error");
    return;
  }

  const quantityInput = document.getElementById("quantity-input");
  const sizeSelect = document.getElementById("size-select");
  const activeColorSwatch = document.querySelector(".color-swatch.active");

  const quantity = parseInt(quantityInput.value, 10);
  const selectedSize = sizeSelect && sizeSelect.value ? sizeSelect.value : null;
  const selectedColor = activeColorSwatch
    ? activeColorSwatch.dataset.color
    : null;

  if (isNaN(quantity) || quantity < 1) {
    showMessage("Please enter a valid quantity.", "error");
    return;
  }

  if (
    currentProduct.sizes &&
    currentProduct.sizes.length > 0 &&
    !selectedSize
  ) {
    showMessage("Please select a size for this product.", "error");
    return;
  }
  if (
    currentProduct.colors &&
    currentProduct.colors.length > 0 &&
    !selectedColor
  ) {
    showMessage("Please select a color for this product.", "error");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Please log in to proceed with purchase.", "info");
      window.location.hash = "#auth";
      return;
    }

    const cartItemData = {
      productId: currentProduct._id,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
    };

    // Add the item to the cart first
    const cartResponse = await apiFetch("/api/cart", {
      method: "POST",
      body: JSON.stringify(cartItemData),
    });

    showMessage("Item added to cart, proceeding to checkout...", "info");

    // Then immediately proceed to checkout.
    await handleCheckout(); // This will place the order for the entire cart
  } catch (error) {
    console.error("Buy Now failed:", error);
    showMessage(`Buy Now failed: ${error.message || "Server error"}`, "error");
  }
}
