  // PawTopia - scriptcart.js (Cart page: dynamic cart table, coupon handling, checkout modal, and reviews scroller)
// ========= Dynamic Cart (table-based) =========
(function() {
  const CART_KEY = 'pt-cart:v1';
  // Supported coupons: code -> discount rate (as fraction of subtotal)
  // Keep existing 99% off code and add new 1% off code per request
  const COUPONS = {
    'B3B0T4CT37': 0.99, // 99% OFF
    '1L0V3UC': 0.01     // 1% OFF
  };
  const tbody = document.getElementById('cartTbody');
  const subtotalEl = document.getElementById('subtotal');
  const discountEl = document.getElementById('discount');
  const totalEl = document.getElementById('total');
  const couponInputEl = document.getElementById('couponInput');
  const couponSuggestionsEl = document.getElementById('couponSuggestions');
  const checkoutBtn = document.querySelector('.checkout-btn');

  // Keep coupon application in-memory only for this session and page load
  let appliedCoupon = '';

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (_) { return []; }
  }
  function saveCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('cartUpdated')); } catch (_) {}
  }
  function peso(n) {
    const num = Number(n) || 0;
    return `₱ ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function computeDiscount(subtotal) {
    const code = appliedCoupon?.toUpperCase();
    if (!code) return 0;
    const rate = COUPONS[code];
    if (!rate) return 0;
    return Math.max(0, Math.round(subtotal * rate * 100) / 100);
  }

  // ===== "You may also like" dynamic recommendations =====
  function buildRandomRecommendations() {
    const grid = document.querySelector('.recently-viewed .products-grid');
    if (!grid) return;

    // Static catalog mirroring Products page
    const S = [
      { t:'Dogcat Pet Bed', c:'Supplies', p:'₱450.00', img:'pictures/products/supplies1.png', d:'Comfy, washable plush bed with raised sides.' },
      { t:'Monello Kitten DryFood 200g', c:'Dry Cat Food', p:'₱220.00', img:'pictures/products/dfcmonello.png', d:'Balanced nutrition for kittens with DHA.' },
      { t:'Royal Canin Adult Dry Food', c:'Dry Cat Food', p:'₱500.00', img:'pictures/products/dfcroyalcanin.png', d:'Indoor adult formula for digestion & coat.' },
      { t:'Yukon Beef Wet Food', c:'Wet Dog Food', p:'₱150.00', img:'pictures/products/wetdogfood1.png', d:'Tasty wet food in easy-serve sachets.' },
      { t:'Halo Meal Bites', c:'Treats', p:'₱75.00', img:'pictures/products/streatshalo.png', d:'Crunchy bite-sized treats for rewards.' },
      { t:'Gud Dog Food 2.5kg', c:'Dry Dog Food', p:'₱1,500.00', img:'pictures/products/drydogfood1.png', d:'Everyday kibble with essential nutrients.' },
      { t:'S.A Soft Chews', c:'Supplements', p:'₱250.00', img:'pictures/products/supplements1.png', d:'Soft chews supporting seasonal relief.' },
      { t:'Pedigree Dentastix Large', c:'Dental Treats', p:'₱115.00', img:'pictures/products/dtreatsdentastix.png', d:'Dental chews to help reduce tartar.' },
      { t:'Pedigree Wet Food', c:'Wet Dog Food', p:'₱550.00', img:'pictures/products/wetdogfood2.png', d:'Complete & balanced meaty wet meal.' },
      { t:'Whiskas Chicken Adult', c:'Wet Cat Food', p:'₱250.00', img:'pictures/products/wetcatfood2.png', d:'Savory chicken wet food for adult cats.' },
      { t:'Cocopup Dog Harness', c:'Accessories', p:'₱790.00', img:'pictures/products/accdogharness.png', d:'Adjustable padded harness for comfy walks.' },
      { t:'Orijen Adult Dog Food', c:'Dry Dog Food', p:'₱990.00', img:'pictures/products/drydogfood2.png', d:'Protein-rich kibble with fresh ingredients.' },
      { t:'RC Feline Weight Care', c:'Wet Cat Food', p:'₱325.00', img:'pictures/products/wetcatfood1.png', d:'Wet formula to help maintain ideal weight.' },
      { t:'Sleeky Chewy Stick Snacks', c:'Dog Treats', p:'₱140.00', img:'pictures/products/streatsstick.png', d:'Chewy sticks ideal for training rewards.' },
      { t:'Purina Dentalife Large', c:'Dental Treats', p:'₱130.00', img:'pictures/products/dtreatsdentalife.png', d:'Porous sticks to clean hard-to-reach teeth.' },
      { t:'Purina Felix Crispies', c:'Cat Treats', p:'₱175.00', img:'pictures/products/dctfelixcrispies.png', d:'Airy, crunchy treats bursting with flavor.' },
      { t:'Purina Friskies Party Mix', c:'Cat Treats', p:'₱200.00', img:'pictures/products/drycattreats2.png', d:'Colorful crunchy treats for cats.' },
      { t:'Churu Creamy Purée 3-Flvr', c:'Cat Treats', p:'₱150.00', img:'pictures/products/wetcattreats1.png', d:'Lickable creamy treats cats love.' },
      { t:'Puddonia Lickable Treats', c:'Cat Treats', p:'₱250.00', img:'pictures/products/wetcattreats2.png', d:'Value pack of smooth lickable treats.' },
      { t:'Petlab Co. Probiotics', c:'Supplements', p:'₱530.00', img:'pictures/products/supplements2.png', d:'Daily probiotic support for dogs.' },
      { t:'Lysine Supplement for Cats', c:'Supplements', p:'₱470.00', img:'pictures/products/supplements3.png', d:'Supports respiratory & eye health.' },
      { t:'Digestive Probiotics', c:'Supplements', p:'₱450.00', img:'pictures/products/supplements4.png', d:'Targeted probiotics for cats digestion.' },
      { t:'Donut-Shaped Chew Toy', c:'Toys', p:'₱75.00', img:'pictures/products/toys2.png', d:'Durable rubber donut for chew & fetch.' },
      { t:'Plush Toys Set', c:'Toys', p:'₱190.00', img:'pictures/products/toys3.png', d:'Soft plush bundle with squeakers.' },
      { t:'Whisker Feather Cat Toy', c:'Toys', p:'₱150.00', img:'pictures/products/toys4.png', d:'Interactive feather toy for chasing.' },
      { t:'Mouse Toys (Set of 10)', c:'Toys', p:'₱100.00', img:'pictures/products/toys1.png', d:'Lightweight fabric mice with rattles.' },
    ];

    // Shuffle and pick 6 unique items
    const pool = S.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const pick = pool.slice(0, 6);

    const html = pick.map(it => `
      <div class="product-card text-center" data-description="${it.d.replace(/"/g,'&quot;')}">
        <img src="${it.img}" alt="${it.t}">
        <p class="text-muted small mb-1">${it.c}</p>
        <p class="fw-semibold mb-1">${it.t}</p>
        <p class="price fw-bold text-orange">${it.p}</p>
        <div class="product-actions">
          <button class="btn btn-outline-dark btn-sm btn-view">VIEW</button>
          <button class="btn btn-dark btn-sm btn-add-cart">ADD TO CART</button>
        </div>
      </div>`).join('');

    grid.innerHTML = html;
  }

  // ===== Ratings + Modal utilities for Cart page =====
  const RATING_PREFIX = 'pt-rating:';
  function roundToHalf(n) { return Math.round(n * 2) / 2; }
  function getOrCreateRating(key) {
    try {
      const saved = localStorage.getItem(RATING_PREFIX + key);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    const base = 3.5 + Math.random() * 1.5; // 3.5..5.0
    const rating = Math.min(5, roundToHalf(base));
    const reviews = Math.floor(25 + Math.random() * 625);
    const data = { rating, reviews };
    try { localStorage.setItem(RATING_PREFIX + key, JSON.stringify(data)); } catch (_) {}
    return data;
  }
  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '';
    for (let i = 0; i < full; i++) html += '<i class="bi bi-star-fill"></i>';
    if (half) html += '<i class="bi bi-star-half"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="bi bi-star"></i>';
    return html;
  }

  const modalEl = document.getElementById('productModal');
  const pmImg = document.getElementById('pmImg');
  const pmTitle = document.getElementById('pmTitle');
  const pmCategory = document.getElementById('pmCategory');
  const pmPrice = document.getElementById('pmPrice');
  const pmDesc = document.getElementById('pmDesc');
  const pmRating = document.getElementById('pmRating');
  const pmAddToCart = document.getElementById('pmAddToCart');
  let bsProductModal = null;
  if (modalEl && window.bootstrap?.Modal) {
    bsProductModal = new window.bootstrap.Modal(modalEl, { backdrop: true, keyboard: true });
  }

  function text(el, sel) { return (el.querySelector(sel)?.textContent || '').trim(); }
  function openProductModal(card) {
    if (!modalEl) return;
    const img = card.querySelector('img');
    const src = img?.getAttribute('src') || '';
    const alt = img?.getAttribute('alt') || '';
    const title = text(card, '.fw-semibold') || alt || 'Product';
    const category = text(card, 'p.text-muted');
    const price = text(card, '.price');
    const desc = (card.getAttribute('data-description') || alt || `${title} — premium quality ${category.toLowerCase() || 'item'} for your pet.`);
    const key = (title || src).toLowerCase();
    const { rating, reviews } = getOrCreateRating(key);

    if (pmImg) { pmImg.src = src; pmImg.alt = alt || title; }
    if (pmTitle) pmTitle.textContent = title;
    if (pmCategory) pmCategory.textContent = category;
    if (pmPrice) pmPrice.textContent = price;
    if (pmDesc) pmDesc.textContent = desc;
    if (pmRating) {
      pmRating.innerHTML = `
        <span class="stars">${renderStars(rating)}</span>
        <span class="rating-score">${rating.toFixed(1)}</span>
        <span class="rating-reviews">(${reviews})</span>
      `;
      pmRating.setAttribute('aria-label', `Rated ${rating.toFixed(1)} out of 5 with ${reviews} reviews`);
    }
    if (bsProductModal) bsProductModal.show();
  }

  // Modal Add to Cart
  pmAddToCart?.addEventListener('click', () => {
    const title = pmTitle?.textContent?.trim() || 'Item';
    const priceText = pmPrice?.textContent?.trim() || '₱ 0.00';
    const price = parseFloat(String(priceText).replace(/[^0-9.\-]+/g, '')) || 0;
    const img = pmImg?.getAttribute('src') || '';
    const slug = (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const items = loadCart();
    const idx = items.findIndex(x => x.slug === slug);
    if (idx >= 0) items[idx].qty += 1; else items.push({ slug, title, price, priceText, img, qty: 1 });
    saveCart(items);
    render();
    try { if (typeof window.showToast === 'function') window.showToast(`Added "${title}" to cart`); } catch(_){}
  });

  function render() {
    const items = loadCart();
    tbody.innerHTML = '';
    if (!items.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.innerHTML = `
        <div class="cart-empty">
          <img src="pictures/puscat.gif" alt="Your cart is empty" class="cart-empty-gif"/>
          <div class="empty-text">Your cart is empty.</div>
          <a class="continue-shopping-link" href="products.html">Continue shopping</a>
        </div>`;
      tr.appendChild(td);
      tbody.appendChild(tr);
      subtotalEl.textContent = '₱ 0.00';
      discountEl.textContent = '₱ 0.00';
      totalEl.textContent = '₱ 0.00';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

  let subtotal = 0;
    items.forEach(it => {
      const tr = document.createElement('tr');
      tr.dataset.slug = it.slug;

      // Product cell
      const tdProd = document.createElement('td');
      tdProd.setAttribute('data-label','Product');
      tdProd.innerHTML = `
        <div class="product-info">
          <img src="${it.img}" alt="${it.title}" class="product-image">
          <div class="product-details">
            <h3>${it.title}</h3>
            <p class="product-price">${it.priceText || peso(it.price)}</p>
          </div>
        </div>`;

      // Quantity cell
      const tdQty = document.createElement('td');
      tdQty.setAttribute('data-label','Quantity');
      tdQty.innerHTML = `
        <div class="quantity-control">
          <button class="btn-minus" aria-label="Decrease">-</button>
          <input type="text" value="${it.qty}" readonly>
          <button class="btn-plus" aria-label="Increase">+</button>
        </div>`;

      // Total cell
      const lineTotal = (Number(it.price) || 0) * (Number(it.qty) || 0);
      subtotal += lineTotal;
      const tdTotal = document.createElement('td');
      tdTotal.setAttribute('data-label','Total');
      tdTotal.innerHTML = `<span class="item-total">${peso(lineTotal)}</span>`;

      // Remove cell
      const tdRm = document.createElement('td');
      tdRm.innerHTML = `<button class="remove-btn" title="Remove">⊗</button>`;

      tr.appendChild(tdProd);
      tr.appendChild(tdQty);
      tr.appendChild(tdTotal);
      tr.appendChild(tdRm);
      tbody.appendChild(tr);

      // Wire events
      tdQty.querySelector('.btn-minus').addEventListener('click', () => changeQty(it.slug, -1));
      tdQty.querySelector('.btn-plus').addEventListener('click', () => changeQty(it.slug, +1));
      tdRm.querySelector('.remove-btn').addEventListener('click', () => removeItem(it.slug));
    });

    const discount = computeDiscount(subtotal);
    const total = Math.max(0, subtotal - discount);
    subtotalEl.textContent = peso(subtotal);
    discountEl.textContent = peso(discount);
    totalEl.textContent = peso(total);
    // Do not auto-fill or auto-apply coupon on render; user must click Apply
    if (checkoutBtn) checkoutBtn.disabled = false;

    // After rendering rows, adjust long totals to fit without wrapping
    try { adjustCartTotalsFont(); } catch (_) {}
  }

  function changeQty(slug, delta) {
    const items = loadCart();
    const idx = items.findIndex(x => x.slug === slug);
    if (idx < 0) return;
    items[idx].qty = Math.max(1, (Number(items[idx].qty) || 1) + delta);
    saveCart(items);
    render();
  }
  function removeItem(slug) {
    let items = loadCart();
    items = items.filter(x => x.slug !== slug);
    saveCart(items);
    render();
  }

  // Expose coupon/checkout handlers referenced by HTML
  window.applyCoupon = function applyCoupon() {
    const raw = (couponInputEl?.value || '').trim();
    if (!raw) {
      if (typeof window.showToast === 'function') window.showToast('Enter a coupon code.');
      return;
    }
    const code = raw.toUpperCase();
    const rate = COUPONS[code];
    if (rate) {
      appliedCoupon = code;
      render();
      const pct = Math.round(rate * 100);
      if (typeof window.showToast === 'function') window.showToast(`Coupon applied: ${pct}% off`);
    } else {
      appliedCoupon = '';
      render();
      if (typeof window.showToast === 'function') window.showToast('Invalid coupon code');
    }
  };
  window.removeCoupon = function removeCoupon() {
    if (!appliedCoupon) {
      if (typeof window.showToast === 'function') window.showToast('No coupon to remove');
      return;
    }
    appliedCoupon = '';
    if (couponInputEl) couponInputEl.value = '';
    render();
    if (typeof window.showToast === 'function') window.showToast('Coupon removed');
  };

  // ===== Coupon suggestions dropdown behavior =====
  (function wireCouponSuggestions(){
    if (!couponInputEl || !couponSuggestionsEl) return;
    const show = () => couponSuggestionsEl.classList.add('show');
    const hide = () => couponSuggestionsEl.classList.remove('show');

    // Show suggestions on focus and click
    couponInputEl.addEventListener('focus', show);
    couponInputEl.addEventListener('click', show);

    // Hide on Escape key
    couponInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      const within = e.target === couponInputEl || couponSuggestionsEl.contains(e.target);
      if (!within) hide();
    });

    // Click on an item fills input and applies coupon
    couponSuggestionsEl.querySelectorAll('.coupon-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const code = item.getAttribute('data-code') || '';
        if (couponInputEl) couponInputEl.value = code;
        hide();
        // auto-apply for convenience
        try { window.applyCoupon(); } catch(_) {}
      });
    });
  })();
  window.checkout = function checkout() {
    // Show a simple Bootstrap modal saying checked out
    let modalEl = document.getElementById('checkoutModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'checkoutModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Checkout</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Item has been checked out.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-dark" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modalEl);
    }
    try {
      if (window.bootstrap?.Modal) {
        const m = window.bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: true, keyboard: true });
        m.show();
      } else {
        // Fallback if Bootstrap JS not available
        alert('Item has been checked out.');
      }
    } catch (_) {
      alert('Item has been checked out.');
    }
  };

  // Dynamically shrink long currency totals to avoid wrapping/misalignment
  function adjustCartTotalsFont() {
    const totals = tbody.querySelectorAll('.item-total');
    totals.forEach(el => fitTextToContainer(el, 12));
    // Also keep product price in first column tidy
    const prices = tbody.querySelectorAll('.product-price');
    prices.forEach(el => fitTextToContainer(el, 11));
  }

  function fitTextToContainer(el, minPx = 12) {
    if (!el) return;
    const td = el.closest('td') || el.parentElement;
    if (!td) return;
    // Reset to computed base size first
    const base = parseFloat(window.getComputedStyle(el).fontSize) || 16;
    el.style.fontSize = base + 'px';
    el.style.whiteSpace = 'nowrap';
    // Compute available width inside the cell
    const tdStyle = window.getComputedStyle(td);
    const pad = (parseFloat(tdStyle.paddingLeft) || 0) + (parseFloat(tdStyle.paddingRight) || 0);
    const available = Math.max(0, td.clientWidth - pad - 4);
    // If it still overflows, shrink until it fits or hits min
    let size = base;
    // Safety cap for iterations
    let guard = 20;
    while (el.scrollWidth > available && size > minPx && guard-- > 0) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  }

  // Re-apply on resize (debounced)
  const debounce = (fn, d=120)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), d); }; };
  window.addEventListener('resize', debounce(() => { try { adjustCartTotalsFont(); } catch(_){} }, 150));

  // Add-to-cart & View from "You may also like" cards (match Products page structure)
  // Build random set first so listeners bind to generated elements
  try { buildRandomRecommendations(); } catch(_) {}
  function slugify(s){return (s||'').toString().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}

  // New buttons (preferred)
  document.querySelectorAll('.recently-viewed .product-card .btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.product-card');
      const title = card.querySelector('.fw-semibold')?.textContent?.trim() || 'Item';
      const priceText = card.querySelector('.price')?.textContent?.trim() || '₱ 0.00';
      const price = parseFloat(priceText.replace(/[^0-9.\-]+/g, '')) || 0;
      const img = card.querySelector('img')?.getAttribute('src') || '';
      const slug = slugify(title);
      const items = loadCart();
      const idx = items.findIndex(x => x.slug === slug);
      if (idx >= 0) items[idx].qty += 1; else items.push({ slug, title, price, priceText, img, qty: 1 });
      saveCart(items);
      render();
      if (typeof window.showToast === 'function') window.showToast(`Added "${title}" to cart`);
    });
  });

  document.querySelectorAll('.recently-viewed .product-card .btn-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = e.currentTarget.closest('.product-card');
      if (card) openProductModal(card);
    });
  });

  // Backward-compat: support any legacy .add-to-cart-btn still present
  document.querySelectorAll('.recently-viewed .product-card .add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.product-card');
      const title = (card.querySelector('h3')?.textContent || card.querySelector('.fw-semibold')?.textContent || 'Item').trim();
      const priceText = card.querySelector('.price')?.textContent?.trim() || '₱ 0.00';
      const price = parseFloat(priceText.replace(/[^0-9.\-]+/g, '')) || 0;
      const img = card.querySelector('img')?.getAttribute('src') || '';
      const slug = slugify(title);
      const items = loadCart();
      const idx = items.findIndex(x => x.slug === slug);
      if (idx >= 0) items[idx].qty += 1; else items.push({ slug, title, price, priceText, img, qty: 1 });
      saveCart(items);
      render();
      if (typeof window.showToast === 'function') window.showToast(`Added "${title}" to cart`);
    });
  });

  // React to updates from other pages/tabs
  window.addEventListener('cartUpdated', render);
  window.addEventListener('storage', (e) => { if (e.key === CART_KEY) render(); });

  // Initial render
  render();
})();

// ================== RECENT REVIEWS (continuous scroll) ==================
document.addEventListener('DOMContentLoaded', function() {
  const track = document.getElementById('cartReviewsTrack');
  if (!track) return;

  // Ratings utilities (persisted per product key in localStorage)
  const RATING_PREFIX = 'pt-rating:';
  function roundToHalf(n) { return Math.round(n * 2) / 2; }
  function ratingKeyForProduct(title, img) {
    return (title || img || '').toLowerCase();
  }
  function getOrCreateRating(key) {
    try {
      const saved = localStorage.getItem(RATING_PREFIX + key);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    const base = 3.5 + Math.random() * 1.5; // 3.5..5.0
    const rating = Math.min(5, roundToHalf(base));
    const reviews = Math.floor(25 + Math.random() * 625);
    const data = { rating, reviews };
    try { localStorage.setItem(RATING_PREFIX + key, JSON.stringify(data)); } catch (_) {}
    return data;
  }
  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '';
    for (let i = 0; i < full; i++) html += '<i class="bi bi-star-fill"></i>';
    if (half) html += '<i class="bi bi-star-half"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="bi bi-star"></i>';
    return html;
  }

  // Curated product catalog per review pool to guarantee image/title match comment theme
  const catalog = {
    dental: [
      { title: 'Pedigree Dentastix Large', price: '₱115.00', img: 'pictures/products/dtreatsdentastix.png' },
      { title: 'Purina Dentalife Large', price: '₱130.00', img: 'pictures/products/dtreatsdentalife.png' }
    ],
    treats: [
      { title: 'Sleeky Chewy Stick Snacks', price: '₱140.00', img: 'pictures/products/streatsstick.png' },
      { title: 'Halo Meal Bites', price: '₱75.00', img: 'pictures/products/streatshalo.png' }
    ],
    catFood: [
      { title: 'Royal Canin Adult Dry Food', price: '₱500.00', img: 'pictures/products/dfcroyalcanin.png' },
      { title: 'Monello Kitten DryFood 200g', price: '₱220.00', img: 'pictures/products/dfcmonello.png' },
      { title: 'RC Feline Weight Care', price: '₱325.00', img: 'pictures/products/wetcatfood1.png' },
      { title: 'Whiskas Chicken Adult', price: '₱250.00', img: 'pictures/products/wetcatfood2.png' }
    ],
    dogFood: [
      { title: 'Orijen Adult Dog Food', price: '₱990.00', img: 'pictures/products/drydogfood2.png' },
      { title: 'Gud Dog Food 2.5kg', price: '₱1,500.00', img: 'pictures/products/drydogfood1.png' },
      { title: 'Pedigree Wet Food', price: '₱550.00', img: 'pictures/products/wetdogfood2.png' },
      { title: 'Yukon Beef Sachet Wet Food', price: '₱150.00', img: 'pictures/products/wetdogfood1.png' }
    ],
    toys: [
      { title: 'Donut-Shaped Pet Chew Toy', price: '₱75.00', img: 'pictures/products/toys2.png' },
      { title: 'Plush Toys Set', price: '₱190.00', img: 'pictures/products/toys3.png' },
      { title: 'Whisker Feather Cat Toy', price: '₱150.00', img: 'pictures/products/toys4.png' },
      { title: 'Mouse Toys (Set of 10)', price: '₱100.00', img: 'pictures/products/toys1.png' }
    ],
    accessories: [
      { title: 'Cocopup Dog Harness', price: '₱790.00', img: 'pictures/products/accdogharness.png' }
    ],
    supplies: [
      { title: 'Dogcat Pet Bed', price: '₱450.00', img: 'pictures/products/supplies1.png' }
    ],
    generic: [
      { title: 'Pet Essentials Bundle', price: '', img: 'pictures/products/supplies1.png' }
    ]
  };

  // Tailored comment pools (lightweight)
  const users = ['Alex M.', 'Jamie S.', 'Renee T.', 'Chris D.', 'Sam P.', 'Jordan K.', 'Taylor R.', 'Morgan L.', 'Casey H.', 'Avery B.', 'Pat G.', 'Drew C.'];
  const pools = {
    catFood: [
      'My cat finishes every bowl now.',
      'Coat looks shinier after switching.',
      'Perfect kibble size for my kitty.'
    ],
    dogFood: [
      'Energy up and no tummy issues.',
      'Picky eater approved—bowl is clean!',
      'Great protein and kibble size.'
    ],
    treats: [
      'Great for training rewards.',
      'My pet can’t get enough of these!',
      'Perfect bite-sized treats.'
    ],
    dental: [
      'Breath is fresher already.',
      'Tartar build-up reduced a lot.',
      'Chewy and cleans teeth well.'
    ],
    toys: [
      'Durable and keeps playtime fun.',
      'Still intact after lots of chewing.',
      'Instant favorite toy!'
    ],
    accessories: [
      'Fits comfortably and looks great.',
      'Easy to adjust and very secure.',
      'Quality materials and hardware.'
    ],
    supplies: [
      'Comfy and easy to clean.',
      'Well-made and supportive.',
      'Great value for the quality.'
    ],
    generic: [
      'Exactly as described and great quality.',
      'Arrived quickly and works as expected.',
      'Five stars—highly recommend.'
    ]
  };

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const poolKeys = ['dental','treats','catFood','dogFood','toys','accessories','supplies'];

  // Create N reviews by picking a pool, then selecting a matching product from catalog
  const N = 16; // base set length; track will duplicate for seamless scroll
  const reviews = Array.from({ length: N }, (_, i) => {
    const key = poolKeys[i % poolKeys.length]; // cycle pools for variety
    const list = catalog[key] && catalog[key].length ? catalog[key] : catalog.generic;
    const product = pick(list);
    const pool = pools[key] || pools.generic;
    // Ratings
    const rk = ratingKeyForProduct(product.title, product.img);
    const { rating, reviews: reviewsCount } = getOrCreateRating(rk);
    return {
      title: product.title,
      price: product.price,
      img: product.img,
      comment: pick(pool),
      user: pick(users),
      rating,
      reviewsCount
    };
  });

  function cardHTML(r) {
    return `
      <div class="card h-100 shadow-sm review-card">
        <div class="card-body">
          <div class="d-flex align-items-center gap-3 mb-2">
            <img src="${r.img}" alt="${r.title}" class="review-product-img">
            <div>
              <div class="fw-semibold">${r.title}</div>
              ${r.price ? `<div class="review-meta"><span class="text-warning">${r.price}</span></div>` : ''}
            </div>
          </div>
          <div class="product-rating" aria-label="Rated ${(r.rating ?? 5).toFixed(1)} out of 5">
            <span class="stars">${renderStars(r.rating ?? 5)}</span>
            <span class="rating-score">${(r.rating ?? 5).toFixed(1)}</span>
            <span class="rating-reviews">(${r.reviewsCount ?? 100})</span>
          </div>
          <p class="review-text mb-2">${r.comment}</p>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark">Verified Purchase</span>
            <span class="review-user">${r.user}</span>
          </div>
        </div>
      </div>`;
  }

  const firstPass = reviews.map(cardHTML).join('');
  // Duplicate content to enable seamless looping (CSS anim translates by 50%)
  track.innerHTML = firstPass + firstPass;
  

});
