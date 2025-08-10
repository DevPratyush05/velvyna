// frontend/public/js/app.js

// Import utility functions and data from other modules
import { showMessage, apiFetch } from "./utils/api.js";

// Import all page-specific logic functions
import { loadHomePageProducts } from "./pages/home.js";
import { loadProductsPage } from "./pages/products.js";
import { loadProductDetailPage } from "./pages/productDetail.js";
import { renderCartItems, handleCheckout } from "./pages/cart.js";
import { renderProfileDetails, setupProfileEditForm } from "./pages/profile.js";
import {
  setupAuthFormToggle,
  handleLogin,
  handleRegister,
} from "./pages/auth.js";
import {
  loadAdminProductsPage,
  setupAdminProductListeners,
} from "./pages/adminProducts.js";
import { loadCheckoutDetailsPage } from "./pages/checkoutDetails.js";
import { loadPaymentPage } from "./pages/payment.js";
import { loadAdminOrdersPage } from "./pages/adminOrders.js"; // Ensure this import is present

// --- Global Application Functions ---

/**
 * Shows a specific page and hides all other pages.
 * @param {string} pageId - The ID of the page section to show (e.g., 'home-page', 'products-page').
 */
function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => {
    page.classList.remove("active");
  });

  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.classList.add("active");
    window.scrollTo(0, 0);
  } else {
    console.error(`Page with ID '${pageId}' not found.`);
    document.getElementById("home-page").classList.add("active");
    showMessage("Page not found. Redirecting to home.", "error");
  }
}

/**
 * Updates the visibility of Login/Register, Logout, Profile and Admin buttons based on authentication status and user role.
 */
function updateAuthButtons() {
  const authLink = document.getElementById("auth-link");
  const logoutButton = document.getElementById("logout-button");
  const profileLink = document.querySelector(".profile-link");
  // CRITICAL: Select ALL admin links, as there are now two
  const adminLinks = document.querySelectorAll(".admin-link");

  const token = localStorage.getItem("token");
  const userInfoString = localStorage.getItem("userInfo");
  let isAuthenticated = !!token;
  let isAdmin = false;

  if (isAuthenticated && userInfoString) {
    try {
      const user = JSON.parse(userInfoString);
      isAdmin = user.isAdmin;
    } catch (e) {
      console.error(
        "Failed to parse userInfo from localStorage, possibly corrupt:",
        e
      );
      isAuthenticated = false;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
    }
  }

  // --- START DEBUGGING LOGS FOR updateAuthButtons ---
  console.log("--- updateAuthButtons Debugging ---");
  console.log("isAuthenticated:", isAuthenticated);
  console.log("isAdmin:", isAdmin);
  console.log("Found adminLinks elements (count):", adminLinks.length);
  adminLinks.forEach((link, index) => {
    console.log(`adminLink[${index}] href:`, link.href);
    console.log(
      `adminLink[${index}] classList:`,
      Array.from(link.classList).join(", ")
    );
    console.log(
      `adminLink[${index}] style.display (before update):`,
      link.style.display
    );
  });
  // --- END DEBUGGING LOGS ---

  if (authLink) {
    authLink.classList.toggle("hidden", isAuthenticated);
  }

  if (logoutButton) {
    logoutButton.classList.toggle("hidden", !isAuthenticated);
  }

  if (profileLink) {
    profileLink.classList.toggle("hidden", !isAuthenticated);
    // Explicitly set display for old browsers or if hidden is not enough
    profileLink.style.display = isAuthenticated ? "flex" : "none";
  }

  // Iterate over all admin links and set their visibility
  adminLinks.forEach((link) => {
    link.classList.toggle("hidden", !isAdmin);
    // Explicitly set display for old browsers or if hidden is not enough
    link.style.display = isAdmin ? "flex" : "none";
  });

  // --- START DEBUGGING LOGS (AFTER UPDATE) ---
  adminLinks.forEach((link, index) => {
    console.log(
      `adminLink[${index}] final classList:`,
      Array.from(link.classList).join(", ")
    );
    console.log(`adminLink[${index}] final style.display:`, link.style.display);
  });
  console.log("--- End updateAuthButtons Debugging ---");
  // --- END DEBUGGING LOGS ---
}

/**
 * Handles user logout.
 * Clears authentication token and redirects to home/auth page.
 */
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("cartItems"); // Clear local cart
  showMessage("You have been logged out.", "info");
  updateAuthButtons(); // Re-run to update nav bar state
  window.location.hash = "#auth"; // Redirect to auth page
}

// --- Main Application Logic (Router) ---

/**
 * Handles client-side routing based on URL hash changes.
 */
function handleRouting() {
  const fullHash = window.location.hash || "#home";
  const hash = fullHash.split("?")[0];

  // Always update buttons first, as this depends on URL hash potentially changing user state
  updateAuthButtons();

  const userInfoString = localStorage.getItem("userInfo");
  let isAuthenticated = !!localStorage.getItem("token");
  let isAdmin = false;

  if (isAuthenticated && userInfoString) {
    try {
      const user = JSON.parse(userInfoString);
      isAdmin = user.isAdmin;
    } catch (e) {
      console.error(
        "Failed to parse userInfo during routing, possibly corrupt:",
        e
      );
      isAuthenticated = false;
    }
  }

  switch (hash) {
    case "#home":
      showPage("home-page");
      loadHomePageProducts();
      break;
    case "#products":
      showPage("products-page");
      loadProductsPage();
      break;
    case "#product-detail":
      const params = new URLSearchParams(fullHash.split("?")[1]);
      const productId = params.get("id");
      if (productId) {
        showPage("product-detail-page");
        loadProductDetailPage(productId);
      } else {
        showMessage(
          "Product ID missing. Redirecting to products page.",
          "error"
        );
        window.location.hash = "#products";
      }
      break;
    case "#cart":
      if (!isAuthenticated) {
        showMessage("Please log in to view your cart.", "info");
        window.location.hash = "#auth";
      } else {
        showPage("cart-page");
        renderCartItems();
      }
      break;
    case "#profile":
      if (!isAuthenticated) {
        showMessage("Please log in to view your profile.", "info");
        window.location.hash = "#auth";
      } else {
        showPage("profile-page");
        renderProfileDetails();
      }
      break;
    case "#auth":
      if (isAuthenticated) {
        showMessage(
          "You are already logged in. Redirecting to profile.",
          "info"
        );
        window.location.hash = "#profile";
      } else {
        showPage("auth-page");
      }
      break;
    case "#admin-products":
      if (!isAuthenticated || !isAdmin) {
        showMessage(
          "Access Denied: You must be logged in as an administrator.",
          "error"
        );
        window.location.hash = "#auth";
      } else {
        showPage("admin-products-page");
        loadAdminProductsPage();
      }
      break;
    case "#admin-orders":
      if (!isAuthenticated || !isAdmin) {
        showMessage(
          "Access Denied: You must be logged in as an administrator.",
          "error"
        );
        window.location.hash = "#auth";
      } else {
        showPage("admin-orders-page");
        loadAdminOrdersPage();
      }
      break;
    // --- NEW STATIC PAGE ROUTES START ---
    case "#contact-us":
      showPage("contact-us-page");
      break;
    case "#privacy-policy":
      showPage("privacy-policy-page");
      break;
    case "#refund-policy":
      showPage("refund-policy-page");
      break;
    case "#shipping-policy":
      showPage("shipping-policy-page");
      break;
    // --- NEW STATIC PAGE ROUTES END ---
    case "#checkout-details":
      if (!isAuthenticated) {
        showMessage("Please log in to proceed with checkout.", "info");
        window.location.hash = "#auth";
      } else {
        showPage("checkout-details-page");
        loadCheckoutDetailsPage();
      }
      break;
    case "#payment":
      console.log("Routing to #payment page. Calling loadPaymentPage().");
      if (!isAuthenticated) {
        showMessage("Please log in to proceed with payment.", "info");
        window.location.hash = "#auth";
      } else {
        showPage("payment-page");
        loadPaymentPage();
      }
      break;
    case "#order-confirmation":
      showPage("order-confirmation-page");
      // Logic for order confirmation page
      break;
    default:
      window.location.hash = "#home";
      break;
  }
}

// --- Event Listeners and Initial Setup ---

window.addEventListener("hashchange", handleRouting);

document.addEventListener("DOMContentLoaded", () => {
  handleRouting(); // Initial page load
  // updateAuthButtons() is now called inside handleRouting for more consistent state management

  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.removeEventListener("click", handleLogout);
    logoutButton.addEventListener("click", handleLogout);
  }

  setupAuthFormToggle();
  setupProfileEditForm();

  const checkoutButton = document.getElementById("checkout-button");
  if (checkoutButton) {
    checkoutButton.removeEventListener("click", handleCheckout);
    checkoutButton.addEventListener("click", handleCheckout);
  }

  // Ensure all admin product listeners are set up
  setupAdminProductListeners();
  // No specific setupAdminOrderListeners needed here as loadAdminOrdersPage will handle it.
});
