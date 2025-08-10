// frontend/public/js/pages/payment.js

import { apiFetch, showMessage } from "../utils/api.js";
import { __setCartData } from "./cart.js"; // To clear cart data locally after order

/**
 * Loads and displays the payment page.
 * Populates UPI details and total amount.
 */
export async function loadPaymentPage() {
  console.log("--- Loading Payment Page ---");
  const paymentMethodForm = document.getElementById("payment-method-form");
  const proceedToUpiBtn = document.getElementById("proceed-to-upi-btn");
  const upiDetailsSection = document.getElementById("upi-details-section");
  const displayUpiId = document.getElementById("display-upi-id");
  const displayTotalAmount = document.getElementById("display-total-amount");
  const paymentDoneBtn = document.getElementById("payment-done-btn");
  const cancelPaymentBtn = document.getElementById("cancel-payment-btn");

  // NEW: Log to confirm if the button is found
  console.log("proceedToUpiBtn element found:", !!proceedToUpiBtn);

  // Defensive check for all essential elements
  if (
    !paymentMethodForm ||
    !proceedToUpiBtn ||
    !upiDetailsSection ||
    !displayUpiId ||
    !displayTotalAmount ||
    !paymentDoneBtn ||
    !cancelPaymentBtn
  ) {
    console.error(
      "Payment page: One or more essential elements not found in the DOM."
    );
    showMessage(
      "Payment page components missing. Please contact support.",
      "error"
    );
    window.location.hash = "#cart"; // Redirect back to cart if elements are missing
    return;
  }

  // Always ensure UPI section is hidden initially when page loads
  upiDetailsSection.classList.add("hidden");

  // Retrieve shipping details and order total from session storage
  const tempShippingDetailsString = sessionStorage.getItem(
    "tempShippingDetails"
  );
  const tempOrderTotalString = sessionStorage.getItem("tempOrderTotal");

  if (!tempShippingDetailsString || !tempOrderTotalString) {
    showMessage(
      "Missing order details. Please restart checkout from cart.",
      "error"
    );
    window.location.hash = "#cart"; // Redirect if data is missing
    return;
  }

  let totalAmount = parseFloat(tempOrderTotalString);
  if (isNaN(totalAmount)) {
    console.error(
      "Payment page: Invalid total amount retrieved from session storage:",
      tempOrderTotalString
    );
    showMessage("Invalid total amount. Please restart checkout.", "error");
    window.location.hash = "#cart";
    return;
  }

  // Populate display total amount
  displayTotalAmount.textContent = `₹${totalAmount.toFixed(2)}`;

  // Attach event listeners (remove previous ones to prevent duplicates)
  // The main button that users click to proceed to UPI details
  proceedToUpiBtn.removeEventListener("click", handlePaymentMethodSelect);
  proceedToUpiBtn.addEventListener("click", handlePaymentMethodSelect);

  // This listener on the form's submit is also good practice, but the button one
  // ensures immediate response when the button is clicked directly.
  paymentMethodForm.removeEventListener("submit", handlePaymentMethodSelect);
  paymentMethodForm.addEventListener("submit", handlePaymentMethodSelect);

  // Listeners for "I Have Paid" and "Cancel Payment" buttons
  paymentDoneBtn.removeEventListener("click", handlePaymentDone);
  paymentDoneBtn.addEventListener("click", handlePaymentDone);

  cancelPaymentBtn.removeEventListener("click", handleCancelPayment);
  cancelPaymentBtn.addEventListener("click", handleCancelPayment);
  console.log("Payment page event listeners attached.");
}

/**
 * Handles selecting a payment method and proceeding to UPI details.
 */
function handlePaymentMethodSelect(e) {
  e.preventDefault(); // Prevent default form submission or button action

  console.log("--- handlePaymentMethodSelect called ---");
  const selectedMethod = document.querySelector(
    'input[name="payment-method"]:checked'
  );
  const upiDetailsSection = document.getElementById("upi-details-section");

  if (!selectedMethod) {
    showMessage("Please select a payment method.", "error");
    return;
  }

  if (selectedMethod.value === "UPI") {
    if (upiDetailsSection) {
      upiDetailsSection.classList.remove("hidden");
      showMessage("Proceed with UPI payment.", "info");
      console.log("UPI details section is now visible.");
    } else {
      console.error("UPI details section element not found.");
      showMessage("Error: UPI details section is missing.", "error");
    }
  } else if (selectedMethod.value === "COD") {
    showMessage(
      "Cash on Delivery is not available yet. Please choose UPI.",
      "info"
    );
    // Hide UPI section if COD is selected (though COD is currently disabled)
    if (upiDetailsSection) {
      upiDetailsSection.classList.add("hidden");
    }
  }
}

/**
 * Handles the "I Have Paid" button click.
 * This is where the final order placement API call happens.
 */
async function handlePaymentDone() {
  showMessage("Confirming payment...", "info");

  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Authentication required to place order.", "error");
    window.location.hash = "#auth";
    return;
  }

  const tempShippingDetails = JSON.parse(
    sessionStorage.getItem("tempShippingDetails")
  );
  const tempOrderTotal = parseFloat(sessionStorage.getItem("tempOrderTotal"));

  if (!tempShippingDetails || isNaN(tempOrderTotal)) {
    showMessage("Order details missing. Please restart checkout.", "error");
    window.location.hash = "#cart";
    return;
  }

  try {
    // Fetch the user's current cart items from the backend one last time
    // This is crucial to get the actual orderItems, itemsPrice, taxPrice, shippingPrice
    const cartResponse = await apiFetch("/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!cartResponse.items || cartResponse.items.length === 0) {
      showMessage("Your cart is empty. Cannot place order.", "error");
      window.location.hash = "#cart";
      return;
    }

    // Calculate final prices based on the latest cart data from backend
    let itemsPrice = 0;
    cartResponse.items.forEach((item) => {
      if (item.product && item.product.price) {
        itemsPrice += item.product.price * item.quantity;
      }
    });

    const taxPrice = itemsPrice * 0.15; // Assuming 15% tax
    const shippingPrice = itemsPrice > 1000 ? 0 : 100; // Free shipping over ₹1000
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    // Prepare the order data to send to the backend
    const orderData = {
      orderItems: cartResponse.items.map((item) => ({
        product: item.product._id, // Only send product ID, backend will populate
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        // Name, image, price are derived on backend for security
      })),
      shippingAddress: {
        address: tempShippingDetails.address,
        addressLaneOrHouseNumber: tempShippingDetails.addressLaneOrHouseNumber,
        city: tempShippingDetails.city,
        postalCode: tempShippingDetails.postalCode,
        country: tempShippingDetails.country,
        recipientName: tempShippingDetails.recipientName,
        phoneNumber: tempShippingDetails.phoneNumber,
      },
      paymentMethod: "UPI", // Since user confirmed UPI
      messageForDelivery: tempShippingDetails.messageForDelivery,
      giftWrapped: tempShippingDetails.giftWrapped,
      // Prices are re-calculated on backend for security, but we send them here as well
      itemsPrice: itemsPrice,
      taxPrice: taxPrice,
      shippingPrice: shippingPrice,
      totalPrice: totalPrice,
    };

    // Call the backend API to place the order
    const response = await apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });

    // Clear temporary session storage data
    sessionStorage.removeItem("tempShippingDetails");
    sessionStorage.removeItem("tempOrderTotal");

    // Clear local cart data (backend also clears the cart)
    __setCartData({ items: [] }); // Update cart.js's internal state

    showMessage(response.message || "Order placed successfully!", "success");

    // Update the order confirmation page with actual order details
    const confOrderId = document.getElementById("conf-order-id");
    const confTotalAmount = document.getElementById("conf-total-amount");

    if (confOrderId) confOrderId.textContent = response._id || "#GENERATED";
    if (confTotalAmount)
      confTotalAmount.textContent = `₹${
        response.totalPrice
          ? parseFloat(response.totalPrice).toFixed(2)
          : "0.00"
      }`;

    window.location.hash = "#order-confirmation"; // Redirect to final confirmation
  } catch (error) {
    console.error("Order placement failed:", error);
    showMessage(`Order failed: ${error.message || "Server error"}`, "error");
  }
}

/**
 * Handles the "Cancel Payment" button click.
 * Redirects user back to cart or home.
 */
function handleCancelPayment() {
  showMessage("Payment cancelled. Returning to cart.", "info");
  window.location.hash = "#cart"; // Or '#home'
  // Optionally clear session storage items related to checkout if user cancels
  sessionStorage.removeItem("tempShippingDetails");
  sessionStorage.removeItem("tempOrderTotal");
}
