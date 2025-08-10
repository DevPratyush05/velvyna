// frontend/public/js/utils/api.js

const API_BASE_URL = ""; //http://localhost:5000"; // Ensure this matches your backend URL

let messageCloseListenerAdded = false; // Flag to ensure message close listener is added only once

/**
 * Generic function for making API requests.
 * Handles token inclusion and basic error handling.
 * @param {string} endpoint - The API endpoint (e.g., "/api/products").
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} - A promise that resolves with the JSON response.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Attempt to get token from localStorage for all authenticated requests
  const token = localStorage.getItem("token");

  // Ensure headers exist and add Content-Type if it's a POST/PUT/DELETE with a body
  const headers = {
    Accept: "application/json", // Always expect JSON response
    ...options.headers, // Merge existing headers
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options, // Spread existing options (method, body, etc.)
    headers: headers, // Use our constructed headers
    mode: "cors", // Ensure CORS is enabled for cross-origin requests
  };

  console.log(`API Fetch Request: ${options.method || "GET"} ${url}`);
  console.log("Request Headers:", fetchOptions.headers);
  if (fetchOptions.body) {
    console.log("Request Body:", fetchOptions.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    console.log(
      `API Fetch Response Status: ${response.status} for ${endpoint}`
    );

    // If response is not OK and not 401/403 (handled by showMessage below for clarity)
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error(`API Error Response Body for ${endpoint}:`, errorData);
      } catch (jsonError) {
        errorData = {
          message: `Non-JSON error response: ${response.statusText}`,
        };
        console.error(
          `API Error: Could not parse JSON error for ${endpoint}. Status: ${response.status}, Status Text: ${response.statusText}`,
          jsonError
        );
      }

      // Handle specific status codes
      if (response.status === 401) {
        showMessage(
          "Session expired or unauthorized. Please log in again.",
          "error",
          5000
        );
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        window.location.hash = "#auth"; // Redirect to login
      } else if (response.status === 403) {
        showMessage(
          "Access Denied: You don't have permission to perform this action.",
          "error",
          5000
        );
      } else {
        showMessage(errorData.message || "An unknown error occurred.", "error");
      }
      throw new Error(
        errorData.message ||
          `API Error: ${response.status} ${response.statusText}`
      );
    }

    // Attempt to parse JSON response. Some successful responses might have no body (e.g., DELETE, PUT)
    try {
      const data = await response.json();
      console.log(`API Fetch Success Response Data for ${endpoint}:`, data);
      return data;
    } catch (jsonError) {
      // If response is OK but not JSON (e.g., 204 No Content), return an empty object or null
      console.warn(
        `API Warning: Response for ${endpoint} was OK (${response.status}) but not JSON.`,
        jsonError
      );
      return {}; // Return empty object for non-JSON success
    }
  } catch (error) {
    console.error(`API Fetch failed for ${endpoint}:`, error);
    // Only show a generic network error if it's not one of the specific API errors handled above
    if (
      !(
        error instanceof Error &&
        (error.message.includes("Session expired") ||
          error.message.includes("Access Denied"))
      )
    ) {
      showMessage(
        `Network error or CORS issue: ${
          error.message || "Could not connect to server."
        }`,
        "error"
      );
    }
    throw error; // Re-throw to propagate the error
  }
}

/**
 * Function to show messages in a global notification box.
 * @param {string} message - The message text to display.
 * @param {'success'|'error'|'info'} type - The type of message to display (for styling).
 * @param {number} duration - How long the message should be visible in milliseconds.
 */
export function showMessage(message, type = "info", duration = 3000) {
  const messageBox = document.getElementById("message-box");
  const messageText = document.getElementById("message-text");
  const messageCloseButton = document.getElementById("message-close-button");

  console.log("showMessage called:", { message, type, duration });
  console.log("Elements found:", {
    messageBox: !!messageBox,
    messageText: !!messageText,
    messageCloseButton: !!messageCloseButton,
  });

  if (!messageBox || !messageText) {
    console.error("Message box elements not found in DOM for showMessage.");
    return;
  }

  // Ensure close button listener is added only once
  if (messageCloseButton && !messageCloseListenerAdded) {
    messageCloseButton.addEventListener("click", hideMessage);
    messageCloseListenerAdded = true;
    console.log("Message close button listener attached.");
  }

  messageText.textContent = message;

  // Clear previous type classes
  messageBox.classList.remove("success", "error", "info");
  // Add new type class
  messageBox.classList.add(type);

  // Ensure it's not hidden by display:none before animating
  messageBox.classList.remove("hidden");
  messageBox.style.visibility = "visible"; // Explicitly set visibility

  // Force reflow for transition to work correctly if display was just changed
  void messageBox.offsetWidth;

  messageBox.classList.add("active"); // This class triggers the opacity/transform animation

  console.log("Message box state (after adding active):");
  console.log("classList:", Array.from(messageBox.classList).join(", "));
  console.log("visibility:", messageBox.style.visibility);
  console.log("opacity:", getComputedStyle(messageBox).opacity);
  console.log("transform:", getComputedStyle(messageBox).transform);

  // Automatically hide after a duration
  clearTimeout(messageBox.hideTimer); // Clear any existing timer
  messageBox.hideTimer = setTimeout(() => {
    hideMessage();
  }, duration);
}

/**
 * Hides the global notification message box.
 */
function hideMessage() {
  const messageBox = document.getElementById("message-box");
  const messageText = document.getElementById("message-text");

  if (messageBox) {
    messageBox.classList.remove("active"); // Trigger hide animation
    console.log("hideMessage: 'active' class removed from messageBox.");

    // Listen for the end of the transition to truly hide it
    const onTransitionEnd = () => {
      if (!messageBox.classList.contains("active")) {
        // Ensure it's fully hidden
        messageBox.classList.add("hidden"); // Set display: none after animation
        messageBox.style.visibility = "hidden"; // Hide from screen readers
        messageText.textContent = ""; // Clear message text
        console.log("hideMessage: messageBox fully hidden after transition.");
        messageBox.removeEventListener("transitionend", onTransitionEnd); // Clean up listener
      }
    };
    messageBox.addEventListener("transitionend", onTransitionEnd);
  }
}
