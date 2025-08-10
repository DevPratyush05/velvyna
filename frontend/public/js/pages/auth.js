// frontend/public/js/pages/auth.js

import { apiFetch, showMessage } from "../utils/api.js";

/**
 * Toggles visibility between login and register forms and sets up event listeners.
 */
export function setupAuthFormToggle() {
  const showRegisterLink = document.getElementById("show-register");
  const showLoginLink = document.getElementById("show-login");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginButton = document.getElementById("login-button");
  const registerButton = document.getElementById("register-button");

  // Add/remove event listeners to prevent duplicates
  if (showRegisterLink) {
    showRegisterLink.removeEventListener("click", showRegisterForm);
    showRegisterLink.addEventListener("click", showRegisterForm);
  }
  if (showLoginLink) {
    showLoginLink.removeEventListener("click", showLoginForm);
    showLoginLink.addEventListener("click", showLoginForm);
  }
  if (loginButton) {
    loginButton.removeEventListener("click", handleLogin);
    loginButton.addEventListener("click", handleLogin);
  }
  if (registerButton) {
    registerButton.removeEventListener("click", handleRegister);
    registerButton.addEventListener("click", handleRegister);
  }
}

function showRegisterForm(e) {
  e.preventDefault(); // Prevent default link behavior
  document.getElementById("login-form").classList.add("hidden");
  document
    .querySelector("#auth-page .auth-toggle-heading:first-of-type")
    .classList.add("hidden"); // Hide "Login" heading

  document.getElementById("register-form").classList.remove("hidden");
  document
    .querySelector("#auth-page .auth-toggle-heading:nth-of-type(2)")
    .classList.remove("hidden"); // Show "Register" heading

  document.getElementById("show-register").classList.add("hidden"); // Hide "Need an account?" link
  document.getElementById("show-login").classList.remove("hidden"); // Show "Already have account?" link
}

function showLoginForm(e) {
  e.preventDefault(); // Prevent default link behavior
  document.getElementById("login-form").classList.remove("hidden");
  document
    .querySelector("#auth-page .auth-toggle-heading:first-of-type")
    .classList.remove("hidden"); // Show "Login" heading

  document.getElementById("register-form").classList.add("hidden");
  document
    .querySelector("#auth-page .auth-toggle-heading:nth-of-type(2)")
    .classList.add("hidden"); // Hide "Register" heading

  document.getElementById("show-register").classList.remove("hidden"); // Show "Need an account?" link
  document.getElementById("show-login").classList.add("hidden"); // Hide "Already have account?" link
}

export async function handleLogin(e) {
  e.preventDefault(); // Prevent default form submission

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    showMessage("Please enter both email and password.", "error");
    return;
  }

  try {
    const data = await apiFetch("/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Assuming backend returns { user: { _id, name, email, isAdmin }, token }
    if (data && data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.user)); // Store nested user object
      showMessage("Login successful!", "success");
      window.location.hash = "#profile"; // Redirect to profile page
      emailInput.value = ""; // Clear form fields
      passwordInput.value = "";
    } else {
      throw new Error("Invalid response from server.");
    }
  } catch (error) {
    console.error("Login failed:", error);
    showMessage("Login failed: " + error.message, "error");
  }
}

export async function handleRegister(e) {
  e.preventDefault(); // Prevent default form submission

  const nameInput = document.getElementById("register-name");
  const emailInput = document.getElementById("register-email");
  const passwordInput = document.getElementById("register-password");
  const confirmPasswordInput = document.getElementById(
    "register-confirm-password"
  );

  const name = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";
  const confirmPassword = confirmPasswordInput
    ? confirmPasswordInput.value.trim()
    : "";

  if (!name || !email || !password || !confirmPassword) {
    showMessage("All fields are required for registration.", "error");
    return;
  }
  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }
  if (password.length < 6) {
    showMessage("Password must be at least 6 characters long.", "error");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  try {
    const data = await apiFetch("/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    // Assuming backend returns { user: { _id, name, email, isAdmin }, token }
    if (data && data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.user)); // Store nested user object
      showMessage("Registration successful! You are now logged in.", "success");
      window.location.hash = "#profile"; // Redirect to profile page
      // Clear form fields
      nameInput.value = "";
      emailInput.value = "";
      passwordInput.value = "";
      confirmPasswordInput.value = "";
    } else {
      throw new Error("Invalid response from server.");
    }
  } catch (error) {
    console.error("Registration failed:", error);
    showMessage("Registration failed: " + error.message, "error");
  }
}
