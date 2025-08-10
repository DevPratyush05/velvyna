// frontend/public/js/pages/checkoutDetails.js

import { showMessage } from "../utils/api.js";

export function loadCheckoutDetailsPage() {
  console.log("Loading Checkout Details Page...");
  const shippingDetailsForm = document.getElementById("shipping-details-form");

  if (shippingDetailsForm) {
    shippingDetailsForm.removeEventListener(
      "submit",
      handleShippingDetailsSubmit
    );
    shippingDetailsForm.addEventListener("submit", handleShippingDetailsSubmit);
  } else {
    console.error("Shipping details form not found on checkout details page.");
    showMessage("Checkout form missing. Please contact support.", "error");
  }
}

/**
 * Handles the submission of the shipping details form.
 * It validates the input and navigates to the payment selection page.
 */
function handleShippingDetailsSubmit(e) {
  e.preventDefault();

  const recipientName = document.getElementById("recipient-name").value.trim();
  const phoneNumber = document.getElementById("phone-number").value.trim();
  const address = document.getElementById("address").value.trim();
  const addressLaneOrHouseNumber = document
    .getElementById("address-lane-or-house-number")
    .value.trim();
  const city = document.getElementById("city").value.trim();
  const postalCode = document.getElementById("postal-code").value.trim();
  const country = document.getElementById("country").value.trim();
  const giftWrapped = document.getElementById("gift-wrapped").checked;
  const messageForDelivery = document
    .getElementById("message-for-delivery")
    .value.trim();

  if (
    !recipientName ||
    !phoneNumber ||
    !address ||
    !city ||
    !postalCode ||
    !country
  ) {
    showMessage("Please fill in all required shipping details.", "error");
    return;
  }

  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    showMessage("Please enter a valid phone number (10-15 digits).", "error");
    return;
  }

  const shippingDetails = {
    recipientName,
    phoneNumber,
    address,
    addressLaneOrHouseNumber,
    city,
    postalCode,
    country,
    giftWrapped,
    messageForDelivery,
  };

  sessionStorage.setItem(
    "tempShippingDetails",
    JSON.stringify(shippingDetails)
  );

  // Get the total amount from where it's currently displayed in the cart.
  // This is a quick way to pass it without re-fetching the cart.
  // A more robust solution might involve re-fetching the cart in payment.js for the final total.
  const cartTotalAmountSpan = document.getElementById("cart-total-amount");
  let totalAmount = 0;
  if (cartTotalAmountSpan) {
    const totalText = cartTotalAmountSpan.textContent.replace("₹", "");
    totalAmount = parseFloat(totalText);
  }
  sessionStorage.setItem("tempOrderTotal", totalAmount.toFixed(2)); // Store the total

  console.log("Shipping Details Captured:", shippingDetails);
  showMessage("Shipping details saved. Proceeding to payment...", "success");

  window.location.hash = "#payment"; // Redirect to payment page
}
