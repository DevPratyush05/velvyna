// frontend/public/js/pages/profile.js

import { apiFetch, showMessage } from "../utils/api.js";

/**
 * Renders the user's profile details.
 */
export async function renderProfileDetails() {
  const profileNameSpan = document.getElementById("profile-name");
  const profileEmailSpan = document.getElementById("profile-email");
  const profileDetailsContainer = document.getElementById(
    "profile-details-container"
  );
  const editProfileFormContainer = document.getElementById("edit-profile-form");

  // Ensure elements exist before proceeding
  if (
    !profileNameSpan ||
    !profileEmailSpan ||
    !profileDetailsContainer ||
    !editProfileFormContainer
  ) {
    console.error(
      "Profile page elements not found. Cannot render profile details."
    );
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated."); // This will be caught below
    }

    // Fetch user profile from the backend
    const user = await apiFetch("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Store fetched user info in local storage (important for other parts of the app)
    localStorage.setItem("userInfo", JSON.stringify(user));

    profileNameSpan.textContent = user.name;
    profileEmailSpan.textContent = user.email;

    // Hide edit form, show details view initially
    profileDetailsContainer.classList.remove("hidden");
    editProfileFormContainer.classList.add("hidden");
  } catch (error) {
    console.error("Failed to load profile:", error);
    if (error.message.includes("Unauthorized")) {
      showMessage("Please log in to view your profile.", "error");
      window.location.hash = "#auth";
    } else {
      showMessage("Failed to load profile: " + error.message, "error");
    }
  }
}

/**
 * Sets up event listeners for the profile edit form buttons.
 * This should be called once on DOMContentLoaded.
 */
export function setupProfileEditForm() {
  const editProfileBtn = document.getElementById("edit-profile-button");
  const saveProfileBtn = document.getElementById("save-profile-button");
  const cancelEditBtn = document.getElementById("cancel-edit-button");

  // Remove existing listeners to prevent duplicates if called multiple times
  if (editProfileBtn) {
    editProfileBtn.removeEventListener("click", handleEditProfile);
    editProfileBtn.addEventListener("click", handleEditProfile);
  }
  if (saveProfileBtn) {
    saveProfileBtn.removeEventListener("click", handleSaveProfile);
    saveProfileBtn.addEventListener("click", handleSaveProfile);
  }
  if (cancelEditBtn) {
    cancelEditBtn.removeEventListener("click", handleCancelEdit);
    cancelEditBtn.addEventListener("click", handleCancelEdit);
  }
}

/**
 * Toggles to the edit profile form.
 */
function handleEditProfile() {
  const profileDetailsContainer = document.getElementById(
    "profile-details-container"
  );
  const editProfileFormContainer = document.getElementById("edit-profile-form");
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  // Populate edit form fields
  if (userInfo) {
    document.getElementById("edit-name").value = userInfo.name || "";
    document.getElementById("edit-email").value = userInfo.email || "";
    document.getElementById("edit-password").value = ""; // Always clear password field for security
  }

  profileDetailsContainer.classList.add("hidden");
  editProfileFormContainer.classList.remove("hidden");
}

/**
 * Cancels profile editing and returns to profile details view.
 */
function handleCancelEdit() {
  const profileDetailsContainer = document.getElementById(
    "profile-details-container"
  );
  const editProfileFormContainer = document.getElementById("edit-profile-form");

  profileDetailsContainer.classList.remove("hidden");
  editProfileFormContainer.classList.add("hidden");
}

/**
 * Handles saving updated profile information to the backend.
 */
async function handleSaveProfile(e) {
  e.preventDefault(); // Prevent default form submission

  const name = document.getElementById("edit-name").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const password = document.getElementById("edit-password").value.trim(); // Optional password update

  if (!name || !email) {
    showMessage("Name and email are required.", "error");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  const updatedUser = { name, email };
  if (password) {
    // Only send password if it's provided
    if (password.length < 6) {
      showMessage("New password must be at least 6 characters long.", "error");
      return;
    }
    updatedUser.password = password;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated for update.");
    }

    const response = await apiFetch("/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedUser),
    });

    if (response) {
      showMessage("Profile updated successfully!", "success");
      // Backend should return the updated user object, store it
      localStorage.setItem("userInfo", JSON.stringify(response.user)); // Assuming response has a 'user' key
      renderProfileDetails(); // Re-render profile details to show changes
      handleCancelEdit(); // Go back to display mode
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
    showMessage("Failed to update profile: " + error.message, "error");
  }
}
