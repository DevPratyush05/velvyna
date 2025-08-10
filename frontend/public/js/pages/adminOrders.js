// frontend/public/js/pages/adminOrders.js

import { apiFetch, showMessage } from "../utils/api.js";

let allOrders = []; // Stores all orders fetched for admin view

/**
 * Loads and displays all orders in the admin panel.
 */
export async function loadAdminOrdersPage() {
  console.log("--- Loading Admin Orders Page ---");
  const ordersTableBody = document.getElementById("admin-orders-table-body");
  const noOrdersMessage = document.getElementById("no-orders-message");
  const adminOrderSearchInput = document.getElementById("admin-order-search");

  if (!ordersTableBody || !noOrdersMessage || !adminOrderSearchInput) {
    console.error("Admin order page elements not found.");
    showMessage("Missing elements on admin orders page.", "error");
    return;
  }

  ordersTableBody.innerHTML =
    '<tr><td colspan="10" class="loading-message">Loading orders...</td></tr>';
  noOrdersMessage.classList.add("hidden"); // Hide no orders message initially

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Unauthorized. Please log in as admin.", "error");
      window.location.hash = "#auth";
      return;
    }

    // CRITICAL DEBUGGING LOGS:
    console.log(
      "Attempting to fetch admin orders with token:",
      token ? "Token present" : "No Token"
    );
    console.log(
      "Fetching from API endpoint: /api/orders (GET with admin privileges)"
    );

    // Fetch all orders from the backend (admin route)
    // Ensure this endpoint is correct for fetching ALL orders for admin
    const response = await apiFetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Backend response for admin orders:", response); // NEW: Log the full response

    // Assume response is directly the array of orders, or it's nested under a key
    // Adjust 'response.orders' if your backend returns just the array directly (e.g., 'response')
    allOrders = response.orders || response || []; // Handle both cases for robustness

    if (allOrders.length === 0) {
      ordersTableBody.innerHTML = ""; // Clear loading message
      noOrdersMessage.classList.remove("hidden"); // Show no orders message
      return;
    }

    renderOrdersTable(allOrders); // Render all fetched orders
    // Only attach listener once
    adminOrderSearchInput.removeEventListener("input", handleOrderSearch);
    adminOrderSearchInput.addEventListener("input", handleOrderSearch);
  } catch (error) {
    console.error("Failed to load admin orders:", error);
    showMessage(
      `Failed to load orders: ${error.message || "Server error"}`,
      "error"
    );
    ordersTableBody.innerHTML =
      '<tr><td colspan="10" class="loading-message error">Error loading orders.</td></tr>';
    noOrdersMessage.classList.remove("hidden");
  }
}

/**
 * Renders the orders into the admin table.
 * @param {Array} ordersToRender - Array of order objects.
 */
function renderOrdersTable(ordersToRender) {
  const ordersTableBody = document.getElementById("admin-orders-table-body");
  if (!ordersTableBody) return;

  ordersTableBody.innerHTML = ""; // Clear existing rows

  if (ordersToRender.length === 0) {
    ordersTableBody.innerHTML =
      '<tr><td colspan="10" class="no-results-message">No matching orders found.</td></tr>';
    return;
  }

  ordersToRender.forEach((order) => {
    const row = document.createElement("tr");
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Ensure user and product details are available
    const customerName =
      order.user && order.user.name ? order.user.name : "N/A";
    const customerEmail =
      order.user && order.user.email ? order.user.email : "N/A";

    row.innerHTML = `
            <td>${order._id.substring(0, 8)}...</td>
            <td>${customerName} (${customerEmail})</td>
            <td>₹${order.totalPrice.toFixed(2)}</td>
            <td>${orderDate}</td>
            <td>${order.paymentMethod}</td>
            <td>${
              order.isPaid
                ? '<span class="status-paid">Yes</span>'
                : '<span class="status-not-paid">No</span>'
            }</td>
            <td>${order.orderPlacedWithQikink ? "Yes" : "No"}</td>
            <td>${order.fulfilmentDone ? "Yes" : "No"}</td>
            <td>${order.isDelivered ? "Yes" : "No"}</td>
            <td>
                <button class="secondary-button view-order-details-btn" data-id="${
                  order._id
                }">View Details</button>
            </td>
        `;
    ordersTableBody.appendChild(row);
  });

  setupOrderActionListeners(); // Attach listeners after rendering
}

/**
 * Sets up event listeners for order actions (e.g., View Details buttons).
 */
function setupOrderActionListeners() {
  document.querySelectorAll(".view-order-details-btn").forEach((button) => {
    button.removeEventListener("click", handleViewOrderDetails); // Prevent duplicates
    button.addEventListener("click", handleViewOrderDetails);
  });
}

/**
 * Handles viewing detailed information for a specific order in a modal.
 * @param {Event} e - The click event from the "View Details" button.
 */
async function handleViewOrderDetails(e) {
  const orderId = e.target.dataset.id;
  const order = allOrders.find((o) => o._id === orderId);

  if (!order) {
    showMessage("Order details not found.", "error");
    return;
  }

  const modal = document.getElementById("order-detail-modal");
  const closeButtons = modal.querySelectorAll(".close-button");

  // Populate modal with order data
  document.getElementById("modal-order-id").textContent = order._id;
  document.getElementById("modal-customer-name").textContent = order.user
    ? order.user.name
    : "N/A";
  document.getElementById("modal-customer-email").textContent = order.user
    ? order.user.email
    : "N/A";
  document.getElementById("modal-customer-phone").textContent =
    order.shippingAddress.phoneNumber || "N/A";

  document.getElementById(
    "modal-shipping-recipient"
  ).textContent = `Recipient: ${order.shippingAddress.recipientName}`;
  let fullAddress = order.shippingAddress.address;
  if (order.shippingAddress.addressLaneOrHouseNumber) {
    fullAddress += `, ${order.shippingAddress.addressLaneOrHouseNumber}`;
  }
  document.getElementById("modal-shipping-address").textContent = fullAddress;
  document.getElementById(
    "modal-shipping-city-postal"
  ).textContent = `${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`;
  document.getElementById("modal-shipping-country").textContent =
    order.shippingAddress.country;

  const orderItemsList = document.getElementById("modal-order-items-list");
  orderItemsList.innerHTML = order.orderItems
    .map(
      (item) => `
        <li>
            <img src="${
              item.image || "https://placehold.co/50x50/eee/333?text=Item"
            }" alt="${item.name}" class="order-item-thumbnail">
            ${item.name} ${item.size ? `(${item.size})` : ""} ${
        item.color ? `(${item.color})` : ""
      } - 
            ${item.quantity} x ₹${item.price.toFixed(2)} = ₹${(
        item.quantity * item.price
      ).toFixed(2)}
        </li>
    `
    )
    .join("");

  document.getElementById(
    "modal-items-price"
  ).textContent = `₹${order.itemsPrice.toFixed(2)}`;
  document.getElementById(
    "modal-tax-price"
  ).textContent = `₹${order.taxPrice.toFixed(2)}`;
  document.getElementById(
    "modal-shipping-price"
  ).textContent = `₹${order.shippingPrice.toFixed(2)}`;
  document.getElementById(
    "modal-total-price"
  ).textContent = `₹${order.totalPrice.toFixed(2)}`;
  document.getElementById("modal-payment-method").textContent =
    order.paymentMethod;
  document.getElementById("modal-gift-wrapped").textContent = order.giftWrapped
    ? "Yes"
    : "No";
  document.getElementById("modal-delivery-message").textContent =
    order.messageForDelivery || "No special message.";

  // Set admin tracking checkbox states
  document.getElementById("admin-payment-confirmed").checked =
    order.paymentConfirmedByAdmin;
  document.getElementById("admin-qikink-placed").checked =
    order.orderPlacedWithQikink;
  document.getElementById("admin-fulfillment-done").checked =
    order.fulfilmentDone;
  document.getElementById("admin-is-paid").checked = order.isPaid;
  document.getElementById("admin-is-delivered").checked = order.isDelivered;

  // Attach listener for saving admin status
  const saveAdminStatusBtn = document.getElementById(
    "save-admin-order-status-btn"
  );
  saveAdminStatusBtn.removeEventListener("click", handleSaveAdminOrderStatus); // Prevent duplicates
  saveAdminStatusBtn.addEventListener("click", () =>
    handleSaveAdminOrderStatus(orderId)
  );

  // Listeners for closing the modal
  closeButtons.forEach((button) => {
    button.removeEventListener("click", () => modal.classList.add("hidden"));
    button.addEventListener("click", () => modal.classList.add("hidden"));
  });
  modal.removeEventListener("click", handleModalOutsideClick);
  modal.addEventListener("click", handleModalOutsideClick);

  modal.classList.remove("hidden"); // Show the modal
}

/**
 * Handles updating the admin tracking checkboxes for an order.
 * @param {string} orderId - The ID of the order to update.
 */
async function handleSaveAdminOrderStatus(orderId) {
  const paymentConfirmedByAdmin = document.getElementById(
    "admin-payment-confirmed"
  ).checked;
  const orderPlacedWithQikink = document.getElementById(
    "admin-qikink-placed"
  ).checked;
  const fulfilmentDone = document.getElementById(
    "admin-fulfillment-done"
  ).checked;
  const isPaid = document.getElementById("admin-is-paid").checked;
  const isDelivered = document.getElementById("admin-is-delivered").checked;

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Unauthorized. Please log in as admin.", "error");
      window.location.hash = "#auth";
      return;
    }

    // Send updates to the new backend admin-status endpoint for custom checkboxes
    await apiFetch(`/api/orders/${orderId}/admin-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentConfirmedByAdmin,
        orderPlacedWithQikink,
        fulfilmentDone,
      }),
    });

    // Also update isPaid and isDelivered using their specific routes if changed
    // This makes sure the paidAt/deliveredAt timestamps are also handled
    const currentOrder = allOrders.find((o) => o._id === orderId);
    if (currentOrder) {
      if (isPaid !== currentOrder.isPaid) {
        await apiFetch(`/api/orders/${orderId}/pay`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            /* No specific payment data sent for this simple mark as paid */
          }),
        });
      }
      if (isDelivered !== currentOrder.isDelivered) {
        await apiFetch(`/api/orders/${orderId}/deliver`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    showMessage("Order status updated successfully!", "success");
    document.getElementById("order-detail-modal").classList.add("hidden"); // Hide modal
    loadAdminOrdersPage(); // Re-load the orders to show updated status
  } catch (error) {
    console.error("Failed to update order status:", error);
    showMessage(
      `Failed to update order status: ${error.message || "Server error"}`,
      "error"
    );
  }
}

/**
 * Handles clicking outside the modal content to close it.
 */
function handleModalOutsideClick(e) {
  const modal = document.getElementById("order-detail-modal");
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
}

/**
 * Handles live search for admin orders.
 */
function handleOrderSearch() {
  const searchTerm = document
    .getElementById("admin-order-search")
    .value.toLowerCase();
  const filteredOrders = allOrders.filter(
    (order) =>
      order._id.toLowerCase().includes(searchTerm) ||
      (order.user && order.user.name.toLowerCase().includes(searchTerm)) ||
      (order.user && order.user.email.toLowerCase().includes(searchTerm)) ||
      order.paymentMethod.toLowerCase().includes(searchTerm) ||
      (order.isPaid ? "yes" : "no").includes(searchTerm) ||
      (order.orderPlacedWithQikink ? "yes" : "no").includes(searchTerm) ||
      (order.fulfilmentDone ? "yes" : "no").includes(searchTerm) ||
      (order.isDelivered ? "yes" : "no").includes(searchTerm)
  );
  renderOrdersTable(filteredOrders);
}
