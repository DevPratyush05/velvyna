// frontend/public/js/pages/adminProducts.js

import { apiFetch, showMessage } from "../utils/api.js";

let allAdminProducts = []; // Stores products fetched for admin view

/**
 * Loads and displays products in the admin panel.
 * Also sets up forms for adding/editing products.
 */
export async function loadAdminProductsPage() {
  const adminProductListContainer =
    document.getElementById("admin-product-list");
  if (!adminProductListContainer) {
    console.error("Admin product list container not found.");
    return;
  }
  adminProductListContainer.innerHTML =
    "<h2>Loading products for admin...</h2>";

  try {
    const token = localStorage.getItem("token"); // Ensure token is available
    if (!token) {
      showMessage("Unauthorized access. Please log in.", "error");
      window.location.hash = "#auth";
      return;
    }

    // Fetch all products (admin user context via token)
    const response = await apiFetch("/api/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    allAdminProducts = response.products || [];

    renderAdminProducts(allAdminProducts);
  } catch (error) {
    console.error("Failed to load admin products:", error);
    showMessage("Failed to load products for admin: " + error.message, "error");
    adminProductListContainer.innerHTML = "<p>Error loading products.</p>";
  }
}

/**
 * Renders products into the admin product list.
 * @param {Array} productsToRender - Array of product objects.
 */
function renderAdminProducts(productsToRender) {
  const adminProductListContainer =
    document.getElementById("admin-product-list");
  if (!adminProductListContainer) return;

  adminProductListContainer.innerHTML = ""; // Clear existing content

  if (productsToRender.length === 0) {
    adminProductListContainer.innerHTML = "<p>No products found.</p>";
    return;
  }

  productsToRender.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-card"); // Reuse existing product card styling
    productCard.innerHTML = `
            <img src="${
              product.image ||
              "https://placehold.co/200x200/eeeeee/222222?text=No+Image"
            }" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">₹${product.price.toFixed(2)}</p>
                <p>Stock: ${product.countInStock}</p>
                <p>Category: ${product.category}</p>
                <div class="admin-actions">
                    <button class="secondary-button edit-product-btn" data-id="${
                      product._id
                    }">Edit</button>
                    <button class="remove-item-button delete-product-btn" data-id="${
                      product._id
                    }">Delete</button>
                </div>
            </div>
        `;
    adminProductListContainer.appendChild(productCard);
  });

  // Re-attach listeners for edit/delete buttons after rendering
  // This call is correctly placed here as renderAdminProducts populates the DOM
  setupProductActionListeners();
}

/**
 * Sets up global listeners for admin product actions (add, edit, delete).
 * This function is called once from app.js on DOMContentLoaded and again after rendering.
 */
export function setupAdminProductListeners() {
  const addProductForm = document.getElementById("add-product-form");
  const editProductForm = document.getElementById("edit-product-form");
  const adminProductSearchInput = document.getElementById(
    "admin-product-search"
  );
  const editProductModal = document.getElementById("edit-product-modal");
  const closeModalButtons = document.querySelectorAll(
    "#edit-product-modal .close-button"
  );

  if (addProductForm) {
    addProductForm.removeEventListener("submit", handleAddProduct);
    addProductForm.addEventListener("submit", handleAddProduct);
  }
  if (editProductForm) {
    editProductForm.removeEventListener("submit", handleEditProductSubmit);
    editProductForm.addEventListener("submit", handleEditProductSubmit);
  }
  if (adminProductSearchInput) {
    adminProductSearchInput.removeEventListener(
      "input",
      handleAdminProductSearch
    );
    adminProductSearchInput.addEventListener("input", handleAdminProductSearch);
  }

  // Event listeners for closing the modal
  if (editProductModal) {
    closeModalButtons.forEach((button) => {
      button.removeEventListener("click", () =>
        editProductModal.classList.add("hidden")
      );
      button.addEventListener("click", () =>
        editProductModal.classList.add("hidden")
      );
    });
    // Close modal if clicked outside content
    editProductModal.removeEventListener("click", handleModalOutsideClick);
    editProductModal.addEventListener("click", handleModalOutsideClick);
  }

  // Call here for initial setup of existing buttons (if any)
  setupProductActionListeners();
}

/**
 * Attaches event listeners to dynamically created Edit and Delete buttons.
 * This function needs to be defined BEFORE it's called by renderAdminProducts or setupAdminProductListeners.
 */
function setupProductActionListeners() {
  document.querySelectorAll(".edit-product-btn").forEach((button) => {
    // Crucial: remove existing listener to prevent duplicates, then add new one
    button.removeEventListener("click", handleEditProductClick);
    button.addEventListener("click", handleEditProductClick);
  });
  document.querySelectorAll(".delete-product-btn").forEach((button) => {
    // Same for delete (which is working)
    button.removeEventListener("click", handleDeleteProduct);
    button.addEventListener("click", handleDeleteProduct);
  });
}

/**
 * Handles adding a new product.
 */
async function handleAddProduct(e) {
  e.preventDefault();
  const form = e.target;
  let colorImagesArray = [];
  try {
    if (form["add-colorImages"].value) {
      colorImagesArray = JSON.parse(form["add-colorImages"].value);
      // Basic validation for structure
      if (
        !Array.isArray(colorImagesArray) ||
        !colorImagesArray.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "color" in item &&
            "imageUrl" in item
        )
      ) {
        throw new Error(
          "Color Images JSON format is incorrect (each item must have 'color' and 'imageUrl')."
        );
      }
    }
  } catch (parseError) {
    showMessage(
      "Invalid Color Specific Images JSON: " + parseError.message,
      "error"
    );
    return; // Stop function execution if JSON is invalid
  }

  const newProduct = {
    name: form["add-name"].value,
    price: parseFloat(form["add-price"].value),
    description: form["add-description"].value,
    image: form["add-image"].value,
    brand: form["add-brand"].value,
    category: form["add-category"].value,
    countInStock: parseInt(form["add-countInStock"].value, 10) || 1,
    sizes: form["add-sizes"].value
      ? form["add-sizes"].value.split(",").map((s) => s.trim())
      : [],
    colors: form["add-colors"].value
      ? form["add-colors"].value.split(",").map((c) => c.trim())
      : [],
    colorImages: colorImagesArray || [],
    additionalImages: form["add-additionalImages"].value
      ? form["add-additionalImages"].value.split(",").map((url) => url.trim())
      : [], // NEW
  };

  try {
    const createdProduct = await apiFetch("/api/products", {
      method: "POST",
      body: JSON.stringify(newProduct),
    });
    showMessage("Product added successfully!", "success");
    form.reset(); // Clear the form
    loadAdminProductsPage(); // Reload product list
  } catch (error) {
    showMessage("Failed to add product: " + error.message, "error");
  }
}

/**
 * Handles clicking the Edit button for a product.
 */
function handleEditProductClick(e) {
  const productId = e.target.dataset.id;
  const product = allAdminProducts.find((p) => p._id === productId);

  if (!product) {
    showMessage("Product not found for editing.", "error");
    return;
  }

  const editProductForm = document.getElementById("edit-product-form");
  const editProductModal = document.getElementById("edit-product-modal");

  // Populate the edit form
  editProductForm["edit-id"].value = product._id;
  editProductForm["edit-name"].value = product.name;
  editProductForm["edit-price"].value = product.price;
  editProductForm["edit-description"].value = product.description;
  editProductForm["edit-image"].value = product.image;
  editProductForm["edit-brand"].value = product.brand;
  editProductForm["edit-category"].value = product.category;
  editProductForm["edit-countInStock"].value = product.countInStock;
  editProductForm["edit-sizes"].value = product.sizes
    ? product.sizes.join(", ")
    : "";
  editProductForm["edit-colors"].value = product.colors
    ? product.colors.join(", ")
    : "";
  // Populate colorImages field, stringifying the JSON
  editProductForm["edit-colorImages"].value = product.colorImages
    ? JSON.stringify(product.colorImages, null, 2)
    : "";

  editProductForm["edit-additionalImages"].value = product.additionalImages
    ? product.additionalImages.join(", ")
    : ""; // NEW

  editProductModal.classList.remove("hidden"); // Show the modal
}

/**
 * Handles submitting the edited product form.
 */
async function handleEditProductSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const productId = form["edit-id"].value;

  let colorImagesArray = [];
  try {
    if (form["edit-colorImages"].value) {
      colorImagesArray = JSON.parse(form["edit-colorImages"].value);
      // Basic validation for structure
      if (
        !Array.isArray(colorImagesArray) ||
        !colorImagesArray.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "color" in item &&
            "imageUrl" in item
        )
      ) {
        throw new Error(
          "Color Images JSON format is incorrect (each item must have 'color' and 'imageUrl')."
        );
      }
    }
  } catch (parseError) {
    showMessage(
      "Invalid Color Specific Images JSON: " + parseError.message,
      "error"
    );
    return; // Stop function execution if JSON is invalid
  }

  const updatedProduct = {
    name: form["edit-name"].value,
    price: parseFloat(form["edit-price"].value),
    description: form["edit-description"].value,
    image: form["edit-image"].value,
    brand: form["edit-brand"].value,
    category: form["edit-category"].value,
    countInStock: parseInt(form["edit-countInStock"].value, 10) || 1,
    sizes: form["edit-sizes"].value
      ? form["edit-sizes"].value.split(",").map((s) => s.trim())
      : [],
    colors: form["edit-colors"].value
      ? form["edit-colors"].value.split(",").map((c) => c.trim())
      : [],
    colorImages: colorImagesArray || [],
    additionalImages: form["edit-additionalImages"].value
      ? form["edit-additionalImages"].value.split(",").map((url) => url.trim())
      : [], // NEW
  };

  try {
    const response = await apiFetch(`/api/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(updatedProduct),
    });
    showMessage("Product updated successfully!", "success");
    document.getElementById("edit-product-modal").classList.add("hidden"); // Hide the modal
    loadAdminProductsPage(); // Reload product list
  } catch (error) {
    showMessage("Failed to update product: " + error.message, "error");
  }
}

/**
 * Handles deleting a product.
 */
async function handleDeleteProduct(e) {
  const productId = e.target.dataset.id;
  if (
    !confirm(
      "Are you sure you want to delete this product? This cannot be undone!"
    )
  ) {
    return;
  }

  try {
    await apiFetch(`/api/products/${productId}`, {
      method: "DELETE",
    });
    showMessage("Product deleted successfully!", "success");
    loadAdminProductsPage(); // Reload product list
  } catch (error) {
    showMessage("Failed to delete product: " + error.message, "error");
  }
}

/**
 * Handles clicking outside the modal content to close it.
 */
function handleModalOutsideClick(e) {
  const modal = document.getElementById("edit-product-modal");
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
}

/**
 * Handles live search for admin products.
 */
function handleAdminProductSearch() {
  const searchTerm = document
    .getElementById("admin-product-search")
    .value.toLowerCase();
  const filteredProducts = allAdminProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm)
  );
  renderAdminProducts(filteredProducts);
}
