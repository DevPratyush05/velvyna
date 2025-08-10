// frontend/public/js/utils/productRendering.js

/**
 * Creates and returns an HTML element for a product card.
 * @param {object} product - The product object.
 * @returns {HTMLElement} The product card element.
 */
export function renderProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
        <div class="product-image-container">
            <a href="#product-detail?id=${product._id}">
                <img src="${product.image}" alt="${product.name}">
            </a>
        </div>
        <div class="product-info">
            <h3><a href="#product-detail?id=${product._id}">${
    product.name
  }</a></h3>
            <p class="price">₹${product.price.toFixed(2)}</p>
            <button class="cta-button view-details-btn" data-product-id="${
              product._id
            }">View Details</button>
        </div>
    `;
  return card;
}
