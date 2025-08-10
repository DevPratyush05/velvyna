// frontend/public/js/pages/cart.js

import { apiFetch, showMessage } from "../utils/api.js";

let cartData = { items: [] }; // Store cart data locally after fetching

// Helper to update cartData from outside this file (used by productDetail for 'Buy Now')
export function __setCartData(latestCart) {
  cartData = latestCart;
}

/**
 * Renders the user's shopping cart items.
 * Fetches cart data from the backend API.
 */
export async function renderCartItems() {
  console.log("Fetching and rendering cart items from backend...");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalAmountSpan = document.getElementById("cart-total-amount");

  if (!cartItemsContainer || !cartTotalAmountSpan) {
    console.error("Cart page elements not found.");
    showMessage("Missing elements on cart page.", "error");
    return;
  }

  // Show a loading message while fetching
  cartItemsContainer.innerHTML =
    '<p class="page-description">Loading cart...</p>';
  cartTotalAmountSpan.textContent = "₹0.00"; // Reset total while loading

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Please log in to view your cart.", "info");
      window.location.hash = "#auth";
      return;
    }

    // Always fetch the latest cart from backend for display
    const latestCart = await apiFetch("/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    cartData = latestCart; // Update the local cartData with the fresh data

    if (!cartData.items || cartData.items.length === 0) {
      cartItemsContainer.innerHTML = `<p class="page-description">Your cart is empty.</p>`;
      cartTotalAmountSpan.textContent = "₹0.00";
      return;
    }

    let totalItemsPrice = 0; // This will store the sum of (price * quantity) for all items

    // Render items
    cartItemsContainer.innerHTML = cartData.items
      .map((item) => {
        // Ensure item.product is populated. If not, use fallbacks.
        const productName = item.product
          ? item.product.name
          : "Unknown Product";
        const productImage = item.product
          ? item.product.image
          : "https://placehold.co/100x100/eeeeee/222222?text=Item";
        const productPrice = item.product ? item.product.price : 0; // Use 0 if price is missing

        totalItemsPrice += productPrice * item.quantity; // Accumulate total price for display

        return `
          <div class="cart-item">
            <img src="${productImage}" alt="${productName}" class="cart-item-image">
            <div class="cart-item-info">
              <h3>${productName} ${item.size ? `(${item.size})` : ""} ${
          item.color ? `(${item.color})` : ""
        }</h3>
              <p class="cart-item-price">₹${productPrice.toFixed(2)}</p>
              <div class="cart-item-actions">
                <div class="quantity-controls">
                  <button class="quantity-btn" data-item-id="${
                    item._id
                  }" data-action="decrement">-</button>
                  <span class="item-quantity">${item.quantity}</span>
                  <button class="quantity-btn" data-item-id="${
                    item._id
                  }" data-action="increment">+</button>
                </div>
                <button class="remove-item-btn" data-item-id="${
                  item._id
                }">Remove</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Calculate estimated total including tax and shipping for frontend display clarity
    const estimatedTax = totalItemsPrice * 0.15; // Assuming 15% tax
    const estimatedShipping = totalItemsPrice > 1000 ? 0 : 100; // Free shipping over ₹1000
    const estimatedTotalPrice =
      totalItemsPrice + estimatedTax + estimatedShipping;

    // Update the total amount displayed in the cart summary
    cartTotalAmountSpan.textContent = `₹${estimatedTotalPrice.toFixed(2)}`;

    // Optional: Add a breakdown of prices for transparency in cart summary
    // Only add if it doesn't already exist to prevent duplicates on re-render
    const cartSummaryDiv = cartTotalAmountSpan.closest(".cart-summary");
    if (cartSummaryDiv && !document.getElementById("cart-breakdown")) {
      const breakdownDiv = document.createElement("div");
      breakdownDiv.id = "cart-breakdown";
      breakdownDiv.innerHTML = `
                <p>Items Total: ₹${totalItemsPrice.toFixed(2)}</p>
                <p>Estimated Tax (15%): ₹${estimatedTax.toFixed(2)}</p>
                <p>Estimated Shipping: ₹${estimatedShipping.toFixed(2)}</p>
            `;
      cartSummaryDiv.insertBefore(breakdownDiv, cartTotalAmountSpan.parentNode);
    }

    // --- Attach Event Listeners for Cart Item Interactions ---
    // These must be attached *after* the items are rendered into the DOM
    cartItemsContainer.querySelectorAll(".quantity-btn").forEach((button) => {
      button.removeEventListener("click", handleQuantityChange); // Prevent duplicate listeners
      button.addEventListener("click", handleQuantityChange);
    });

    cartItemsContainer
      .querySelectorAll(".remove-item-btn")
      .forEach((button) => {
        button.removeEventListener("click", handleRemoveItem); // Prevent duplicate listeners
        button.addEventListener("click", handleRemoveItem);
      });
  } catch (error) {
    console.error("Failed to fetch cart items:", error);
    if (error.message.includes("Unauthorized")) {
      showMessage("Please log in to view your cart.", "error");
      window.location.hash = "#auth";
    } else {
      showMessage(
        `Could not load cart: ${error.message || "Server error"}`,
        "error"
      );
      cartItemsContainer.innerHTML =
        '<p class="page-description">Failed to load cart. Please try again or log in.</p>';
    }
  }
}

/**
 * Handles quantity change for a cart item.
 */
async function handleQuantityChange(e) {
  const itemId = e.target.dataset.itemId;
  const action = e.target.dataset.action;

  const currentItem = cartData.items.find((item) => item._id === itemId);
  if (!currentItem) {
    showMessage("Item not found in cart for quantity update.", "error");
    return;
  }

  let newQuantity = currentItem.quantity;
  if (action === "increment") {
    newQuantity++;
  } else if (action === "decrement") {
    newQuantity--;
  }

  try {
    const token = localStorage.getItem("token"); // Re-get token as a precaution
    if (!token) {
      showMessage("Unauthorized. Please log in.", "error");
      window.location.hash = "#auth";
      return;
    }

    if (newQuantity <= 0) {
      // If quantity goes to 0 or less, call remove API
      await apiFetch(`/api/cart/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("Item removed from cart!", "success");
    } else {
      // Else, call update quantity API
      await apiFetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      showMessage("Cart updated!", "success");
    }
    await renderCartItems(); // Re-render cart after update/removal
  } catch (error) {
    console.error("Failed to update cart item quantity:", error);
    showMessage(
      `Failed to update cart: ${error.message || "Server error"}`,
      "error"
    );
  }
}

/**
 * Handles removing an item from the cart.
 */
async function handleRemoveItem(e) {
  const itemId = e.target.dataset.itemId;

  // Use a custom message box instead of confirm() as per instructions, if available
  // For now, retaining confirm() to ensure basic functionality
  if (!confirm("Are you sure you want to remove this item from your cart?")) {
    return;
  }

  try {
    const token = localStorage.getItem("token"); // Re-get token
    if (!token) {
      showMessage("Unauthorized. Please log in.", "error");
      window.location.hash = "#auth";
      return;
    }
    await apiFetch(`/api/cart/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    showMessage("Item removed from cart!", "success");
    await renderCartItems(); // Re-render cart after removal
  } catch (error) {
    console.error("Failed to remove item from cart:", error);
    showMessage(
      `Failed to remove item: ${error.message || "Server error"}`,
      "error"
    );
  }
}

/**
 * Handles the checkout process when the checkout button is clicked.
 * It now redirects to the checkout details page.
 */
export async function handleCheckout() {
  console.log("Initiating checkout...");

  const checkoutButton = document.getElementById("checkout-button");
  if (checkoutButton) {
    // Ensure listener is attached only once by checking and removing existing
    checkoutButton.removeEventListener("click", handleCheckout);
    checkoutButton.addEventListener("click", handleCheckout);
  }

  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Please log in to checkout.", "info");
    window.location.hash = "#auth";
    return;
  }

  // Always fetch the latest cart from backend before checking if empty
  try {
    const latestCart = await apiFetch("/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    cartData = latestCart; // Update local cartData with fresh data
  } catch (err) {
    console.error("Could not refresh cart before checkout:", err);
    showMessage("Error refreshing cart. Please try again.", "error");
    return;
  }

  if (!cartData.items || cartData.items.length === 0) {
    showMessage(
      "Your cart is empty. Please add items before checking out.",
      "error"
    );
    return;
  }

  // Redirect to the new checkout details page
  window.location.hash = "#checkout-details";
}
