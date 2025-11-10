// ===== Cart Helpers =====
const STORAGE_KEY = "cartItems";

function loadCart() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}
function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function formatEGP(n) {
  const val = Number(n) || 0;
  return `${val.toLocaleString("ar-EG")} EGP`;
}
function updateCartBadge() {
  // اختياري: عنصر عداد السلة لو موجود في الهيدر
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const items = loadCart();
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  badge.textContent = totalQty > 0 ? totalQty : "";
}

// ===== Add to Cart =====
function addToCart(name, image, description, price) {
  let quantity = prompt("Enter the quantity for " + name + ":");

  if (quantity === null) return; // user canceled
  quantity = String(quantity).trim();

  if (quantity === "" || isNaN(quantity)) {
    alert("Please enter a valid quantity.");
    return;
  }

  quantity = parseInt(quantity, 10);
  if (quantity <= 0) {
    alert("Please enter a number greater than zero.");
    return;
  }

  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice) || numericPrice < 0) {
    alert("Invalid price for this product.");
    return;
  }

  const cart = loadCart();

  // دمج بالاسم (ولزيادة الدقة بنقارن كمان بالصورة لو حبيتي)
  const idx = cart.findIndex(
    (p) => p.name === name && p.image === image
  );

  if (idx > -1) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({
      name,
      image,
      description,
      quantity,
      price: numericPrice
    });
  }

  saveCart(cart);
  updateCartBadge();
  alert(`${name} has been added to the cart. Quantity: ${quantity}`);
}

// ===== Render Cart (My Products) =====
function computeTotals(items) {
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const totalPrice = items.reduce(
    (s, it) => s + Number(it.quantity || 0) * Number(it.price || 0),
    0
  );
  return { totalQty, totalPrice };
}

function displayCartItems() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const cart = loadCart();

  if (cart.length === 0) {
    container.innerHTML =
      "<p style='font-size: 3rem; text-align: center; color: #fff;'>No items here</p>";
    updateCartBadge();
    return;
  }

  let html = cart
    .map(
      (item, index) => `
      <div class="projects-card1" data-index="${index}">
        <div class="image-container">
          <img src="${item.image}" alt="${item.name} Image">
        </div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p class="price">Price: ${formatEGP(item.price)}</p>

        <div class="qty-row" style="display:flex;gap:.8rem;align-items:center;justify-content:center;margin:.4rem 0 1rem;">
          <button class="card-btn qty-dec" aria-label="decrease">−</button>
          <span class="qty" style="min-width:3ch;text-align:center;font-weight:700;">${item.quantity}</span>
          <button class="card-btn qty-inc" aria-label="increase">+</button>
        </div>

        <p style="font-weight:700;margin:.4rem 0;">Subtotal: ${formatEGP(
          Number(item.price) * Number(item.quantity)
        )}</p>

        <button class="card-btn remove-btn">Remove</button>
      </div>
    `
    )
    .join("");

  const { totalQty, totalPrice } = computeTotals(cart);

  html += `
    <div style="grid-column:1 / -1;display:flex;flex-direction:column;align-items:center;gap:1rem;margin-top:2rem;">
      <p style="font-size:1.8rem;color:#fff;">
        Total Items: <strong>${totalQty}</strong> &nbsp; | &nbsp;
        Total: <strong>${formatEGP(totalPrice)}</strong>
      </p>
      <button class="card-btn" onclick="window.location.href='checkout.html'">Checkout</button>
      <button class="card-btn" style="background:#a33" onclick="clearCart()">Clear Cart</button>
    </div>
  `;

  container.innerHTML = html;

  // Event delegation for qty/removal
  container.addEventListener("click", (e) => {
    const card = e.target.closest(".projects-card1");
    if (!card) return;
    const idx = Number(card.dataset.index);
    if (Number.isNaN(idx)) return;

    if (e.target.classList.contains("qty-inc")) {
      changeQuantity(idx, +1);
    } else if (e.target.classList.contains("qty-dec")) {
      changeQuantity(idx, -1);
    } else if (e.target.classList.contains("remove-btn")) {
      removeItem(idx);
    }
  });

  updateCartBadge();
}

function changeQuantity(index, delta) {
  const cart = loadCart();
  if (!cart[index]) return;

  const next = (cart[index].quantity || 0) + delta;

  if (next <= 0) {
    // تأكيد الحذف لو وصلت للصفر
    if (confirm("Quantity will be 0. Remove this item?")) {
      cart.splice(index, 1);
    } else {
      return;
    }
  } else {
    cart[index].quantity = next;
  }

  saveCart(cart);
  displayCartItems();
}

function removeItem(index) {
  const cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
  displayCartItems();
}

function clearCart() {
  if (!confirm("Clear all items from cart?")) return;
  saveCart([]);
  displayCartItems();
}

// ===== Checkout Page =====
function displayCheckoutItems() {
  const container = document.getElementById("checkout-items");
  if (!container) return;

  const cart = loadCart();

  if (cart.length === 0) {
    container.innerHTML =
      "<p style='font-size: 3rem; text-align: center; color: #fff;'>No items in cart</p>";
    updateCartBadge();
    return;
  }

  const itemsHTML = cart
    .map(
      (item) => `
      <div class="checkout-item">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p class="price">Price: ${formatEGP(item.price)}</p>
        <p>Quantity: ${item.quantity}</p>
        <p><strong>Subtotal: ${formatEGP(
          Number(item.price) * Number(item.quantity)
        )}</strong></p>
      </div>
    `
    )
    .join("");

  const { totalQty, totalPrice } = computeTotals(cart);

  container.innerHTML = `
    ${itemsHTML}
    <hr style="margin:1.5rem 0; opacity:.2;">
    <p style="font-size:1.8rem;color:#fff;text-align:right;">
      Total Items: <strong>${totalQty}</strong> &nbsp; | &nbsp;
      Total: <strong id="checkout-total">${formatEGP(totalPrice)}</strong>
    </p>
  `;

  updateCartBadge();
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("cart-items")) {
    displayCartItems();
  }
  if (document.getElementById("checkout-items")) {
    displayCheckoutItems();
  }
  updateCartBadge();
});


// ===== Shrink Navbar on Scroll =====
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 70) {
    header.classList.add("shrink");
  } else {
    header.classList.remove("shrink");
  }
});
