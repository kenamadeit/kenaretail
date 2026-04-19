const revealItems = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -40px 0px",
  }
);

revealItems.forEach((item, index) => {
  item.style.animationDelay = `${index * 80}ms`;
  revealObserver.observe(item);
});

const WHATSAPP_ORDER_NUMBER = "233209331644";
const CHECKOUT_NAME_MAP = {};
const cartSummary = document.querySelector("#cart-summary");
const cartItemsEl = document.querySelector("#cart-items");
const cartTotalEl = document.querySelector("#cart-total");
const cartPreviewEl = document.querySelector("#cart-preview");
const checkoutBtn = document.querySelector("#checkout-btn");
const cart = new Map();

const moneyFormat = new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getEffectivenessRating(productName, productDescription) {
  const text = `${productName} ${productDescription}`.toLowerCase();

  if (/6k\s*growth\s*pack\s*\+\s*derma\s*roller/.test(text)) {
    return 5;
  }

  if (/3k\s*growth\s*pack/.test(text)) {
    return 5;
  }

  if (/(minoxidil|regaine)/.test(text)) {
    return 5;
  }

  if (/(derma roller|derma stamp|derma)/.test(text)) {
    return 4;
  }

  if (/(boost|growth pack)/.test(text)) {
    return 4;
  }

  if (/(biotin|castor|rosemary|mint|oil)/.test(text)) {
    return 3;
  }

  return 4;
}

function formatStars(rating) {
  const safeRating = Math.max(1, Math.min(5, rating));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}

function addProductRatings() {
  document.querySelectorAll(".product").forEach((productCard) => {
    const bodyEl = productCard.querySelector(".product-body");
    const nameEl = productCard.querySelector("h3");
    const descriptionEl = productCard.querySelector(".product-body p:not(.price)");

    if (!bodyEl || !nameEl || !descriptionEl) {
      return;
    }

    const rating = getEffectivenessRating(nameEl.textContent.trim(), descriptionEl.textContent.trim());
    const ratingMarkup = document.createElement("p");
    ratingMarkup.className = "product-rating";
    ratingMarkup.setAttribute("aria-label", `Effectiveness rating: ${rating} out of 5 stars`);
    ratingMarkup.innerHTML = `<span class="stars">${formatStars(rating)}</span> <span class="rating-note">${rating}.0/5 effectiveness</span>`;

    const priceEl = productCard.querySelector(".price");
    if (priceEl && priceEl.nextSibling) {
      bodyEl.insertBefore(ratingMarkup, priceEl.nextSibling);
    } else {
      bodyEl.append(ratingMarkup);
    }
  });
}

function parsePrice(priceText) {
  const normalized = priceText.replace(/[^0-9.]/g, "");
  return Number.parseFloat(normalized) || 0;
}

function getCartStats() {
  let itemCount = 0;
  let total = 0;

  cart.forEach((item) => {
    itemCount += item.qty;
    total += item.qty * item.price;
  });

  return { itemCount, total };
}

function renderCart() {
  if (!cartSummary || !cartItemsEl || !cartTotalEl || !cartPreviewEl) {
    return;
  }

  const { itemCount, total } = getCartStats();

  if (itemCount === 0) {
    cartSummary.hidden = true;
    cartPreviewEl.textContent = "";
    return;
  }

  cartSummary.hidden = false;
  cartItemsEl.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"} selected`;
  cartTotalEl.textContent = `Total: GH₵ ${moneyFormat.format(total)}`;

  const preview = Array.from(cart.values())
    .map((item) => `${item.name} x${item.qty}`)
    .join(" | ");

  cartPreviewEl.textContent = preview;
}

function addToCart(name, price) {
  if (!cart.has(name)) {
    cart.set(name, {
      name,
      price,
      qty: 0,
    });
  }

  const item = cart.get(name);
  item.qty += 1;
  renderCart();
}

function buildWhatsAppMessage() {
  const { itemCount, total } = getCartStats();

  if (itemCount === 0) {
    return "";
  }

  const lines = ["Hello KENA, I want to order:", ""];

  cart.forEach((item) => {
    const lineTotal = item.qty * item.price;
    const checkoutName = CHECKOUT_NAME_MAP[item.name] || item.name;
    lines.push(`- ${checkoutName} x${item.qty} = GH₵ ${moneyFormat.format(lineTotal)}`);
  });

  lines.push("");
  lines.push(`Total items: ${itemCount}`);
  lines.push(`Total price: GH₵ ${moneyFormat.format(total)}`);
  lines.push("Please confirm availability and delivery.");

  return lines.join("\n");
}

document.querySelectorAll(".product").forEach((productCard) => {
  const actionBtn = productCard.querySelector(".product-action");
  const nameEl = productCard.querySelector("h3");
  const priceEl = productCard.querySelector(".price");

  if (!actionBtn || !nameEl || !priceEl) {
    return;
  }

  const productName = nameEl.textContent.trim();
  const productPrice = parsePrice(priceEl.textContent);

  actionBtn.addEventListener("click", (event) => {
    event.preventDefault();
    addToCart(productName, productPrice);
  });
});

addProductRatings();

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    const message = buildWhatsAppMessage();

    if (!message) {
      return;
    }

    const link = `https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${encodeURIComponent(message)}`;
    window.location.href = link;
  });
}
