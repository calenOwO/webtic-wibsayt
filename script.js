// PawTopia - script.js (Shared header/search, navigation, suggestions, carousel tweaks, cart badge, and contact form)
const searchIcon = document.getElementById('searchIcon');
const searchInput = document.getElementById('searchInput');
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
const header = document.querySelector('header');
const userIcon = document.getElementById('userIcon');
const loginDropdown = document.getElementById('loginDropdown');

// Search functionality
searchIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    searchInput.classList.toggle('active');
    if (searchInput.classList.contains('active')) {
        searchInput.focus();
    }
    loginDropdown.classList.remove('active');
});

// Close search when clicking outside
document.addEventListener('click', function (event) {
    if (!event.target.closest('.search-container')) {
        searchInput.classList.remove('active');
    }
    if (!event.target.closest('.user-container')) {
        loginDropdown.classList.remove('active');
    }
});

// User icon / Login dropdown
userIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    loginDropdown.classList.toggle('active');
    searchInput.classList.remove('active');
});

// Hamburger menu toggle
hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('active');
    nav.classList.toggle('active');
    // Recompute body offset after menu expands/collapses
    setTimeout(() => {
      if (typeof updateBodyOffset === 'function') updateBodyOffset();
    }, 320);
});

// Close menu when clicking on a link
const navLinks = document.querySelectorAll('nav ul li a');
navLinks.forEach(link => {
    link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
    if (typeof updateBodyOffset === 'function') updateBodyOffset();
    });
});

// Shrink header on scroll
window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Ensure content starts below fixed header height
function updateBodyOffset() {
  if (!header) return;
  const h = header.offsetHeight + 'px';
  document.body.style.paddingTop = h; // in-case other pages rely on inline padding
  // Also expose as CSS variable for any section-specific offsets
  document.documentElement.style.setProperty('--header-offset', h);
}

window.addEventListener('load', updateBodyOffset);
window.addEventListener('resize', updateBodyOffset);
if (window.ResizeObserver && header) {
  try {
    const ro = new ResizeObserver(updateBodyOffset);
    ro.observe(header);
  } catch (_) {}
}

// Login form - just close dropdown on submit
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginDropdown.classList.remove('active');
});

document.querySelectorAll('.categories-container').forEach(container => {
  const wrapper = container.querySelector('.categories-wrapper');
  const leftBtn = container.querySelector('.scroll-btn.left');
  const rightBtn = container.querySelector('.scroll-btn.right');
  const cards = container.querySelectorAll('.category-card');

  const cardWidth = cards[0].offsetWidth + 200;

  leftBtn.addEventListener('click', () => {
    wrapper.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });

  rightBtn.addEventListener('click', () => {
    wrapper.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });
});


// Initialize carousel only if present on the page
try {
  const myCarouselElement = document.querySelector('#myCarousel');
  if (myCarouselElement && window.bootstrap && typeof bootstrap.Carousel === 'function') {
    new bootstrap.Carousel(myCarouselElement, {
      interval: 2000,
      touch: false
    });
  }
} catch (_) { /* no-op */ }



    // Auto-hide scrollbar after scrolling stops
  const categoriesWrapper = document.querySelector('.categories-wrapper');
  let scrollTimeout;

  if (categoriesWrapper) {
    categoriesWrapper.addEventListener('scroll', function() {
      // Add scrolling class to show scrollbar
      this.classList.add('scrolling');
      
      // Clear existing timeout
      clearTimeout(scrollTimeout);
      
      // Set timeout to hide scrollbar after 1 second of no scrolling
      scrollTimeout = setTimeout(() => {
        this.classList.remove('scrolling');
      }, 1000); // Scrollbar disappears after 1 second
    });
  }

// Best Sellers carousel: keep HTML intact; mobile count handled via CSS (2 cards/slide)

// ================= Product search suggestions (autocomplete across pages) =================
(function productSearchSuggestions() {
  const input = document.getElementById('searchInput');
  const container = input?.closest('.search-container');
  if (!input || !container) return;

  // Inject lightweight styles once
  if (!document.getElementById('search-suggest-styles')) {
    const style = document.createElement('style');
    style.id = 'search-suggest-styles';
    style.textContent = `
      .search-suggest{position:absolute;top:42px;right:0;min-width:260px;max-width:360px;max-height:320px;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.12);z-index:1200;display:none}
      .search-suggest.open{display:block}
      .search-suggest .sg-item{display:flex;gap:10px;align-items:center;padding:8px 10px;cursor:pointer}
      .search-suggest .sg-item:hover,.search-suggest .sg-item.active{background:#f7f7f7}
      .search-suggest .thumb{width:40px;height:40px;object-fit:contain;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px}
      .search-suggest .meta{display:flex;flex-direction:column}
      .search-suggest .title{font-size:14px;font-weight:600;color:#111;line-height:1.2}
      .search-suggest .cat{font-size:12px;color:#666}
    `;
    document.head.appendChild(style);
  }

  // Product index (static, mirrors Products page)
  function slugify(s){return (s||'').toString().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
  const P = (title, cat, img, price) => ({ title, cat, img, price, slug: slugify(title) });
  const index = [
    P('Dogcat Pet Bed','Supplies','pictures/products/supplies1.png','₱450.00'),
    P('Monello Kitten DryFood 200g','Dry Cat Food','pictures/products/dfcmonello.png','₱220.00'),
    P('Royal Canin Adult Dry Food','Dry Cat Food','pictures/products/dfcroyalcanin.png','₱500.00'),
    P('Yukon Beef Sachet Wet Food','Wet Dog Food','pictures/products/wetdogfood1.png','₱150.00'),
    P('Halo Meal Bites','Treats','pictures/products/streatshalo.png','₱75.00'),
    P('Gud Dog Food 2.5kg','Dry Dog Food','pictures/products/drydogfood1.png','₱1,500.00'),
    P('Seasonal Allergy Soft Chews','Supplements','pictures/products/supplements1.png','₱250.00'),
    P('Pedigree Dentastix Large','Dental Treats','pictures/products/dtreatsdentastix.png','₱115.00'),
    P('Pedigree Wet Food','Wet Dog Food','pictures/products/wetdogfood2.png','₱550.00'),
    P('Whiskas Chicken Adult','Wet Cat Food','pictures/products/wetcatfood2.png','₱250.00'),
    P('Cocopup Dog Harness','Accessories','pictures/products/accdogharness.png','₱790.00'),
    P('Orijen Adult Dog Food','Dry Dog Food','pictures/products/drydogfood2.png','₱990.00'),
    P('RC Feline Weight Care','Wet Cat Food','pictures/products/wetcatfood1.png','₱325.00'),
    P('Sleeky Chewy Stick Snacks','Dog Treats','pictures/products/streatsstick.png','₱140.00'),
    P('Purina Dentalife Large','Dental Treats','pictures/products/dtreatsdentalife.png','₱130.00'),
    P('Purina Felix Crispies','Cat Treats','pictures/products/dctfelixcrispies.png','₱175.00'),
    P('Purina Friskies Party Mix','Cat Treats','pictures/products/drycattreats2.png','₱200.00'),
    P('Churu Creamy Purée 3-Flavor','Cat Treats','pictures/products/wetcattreats1.png','₱150.00'),
    P('Puddonia Lickable Treats','Cat Treats','pictures/products/wetcattreats2.png','₱250.00'),
    P('Petlab Co. Probiotic for Dogs','Supplements','pictures/products/supplements2.png','₱530.00'),
    P('Lysine Supplement for Cats','Supplements','pictures/products/supplements3.png','₱470.00'),
    P('Digestive Probiotics for Cats','Supplements','pictures/products/supplements4.png','₱450.00'),
    P('Donut-Shaped Pet Chew Toy','Toys','pictures/products/toys2.png','₱75.00'),
    P('Plush Toys Set','Toys','pictures/products/toys3.png','₱190.00'),
    P('Whisker Feather Cat Toy','Toys','pictures/products/toys4.png','₱150.00'),
    P('Mouse Toys (Set of 10)','Toys','pictures/products/toys1.png','₱100.00')
  ];

  // UI container
  const list = document.createElement('div');
  list.className = 'search-suggest';
  list.setAttribute('role','listbox');
  container.appendChild(list);

  let activeIndex = -1;
  let currentItems = [];

  function score(item, q) {
    const hay = `${item.title} ${item.cat}`.toLowerCase();
    if (item.title.toLowerCase().startsWith(q)) return 100;
    if (item.title.toLowerCase().includes(q)) return 60;
    if (hay.includes(q)) return 30;
    return hay.split(/\s+/).some(w => w.startsWith(q)) ? 20 : -1;
  }

  function render(q) {
    const term = (q || '').trim().toLowerCase();
    if (!term) { close(); return; }
    const matches = index.map(it => ({ it, s: score(it, term) }))
      .filter(x => x.s >= 0)
      .sort((a,b) => b.s - a.s)
      .slice(0, 8)
      .map(x => x.it);
    currentItems = matches;
    list.innerHTML = '';
    activeIndex = -1;
    if (matches.length === 0) { close(); return; }
    matches.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'sg-item';
      row.setAttribute('role','option');
      row.dataset.index = String(i);
      row.innerHTML = `
        <img class="thumb" src="${it.img}" alt="${it.title}">
        <div class="meta">
          <div class="title">${it.title}</div>
          <div class="cat">${it.cat} • <span class="text-orange">${it.price}</span></div>
        </div>`;
      row.addEventListener('mousedown', (e) => { e.preventDefault(); }); // prevent input blur
      row.addEventListener('click', () => select(i));
      list.appendChild(row);
    });
    open();
  }

  function open(){ list.classList.add('open'); }
  function close(){ list.classList.remove('open'); }
  function move(delta){
    if (!list.classList.contains('open')) return;
    const len = currentItems.length;
    activeIndex = (activeIndex + delta + len) % len;
    Array.from(list.children).forEach((el, idx) => el.classList.toggle('active', idx === activeIndex));
  }
  function select(idx){
    if (idx < 0 || idx >= currentItems.length) return;
    const it = currentItems[idx];
    // If on products page already, open modal directly via custom event
    const onProducts = /products\.html(\?|#|$)/.test(window.location.pathname) || !!document.getElementById('productModal');
    if (onProducts) {
      document.dispatchEvent(new CustomEvent('openProductBySlug', { detail: { slug: it.slug } }));
    } else {
      window.location.href = `products.html?product=${encodeURIComponent(it.slug)}`;
    }
    close();
  }

  const debounced = ((fn, d=120)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),d);};})(render);
  input.addEventListener('input', () => debounced(input.value));
  input.addEventListener('focus', () => { if (input.value) render(input.value); });
  input.addEventListener('keydown', (e) => {
    if (!list.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      if (activeIndex >= 0) { e.preventDefault(); select(activeIndex); }
      else if (input.value.trim()) {
        // No selection: go to products page with full text search
        window.location.href = `products.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    } else if (e.key === 'Escape') { close(); }
  });
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) close();
  });
})();

// ================= Cart badge (item count in header) =================
(function cartBadge() {
  const CART_KEY = 'pt-cart:v1';
  const link = document.querySelector('a[href="cart.html"]');
  if (!link) return;

  // Inject styles
  if (!document.getElementById('cart-badge-styles')) {
    const style = document.createElement('style');
    style.id = 'cart-badge-styles';
    style.textContent = `
      .cart-link{position:relative;display:inline-block}
      .cart-badge{position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#ff5252;color:#fff;font-size:11px;line-height:18px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.25);display:none}
    `;
    document.head.appendChild(style);
  }

  // Ensure wrapper for positioning
  link.classList.add('cart-link');
  let badge = link.querySelector('.cart-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'cart-badge';
    link.appendChild(badge);
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (_) { return []; }
  }
  function refresh() {
    const items = loadCart();
    const count = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  refresh();
  window.addEventListener('cartUpdated', refresh);
  window.addEventListener('storage', (e) => { if (e.key === CART_KEY) refresh(); });
})();






// ====== BEST SELLER ADD & VIEW BUTTONS ====== //
document.addEventListener('DOMContentLoaded', function() {
  
  // Cart utilities
  const CART_KEY = 'pt-cart:v1';
  
  function loadCart() {
    try { 
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); 
    } catch (_) { 
      return []; 
    }
  }
  
  function saveCart(items) {
    try { 
      localStorage.setItem(CART_KEY, JSON.stringify(items)); 
    } catch (_) {}
    try { 
      window.dispatchEvent(new CustomEvent('cartUpdated')); 
    } catch (_) {}
  }
  
  function parsePrice(text) {
    const n = parseFloat(String(text).replace(/[^0-9.\-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  
  function addItemToCart(item) {
    const cart = loadCart();
    const idx = cart.findIndex(x => x.slug === item.slug);
    if (idx >= 0) {
      cart[idx].qty += item.qty || 1;
    } else {
      cart.push({ ...item, qty: item.qty || 1 });
    }
    saveCart(cart);
  }

  function slugify(s) {
    return (s || '')
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Custom Toast function
  function showToast(productName) {
    // Create container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = `Added "${productName}" to cart`;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
        // Remove container if empty
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, 3000);
  }

  // Handle ADD TO CART button clicks in Best Sellers (supports old and new classes)
  document.querySelectorAll('.best-sellers-section .btn-add-cart, .best-sellers-section .add-to-cart-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const card = this.closest('.product-card');
      if (!card) return;
      
      const title = (card.querySelector('.fw-semibold')?.textContent
                  || card.querySelector('.product-name')?.textContent
                  || '').trim();
      const priceText = (card.querySelector('.price')?.textContent
                      || card.querySelector('.product-price')?.textContent
                      || '').trim();
      const price = parsePrice(priceText);
      const img = (card.querySelector('img')?.getAttribute('src')
                || card.querySelector('.product-image')?.getAttribute('src')
                || '');
      const slug = slugify(title);
      
      // Add to cart
      addItemToCart({ slug, title, price, priceText, img, qty: 1 });
      
      // Show toast notification
      showToast(title);
    });
  });

  // ===== Product Detail Modal (Home page) =====
  const modalEl = document.getElementById('productModal');
  const imgEl = document.getElementById('pmImg');
  const titleEl = document.getElementById('pmTitle');
  const categoryEl = document.getElementById('pmCategory');
  const priceEl = document.getElementById('pmPrice');
  const descEl = document.getElementById('pmDesc');
  const pmRatingEl = document.getElementById('pmRating');
  const addBtn = document.getElementById('pmAddToCart');
  let bsProductModal = null;
  if (modalEl && window.bootstrap?.Modal) {
    bsProductModal = new window.bootstrap.Modal(modalEl, { backdrop: true, keyboard: true });
  }

  // Ratings utilities
  const RATING_PREFIX = 'pt-rating:';
  const roundToHalf = (n) => Math.round(n * 2) / 2;
  function ratingKeyFor(card) {
    const title = (card.querySelector('.fw-semibold')?.textContent
                || card.querySelector('.product-name')?.textContent
                || '').trim();
    const img = card.querySelector('img') || card.querySelector('.product-image');
    const src = img?.getAttribute('src') || '';
    return (title || src).toLowerCase();
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

  function openProductModal(card) {
    if (!bsProductModal) return;
    const img = card.querySelector('img') || card.querySelector('.product-image');
    const src = img?.getAttribute('src') || '';
    const alt = img?.getAttribute('alt') || '';
    const title = (card.querySelector('.fw-semibold')?.textContent
                || card.querySelector('.product-name')?.textContent
                || alt || 'Product').trim();
    const category = (card.querySelector('p.text-muted')?.textContent
                   || card.querySelector('.product-category')?.textContent
                   || '').trim();
    const price = (card.querySelector('.price')?.textContent
                || card.querySelector('.product-price')?.textContent
                || '').trim();
    const desc = (card.getAttribute('data-description') || alt || `${title} — premium quality ${category.toLowerCase() || 'item'} for your pet.`).trim();
    const key = ratingKeyFor(card);
    const { rating, reviews } = getOrCreateRating(key);

    if (imgEl) { imgEl.src = src; imgEl.alt = alt || title; }
    if (titleEl) titleEl.textContent = title;
    if (categoryEl) categoryEl.textContent = category;
    if (priceEl) priceEl.textContent = price;
    if (descEl) descEl.textContent = desc;
    if (pmRatingEl) {
      pmRatingEl.innerHTML = `
        <span class="stars">${renderStars(rating)}</span>
        <span class="rating-score">${rating.toFixed(1)}</span>
        <span class="rating-reviews">(${reviews})</span>
      `;
      pmRatingEl.setAttribute('aria-label', `Rated ${rating.toFixed(1)} out of 5 with ${reviews} reviews`);
    }
    bsProductModal.show();
  }

  // Wire VIEW buttons to open modal (supports old and new classes)
  document.querySelectorAll('.best-sellers-section .btn-view, .best-sellers-section .view-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const card = this.closest('.product-card');
      if (card) openProductModal(card);
    });
  });

  // Modal Add to Cart
  addBtn?.addEventListener('click', () => {
    const title = titleEl?.textContent?.trim() || 'Item';
    const priceText = priceEl?.textContent?.trim() || '₱0.00';
    const price = parsePrice(priceText);
    const img = imgEl?.getAttribute('src') || '';
    const slug = slugify(title);
    addItemToCart({ slug, title, price, priceText, img, qty: 1 });
    showToast(title);
  });

  // ===== Responsive Best Sellers Carousel (mobile: 1 card per slide cycling all items) =====
  function debounce(fn, delay = 180) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }

  function rewireBestSellers() {
    // Re-bind Add to Cart
    document.querySelectorAll('.best-sellers-section .btn-add-cart, .best-sellers-section .add-to-cart-btn').forEach(button => {
      if (button.dataset.wired === '1') return;
      button.dataset.wired = '1';
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const card = this.closest('.product-card');
        if (!card) return;
        const title = (card.querySelector('.fw-semibold')?.textContent || card.querySelector('.product-name')?.textContent || '').trim();
        const priceText = (card.querySelector('.price')?.textContent || card.querySelector('.product-price')?.textContent || '').trim();
        const price = parsePrice(priceText);
        const img = (card.querySelector('img')?.getAttribute('src') || card.querySelector('.product-image')?.getAttribute('src') || '');
        const slug = slugify(title);
        addItemToCart({ slug, title, price, priceText, img, qty: 1 });
        showToast(title);
      });
    });
    // Re-bind VIEW
    document.querySelectorAll('.best-sellers-section .btn-view, .best-sellers-section .view-btn').forEach(button => {
      if (button.dataset.wired === '1') return;
      button.dataset.wired = '1';
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const card = this.closest('.product-card');
        if (card) openProductModal(card);
      });
    });
  }

  function setupBestSellersResponsiveCarousel() {
    const carousel = document.getElementById('bestSellersCarousel');
    if (!carousel) return;
    const inner = carousel.querySelector('.carousel-inner');
    if (!inner) return;

    const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
  if (isMobile && inner.dataset.mode !== 'mobile') {
      // Store original content once
      if (!inner.dataset.original) inner.dataset.original = inner.innerHTML;

      // Build single-card slides from all product cards across original slides
      const tmp = document.createElement('div');
      tmp.innerHTML = inner.dataset.original;
      const cards = Array.from(tmp.querySelectorAll('.product-card'));
      if (cards.length === 0) return;

      inner.innerHTML = '';
      cards.forEach((card, idx) => {
        const item = document.createElement('div');
        item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
        const row = document.createElement('div');
        row.className = 'row';
        const col = document.createElement('div');
        col.className = 'col-12 mb-4';
        col.appendChild(card);
        row.appendChild(col);
        item.appendChild(row);
        inner.appendChild(item);
      });
      inner.dataset.mode = 'mobile';
      // Ensure first slide is active and carousel is initialized
      const first = inner.querySelector('.carousel-item');
      if (first && !first.classList.contains('active')) first.classList.add('active');
      try {
        const inst = (window.bootstrap && window.bootstrap.Carousel)
          ? (window.bootstrap.Carousel.getInstance(carousel) || new window.bootstrap.Carousel(carousel, { interval: false }))
          : null;
        inst && inst.to(0);
      } catch (_) {}
      rewireBestSellers();
    } else if (!isMobile && inner.dataset.mode === 'mobile') {
      // Restore original multi-card slides
      inner.innerHTML = inner.dataset.original || inner.innerHTML;
      inner.dataset.mode = 'desktop';
      // Ensure an active slide exists and carousel is initialized
      const first = inner.querySelector('.carousel-item');
      if (first && !first.classList.contains('active')) first.classList.add('active');
      try {
        const inst = (window.bootstrap && window.bootstrap.Carousel)
          ? (window.bootstrap.Carousel.getInstance(carousel) || new window.bootstrap.Carousel(carousel, { interval: false }))
          : null;
        inst && inst.to(0);
      } catch (_) {}
      rewireBestSellers();
    }
  }

  // Initialize and keep in sync on resize
  setupBestSellersResponsiveCarousel();
  window.addEventListener('resize', debounce(setupBestSellersResponsiveCarousel, 200));
});









// ========= CONTACT PAGE FORM ================ //
    document.getElementById('helpForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      const consent = document.getElementById('consent').checked;
      
      if (name && email && message && consent) {
        document.getElementById('thankYouMessage').classList.remove('hidden');
        this.reset();
        
        setTimeout(() => {
          document.getElementById('thankYouMessage').classList.add('hidden');
        }, 5000);
      }
    });