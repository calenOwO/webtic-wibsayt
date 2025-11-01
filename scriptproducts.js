// PawTopia - scriptproducts.js (Products page: filters, sorting, pagination, modal, deep-links, ratings, and reviews)
// Lightweight toast utility available globally across pages that load this script
// Creates styles and container on first use, then shows a temporary message.
window.showToast = (message, opts = {}) => {
  try {
    const duration = typeof opts.duration === 'number' ? opts.duration : 2200;
    // Inject styles once
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        #toast-container{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2000;display:flex;flex-direction:column;gap:10px;pointer-events:none}
        .toast-message{min-width:200px;max-width:90vw;padding:10px 14px;border-radius:8px;background:#222;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.25);font-size:14px;opacity:0;transform:translateY(10px);transition:opacity .2s ease,transform .2s ease;pointer-events:auto}
        .toast-message.show{opacity:1;transform:translateY(0)}
      `;
      document.head.appendChild(style);
    }

    // Ensure container exists
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    // Use rAF to ensure transition applies
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto-remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  } catch (e) {
    // Fallback
    alert(message);
  }
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Pagination state
  // Items per page (configurable via UI selector)
  let PER_PAGE = 12;
  let currentPage = 1;

  // Shared search input in the header (used for live filtering and deep links)
  const headerSearchInput = document.getElementById('searchInput');

  const gridEl = document.querySelector('.row.g-3');
  const paginationEl = document.getElementById('pagination');

  // Smooth scroll helper to bring the products grid into view accounting for fixed header
  function scrollToProductsSection() {
    try {
      const section = document.getElementById('productsSection');
      if (!section) return;
      const header = document.querySelector('header');
      const offset = (header?.offsetHeight || 0) + 8; // small extra spacing
      const y = section.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } catch (_) {}
  }

  // ========= Cart utilities =========
  const CART_KEY = 'pt-cart:v1';
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (_) { return []; }
  }
  function saveCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('cartUpdated')); } catch (_) {}
  }
  function parsePrice(text) {
    const n = parseFloat(String(text).replace(/[^0-9.\-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  function addItemToCart(item) {
    const cart = loadCart();
    const idx = cart.findIndex(x => x.slug === item.slug);
    if (idx >= 0) cart[idx].qty += item.qty || 1; else cart.push({ ...item, qty: item.qty || 1 });
    saveCart(cart);
  }

  const getProductCols = () => Array.from(gridEl ? gridEl.children : [])
    .filter(col => col.querySelector('.product-card'));

  // Initialize filtered flag for all items
  getProductCols().forEach(col => { if (!col.dataset.filtered) col.dataset.filtered = '1'; });

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function computeFiltered() {
    const cols = getProductCols();
    const filtered = cols.filter(col => (col.dataset.filtered ?? '1') === '1');
    return { cols, filtered };
  }

  function renderPaginationControls(totalPages) {
    if (!paginationEl) return;
    // If 0 or 1 page, show nothing
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'pagination mb-0';

    // Prev
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">&laquo;</a>`;
    prevLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) { goToPage(currentPage - 1); }
    });
    ul.appendChild(prevLi);

    // Page numbers (simple full list; optimize if large)
    for (let p = 1; p <= totalPages; p++) {
      const li = document.createElement('li');
      li.className = `page-item ${p === currentPage ? 'active' : ''}`;
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'page-link';
      a.textContent = String(p);
      a.setAttribute('aria-label', `Page ${p}`);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(p);
      });
      li.appendChild(a);
      ul.appendChild(li);
    }

    // Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">&raquo;</a>`;
    nextLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) { goToPage(currentPage + 1); }
    });
    ul.appendChild(nextLi);

    paginationEl.innerHTML = '';
    paginationEl.appendChild(ul);
  }

  function applyPagination() {
    const { cols, filtered } = computeFiltered();
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
    currentPage = clamp(currentPage, 1, totalPages);

    // Hide all first
    cols.forEach(col => { col.style.display = 'none'; });

    // Show only the slice of filtered for current page
  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
    const pageItems = filtered.slice(start, end);
    pageItems.forEach(col => { col.style.display = ''; });

    renderPaginationControls(totalPages);
    updateShownCount(totalFiltered, start, Math.min(end, totalFiltered));
    updateEmptyState(totalFiltered);
  }

  // Animate page transitions when navigating via pagination controls
  function goToPage(p) {
    if (!gridEl) { currentPage = p; applyPagination(); return; }
    // Ensure base transition class present
    gridEl.classList.add('grid-fade');
    // Trigger fade-out
    gridEl.classList.add('fading');
    setTimeout(() => {
      currentPage = p;
      applyPagination();
      // Fade-in next frame to allow DOM updates to flush
      requestAnimationFrame(() => {
        gridEl.classList.remove('fading');
      });
    }, 180);
  }
  
  // Helpers for filtering
  function getCardMeta(card) {
    const typeText = (card.querySelector('p.text-muted')?.textContent || '').trim().toLowerCase();
    const title = (card.querySelector('.fw-semibold')?.textContent || '').trim().toLowerCase();
    const img = card.querySelector('img');
    const alt = (img?.getAttribute('alt') || '').trim().toLowerCase();
    const src = (img?.getAttribute('src') || '').trim().toLowerCase();
    const desc = (card.getAttribute('data-description') || '').trim().toLowerCase();
    const hay = `${title} ${alt} ${typeText} ${desc} ${src}`;
    const hasCat = /(\bcat\b|kitten|feline)/i.test(hay);
    const hasDog = /(\bdog\b|puppy|canine)/i.test(hay);
    const isFood = /\bfood\b/i.test(typeText);
    const isTreats = /treat/i.test(typeText);
    const isAccessories = /accessor/i.test(typeText);
    const isSupplies = /suppl(y|ies)/i.test(typeText);
    const isToys = /toy/i.test(typeText);
    const isSupplements = /supplement/i.test(typeText);
    const isDry = /\bdry\b/i.test(typeText) || /\bdry\b/i.test(hay);
    const isWet = /\bwet\b/i.test(typeText) || /\bwet\b/i.test(hay);
    return { typeText, title, alt, hasCat, hasDog, isFood, isTreats, isAccessories, isSupplies, isToys, isSupplements, isDry, isWet };
  }

  function idMatches(id, meta) {
    switch (id) {
      case 'treats':
      case 'snacks': // treat snacks as treats
        return meta.isTreats;
      case 'dentaltreats':
        return meta.isTreats && /(dental|denta)/i.test(`${meta.title} ${meta.alt}`);
      case 'trainingtreats':
        return meta.isTreats && /train/i.test(`${meta.title} ${meta.alt}`);
      case 'drycatfood':
        return meta.isFood && meta.isDry && meta.hasCat;
      case 'drydogfood':
        return meta.isFood && meta.isDry && meta.hasDog;
      case 'wetcatfood':
        return meta.isFood && meta.isWet && meta.hasCat;
      case 'wetdogfood':
        return meta.isFood && meta.isWet && meta.hasDog;
      case 'drycattreats':
        return meta.isTreats && meta.hasCat;
      case 'drydogtreats':
        return meta.isTreats && meta.hasDog;
      case 'allcatitems':
        return meta.hasCat;
      case 'alldogitems':
        return meta.hasDog;
      case 'supplements':
        return meta.isSupplements;
      case 'supplies':
        return meta.isSupplies;
      case 'accessories':
        return meta.isAccessories;
      case 'toys':
        return meta.isToys;
      default:
        // fallback: allow direct text containment e.g., "wet dog food" matches id words
        return meta.typeText.includes(id);
    }
  }

  // Filter products based on selected checkboxes
  function filterProducts() {
    const productCards = document.querySelectorAll('.product-card');

    // Get only Product Type checkboxes inside the Product Type section (collapse container present in HTML)
    const selectedTypes = Array.from(document.querySelectorAll('#productTypeCollapse input[type="checkbox"]:checked'))
      .map(checkbox => checkbox.id.toLowerCase());

    // Read price range
    const fromInput = document.getElementById('priceFrom');
    const toInput = document.getElementById('priceTo');
    const rawMin = fromInput && fromInput.value !== '' ? parseFloat(fromInput.value) : null;
    const rawMax = toInput && toInput.value !== '' ? parseFloat(toInput.value) : null;

    // Normalize min/max if user inverses them
    let min = rawMin, max = rawMax;
    if (min != null && max != null && min > max) {
      const t = min; min = max; max = t;
    }

    productCards.forEach(card => {
      const meta = getCardMeta(card);
      const priceText = card.querySelector('.price')?.textContent || '';
      const price = parseFloat(priceText.replace(/[^0-9.\-]+/g, '')) || 0;

      // If no filters selected, match all by type
      const matchesType = selectedTypes.length === 0 || selectedTypes.some(id => idMatches(id, meta));
      const matchesMin = min == null || price >= min;
      const matchesMax = max == null || price <= max;

      // Text query from header input
      const q = (headerSearchInput?.value || '').trim().toLowerCase();
      const matchesQuery = q === '' || [meta.title, meta.typeText, meta.alt, (card.getAttribute('data-description') || '').toLowerCase()]
        .some(text => text.includes(q));

      const visible = matchesType && matchesMin && matchesMax && matchesQuery;
      // Mark filtering result; pagination decides visibility
      card.parentElement.dataset.filtered = visible ? '1' : '0';

      // Highlight matches when searching
      highlightCard(card, q);
    });

    // Reset to first page on filter change
    currentPage = 1;
    applyPagination();
  }

  // ===== Search highlighting helpers =====
  function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function highlightCard(card, q) {
    const els = [card.querySelector('.fw-semibold'), card.querySelector('p.text-muted')].filter(Boolean);
    els.forEach(el => {
      if (!el.dataset.origHtml) el.dataset.origHtml = el.innerHTML;
      if (!q) { el.innerHTML = el.dataset.origHtml; return; }
      const rx = new RegExp(`(${escapeRegExp(q)})`, 'ig');
      el.innerHTML = el.dataset.origHtml.replace(rx, '<mark class="search-highlight">$1</mark>');
    });
  }

  function updateShownCount(totalFiltered, startIndex, endIndex) {
    const label = document.getElementById('showingLabel') || document.querySelector('.top-bar .small');
    // Total catalog size (all product cards)
    const total = getProductCols().length;
    const start = totalFiltered === 0 ? 0 : startIndex + 1;
    const end = endIndex;
    if (label) {
      // Render as: Showing <orange start> - <end> of <totalFiltered> products
      const first = `<span style=\"color:#FFAE34\">${start}</span>`;
      label.innerHTML = `Showing ${first} - ${end} of ${totalFiltered} products`;
    }
  }

  // ===== Empty state + Clear All =====
  function updateEmptyState(totalFiltered) {
    const grid = gridEl;
    if (!grid) return;
    let empty = document.getElementById('emptyState');
    if (!empty) {
      empty = document.createElement('div');
      empty.id = 'emptyState';
      empty.className = 'empty-state';
      const main = grid.parentElement;
      if (main) main.insertBefore(empty, grid);
    }
    const q = (headerSearchInput?.value || '').trim();
    const hasAnyFilters = Array.from(document.querySelectorAll('#productTypeCollapse input[type="checkbox"]:checked')).length > 0
      || (document.getElementById('priceFrom')?.value || '') !== ''
      || (document.getElementById('priceTo')?.value || '') !== ''
      || q !== '';
    if (totalFiltered === 0) {
      empty.style.display = '';
      const msg = q ? `No products match “${q}”.` : `No products match your filters.`;
      empty.innerHTML = `
        <div class="card shadow-sm p-4 mb-3">
          <div class="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
            <div class="flex-grow-1">${msg} <span class="text-muted">Try adjusting your search or clearing filters.</span></div>
            <div class="mt-2 mt-sm-0">
              <button id=\"clearAllFiltersBtn\" class=\"btn btn-sm btn-dark\">Clear all</button>
            </div>
          </div>
        </div>`;
      document.getElementById('clearAllFiltersBtn')?.addEventListener('click', clearAllFilters);
    } else {
      empty.style.display = 'none';
      if (!hasAnyFilters) empty.innerHTML = '';
    }
  }

  function clearAllFilters() {
    document.querySelectorAll('#productTypeCollapse input[type="checkbox"]:checked').forEach(cb => cb.checked = false);
    const pf = document.getElementById('priceFrom');
    const pt = document.getElementById('priceTo');
    if (pf) pf.value = '';
    if (pt) pt.value = '';
    if (headerSearchInput) headerSearchInput.value = '';
    filterProducts();
  }

  // Function to sort products
  function sortProducts(criteria) {
  const productGrid = document.querySelector('.row.g-3');
    if (!productGrid) return;

    // Only sort real product columns (exclude pagination/other elements)
    const productCols = Array.from(productGrid.children).filter(col => col.querySelector('.product-card .price'));

    // Tag original order once to support "Featured"
    productCols.forEach((col, idx) => {
      if (!col.dataset.origIndex) col.dataset.origIndex = String(idx);
    });

    const getPrice = (col) => {
      const txt = col.querySelector('.product-card .price')?.textContent || '';
      const n = parseFloat(txt.replace(/[^0-9.\-]+/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const compare = (a, b) => {
      if (criteria === 'low-to-high') return getPrice(a) - getPrice(b);
      if (criteria === 'high-to-low') return getPrice(b) - getPrice(a);
      // featured/original
      return Number(a.dataset.origIndex) - Number(b.dataset.origIndex);
    };

    const sorted = productCols.slice().sort(compare);

    // Re-append sorted product columns, while keeping any non-product elements in place
    const others = Array.from(productGrid.children).filter(col => !col.querySelector('.product-card .price'));
    productGrid.innerHTML = '';
    sorted.forEach(col => productGrid.appendChild(col));
    // Append others (e.g., pagination) back at the end to preserve visibility
    others.forEach(el => productGrid.appendChild(el));

    // After sorting, keep current page slice
    applyPagination();
  }

  // Event listeners for filters
  const filterCheckboxes = document.querySelectorAll('#productTypeCollapse input[type="checkbox"]');
  console.log('Found type checkboxes:', filterCheckboxes.length); // Debugging
  
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', filterProducts);
  });

  // Price inputs -> filter on change/input
  const priceFrom = document.getElementById('priceFrom');
  const priceTo = document.getElementById('priceTo');

  const debounce = (fn, delay = 200) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  };
  const debouncedFilter = debounce(filterProducts, 150);

  if (priceFrom) {
    priceFrom.addEventListener('input', debouncedFilter);
    priceFrom.addEventListener('change', filterProducts);
  }
  if (priceTo) {
    priceTo.addEventListener('input', debouncedFilter);
    priceTo.addEventListener('change', filterProducts);
  }

  // Event listener for sort dropdown
  const sortDropdownItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
  console.log('Found dropdown items:', sortDropdownItems.length); // Debugging
  
  sortDropdownItems.forEach(item => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      const text = event.target.textContent.toLowerCase();
      let criteria = 'featured';
      
      // Detect explicit phrases to avoid "high to low" matching 'low' first
      const normalized = text.replace(/\s+/g, ' ').trim();
      if (normalized.includes('high to low')) {
        criteria = 'high-to-low';
      } else if (normalized.includes('low to high')) {
        criteria = 'low-to-high';
      }
      
      sortProducts(criteria);
      
      // Update button text
      const button = document.querySelector('.dropdown-toggle');
      if (button) button.textContent = 'Sort by: ' + event.target.textContent;

      // Persist selection
      try { localStorage.setItem('productsSort', criteria); } catch (_) {}

      filterProducts();
    });
  });
  
  // Restore last sort selection on load
  try {
    const saved = localStorage.getItem('productsSort');
    if (saved) {
      sortProducts(saved);
      const button = document.querySelector('.dropdown-toggle');
      const match = Array.from(document.querySelectorAll('.dropdown-menu .dropdown-item'))
        .find(i => {
          const t = i.textContent.toLowerCase();
          if (saved === 'low-to-high') return t.includes('low');
          if (saved === 'high-to-low') return t.includes('high');
          return t.includes('featured');
        });
      if (button && match) button.textContent = 'Sort by: ' + match.textContent.trim();
    }
  } catch (_) {}
  
  // Per-page selector wiring
  try {
    const perPageSelect = document.getElementById('perPageSelect');
    const savedPerPage = parseInt(localStorage.getItem('productsPerPage') || '', 10);
    if (Number.isFinite(savedPerPage) && savedPerPage > 0) {
      PER_PAGE = savedPerPage;
      if (perPageSelect) perPageSelect.value = String(savedPerPage);
    }
    if (perPageSelect) {
      perPageSelect.addEventListener('change', () => {
        const n = parseInt(perPageSelect.value, 10);
        if (Number.isFinite(n) && n > 0) {
          PER_PAGE = n;
          try { localStorage.setItem('productsPerPage', String(n)); } catch (_) {}
          currentPage = 1;
          applyPagination();
        }
      });
    }
  } catch (_) {}

  // Initial apply to sync counts and pagination
  // Ensure dataset.filtered is set for all
  getProductCols().forEach(col => { if (!col.dataset.filtered) col.dataset.filtered = '1'; });
  // Prepare grid for transitions
  if (gridEl) gridEl.classList.add('grid-fade');
  applyPagination();

  // Wire live search input with debounce
  if (headerSearchInput) {
    const debounced = ((fn, delay = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; })(filterProducts);
    headerSearchInput.addEventListener('input', debounced);
    headerSearchInput.addEventListener('change', filterProducts);
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { headerSearchInput.value = ''; filterProducts(); }
    });
  }

  // Add-to-cart prompt wiring for Products page buttons
  const addButtons = document.querySelectorAll('.product-card .btn-add-cart');
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent card click from opening modal
      const card = e.currentTarget.closest('.product-card');
      if (!card) return;
      const title = card.querySelector('.fw-semibold')?.textContent?.trim() || 'Item';
      const priceText = card.querySelector('.price')?.textContent?.trim() || '₱0.00';
      const price = parsePrice(priceText);
      const img = card.querySelector('img')?.getAttribute('src') || '';
      // Slug may have been assigned already; compute if not
      const slug = card.dataset.slug || (typeof slugify === 'function' ? slugify(title) : title.toLowerCase().replace(/\s+/g,'-'));
      addItemToCart({ slug, title, price, priceText, img, qty: 1 });
      if (typeof window.showToast === 'function') window.showToast(`Added "${title}" to cart`);
    });
  });

  // Wire VIEW buttons to open the product modal
  const viewButtons = document.querySelectorAll('.product-card .btn-view');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = e.currentTarget.closest('.product-card');
      if (card) openProductModal(card);
    });
  });

  // NOTE: VIEW button injection was removed per request to undo recent changes

  // ========= Ratings utilities (used only in modal) =========
  const RATING_PREFIX = 'pt-rating:';

  function roundToHalf(n) { return Math.round(n * 2) / 2; }
  function ratingKeyFor(card) {
    const title = (card.querySelector('.fw-semibold')?.textContent || '').trim();
    const imgSrc = card.querySelector('img')?.getAttribute('src') || '';
    return (title || imgSrc).toLowerCase();
  }
  function getOrCreateRating(key) {
    try {
      const saved = localStorage.getItem(RATING_PREFIX + key);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    // Generate friendly randoms (3.5 - 5.0, step .5) and reviews (25 - 650)
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
  
  // ========= Product Detail Modal (Bootstrap) =========
  const modalEl = document.getElementById('productModal');
  const imgEl = document.getElementById('pmImg');
  const titleEl = document.getElementById('pmTitle');
  const categoryEl = document.getElementById('pmCategory');
  const priceEl = document.getElementById('pmPrice');
  const descEl = document.getElementById('pmDesc');
  const addBtn = document.getElementById('pmAddToCart');
  const pmRatingEl = document.getElementById('pmRating');
  let bsProductModal = null;
  if (modalEl && window.bootstrap?.Modal) {
    bsProductModal = new window.bootstrap.Modal(modalEl, { backdrop: true, keyboard: true });
  }

  function getText(el, selector) {
    return (el.querySelector(selector)?.textContent || '').trim();
  }

  function openProductModal(card) {
    if (!modalEl) return;
    const img = card.querySelector('img');
    const src = img?.getAttribute('src') || '';
    const alt = img?.getAttribute('alt') || '';
    const title = getText(card, '.fw-semibold') || alt || 'Product';
    const category = getText(card, 'p.text-muted');
    const price = getText(card, '.price');
    const desc = card.dataset.description || alt || `${title} — premium quality ${category.toLowerCase() || 'item'} for your pet.`;
    const key = ratingKeyFor(card);
    const { rating, reviews } = getOrCreateRating(key);

    // Populate
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
      pmRatingEl.setAttribute('aria-label', `Rated ${rating} out of 5 with ${reviews} reviews`);
    }

    // Show via Bootstrap
    if (bsProductModal) bsProductModal.show();
  }

  // Wire card clicks (excluding the Add to Cart button)
  const productCards = document.querySelectorAll('.product-card');
  // Assign URL-friendly slug per product for deep-linking
  function slugify(s) {
    return (s || '')
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  productCards.forEach(card => {
    const title = (card.querySelector('.fw-semibold')?.textContent || '').trim();
    if (title && !card.dataset.slug) card.dataset.slug = slugify(title);
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // don't open when clicking add-to-cart
      openProductModal(card);
    });
  });

  // Modal add-to-cart mirrors the card button toast
  addBtn?.addEventListener('click', () => {
    const title = titleEl?.textContent?.trim() || 'Item';
    const priceText = priceEl?.textContent?.trim() || '₱0.00';
    const price = parsePrice(priceText);
    const img = imgEl?.getAttribute('src') || '';
    const slug = (typeof slugify === 'function' ? slugify(title) : title.toLowerCase().replace(/\s+/g,'-'));
    addItemToCart({ slug, title, price, priceText, img, qty: 1 });
    if (typeof window.showToast === 'function') window.showToast(`Added "${title}" to cart`);
  });

  // Deep-link handling for ?product=slug, ?q=query, ?category=dog|cat and ?filter=<type>
  try {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    const slugParam = params.get('product');
    const categoryParam = (params.get('category') || '').trim().toLowerCase();
    const filterParam = (params.get('filter') || '').trim().toLowerCase();
    if (qParam && headerSearchInput) {
      headerSearchInput.value = qParam;
      filterProducts();
      // Auto-scroll to products list when arriving via search param
      scrollToProductsSection();
    }
    if (slugParam) {
      // Robust finder to handle slight title/alt differences and token overlaps
      const findBySlug = (slug) => {
        const s = String(slug || '').trim().toLowerCase();
        const cards = Array.from(productCards);
        const norm = (x) => (typeof slugify === 'function' ? slugify(String(x||'')) : String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''));
        const toks = (x) => norm(x).split('-').filter(t => t.length > 1);
        const score = (a, b) => {
          const A = new Set(toks(a));
          const B = new Set(toks(b));
          let overlap = 0; A.forEach(t => { if (B.has(t)) overlap++; });
          return overlap;
        };

        // 1) Exact dataset.slug
        let m = cards.find(c => (c.dataset.slug || '').toLowerCase() === s);
        if (m) return m;
        // 2) Exact alt-derived or title-derived slug
        m = cards.find(c => norm(c.querySelector('img')?.getAttribute('alt')) === s
          || norm(c.querySelector('.fw-semibold')?.textContent) === s);
        if (m) return m;
        // 3) Prefix/contains against dataset.slug or title slug
        m = cards.find(c => {
          const ds = (c.dataset.slug || '').toLowerCase();
          const ts = norm(c.querySelector('.fw-semibold')?.textContent);
          return ds.startsWith(s) || s.startsWith(ds) || ds.includes(s) || s.includes(ds)
              || ts.startsWith(s) || s.startsWith(ts) || ts.includes(s) || s.includes(ts);
        });
        if (m) return m;
        // 4) Token overlap best-match fallback
        let best = null, bestScore = 0;
        cards.forEach(c => {
          const candidates = [c.dataset.slug || '', c.querySelector('img')?.getAttribute('alt') || '', c.querySelector('.fw-semibold')?.textContent || ''];
          const sc = Math.max(...candidates.map(t => score(t, s)));
          if (sc > bestScore) { bestScore = sc; best = c; }
        });
        return bestScore >= 2 ? best : null; // require at least 2 overlapping tokens
      };

      const match = findBySlug(slugParam);
      // Scroll into view of products section regardless, so POV feels right
      scrollToProductsSection();
      if (match) openProductModal(match);
    }

    // Handle category deep-link: category=dog | category=cat
    if (categoryParam) {
      // Normalize common variants
      const isDog = /^(dog|dogs|canine|puppy|puppies)$/.test(categoryParam);
      const isCat = /^(cat|cats|feline|kitten|kittens)$/.test(categoryParam);
      if (isDog || isCat) {
        // Uncheck all Product Type filters first
        document.querySelectorAll('#productTypeCollapse input[type="checkbox"]:checked')
          .forEach(cb => { cb.checked = false; });
        // Check the appropriate master filter
        const dogCb = document.getElementById('allDogItems');
        const catCb = document.getElementById('allCatItems');
        if (isDog && dogCb) dogCb.checked = true;
        if (isCat && catCb) catCb.checked = true;
        // Optionally expand the Product Type section so users see the selection
        const collapse = document.getElementById('productTypeCollapse');
        if (collapse && !collapse.classList.contains('show')) {
          collapse.classList.add('show');
        }
        // Apply filters
        filterProducts();
        // Auto-scroll to products list for category deep-link
        scrollToProductsSection();
      }
    }

    // Handle filter deep-link: filter=drydogfood|drycatfood|supplies|supplements|toys|... (maps to checkbox ids)
    if (filterParam) {
      const mapId = {
        'drydogfood': 'dryDogFood',
        'drycatfood': 'dryCatFood',
        'wetdogfood': 'wetDogFood',
        'wetcatfood': 'wetCatFood',
        'supplies': 'supplies',
        'supplements': 'supplements',
        'toys': 'toys',
        'treats': 'treats',
        'drycattreats': 'dryCatTreats',
        'drydogtreats': 'dryDogTreats',
        'accessories': 'accessories',
        'dentaltreats': 'dentalTreats',
        'trainingtreats': 'trainingTreats',
        'alldogitems': 'allDogItems',
        'allcatitems': 'allCatItems'
      };
      const checkboxId = mapId[filterParam];
      if (checkboxId) {
        // Uncheck all, then check the mapped one
        document.querySelectorAll('#productTypeCollapse input[type="checkbox"]:checked')
          .forEach(cb => { cb.checked = false; });
        const cb = document.getElementById(checkboxId);
        if (cb) cb.checked = true;
        const collapse = document.getElementById('productTypeCollapse');
        if (collapse && !collapse.classList.contains('show')) {
          collapse.classList.add('show');
        }
        filterProducts();
        scrollToProductsSection();
      }
    }
  } catch (_) {}

  // If user starts typing in the header search on the Products page, scroll to the grid once
  try {
    let didAutoScrollForSearch = false;
    if (headerSearchInput) {
      headerSearchInput.addEventListener('input', () => {
        if (!didAutoScrollForSearch) {
          didAutoScrollForSearch = true;
          scrollToProductsSection();
        }
      });
    }
  } catch (_) {}

  // Listen for cross-page suggestion requests
  document.addEventListener('openProductBySlug', (e) => {
    const slug = e?.detail?.slug;
    if (!slug) return;
    // Try robust matching similar to deep-link handling, with token overlap fallback
    const findBySlug = (s) => {
      const target = String(s || '').trim().toLowerCase();
      const cards = Array.from(productCards);
      const norm = (x) => (typeof slugify === 'function' ? slugify(String(x||'')) : String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''));
      const toks = (x) => norm(x).split('-').filter(t => t.length > 1);
      const score = (a, b) => {
        const A = new Set(toks(a));
        const B = new Set(toks(b));
        let overlap = 0; A.forEach(t => { if (B.has(t)) overlap++; });
        return overlap;
      };
      let m = cards.find(c => (c.dataset.slug || '').toLowerCase() === target);
      if (m) return m;
      m = cards.find(c => norm(c.querySelector('img')?.getAttribute('alt')) === target
        || norm(c.querySelector('.fw-semibold')?.textContent) === target);
      if (m) return m;
      m = cards.find(c => {
        const ds = (c.dataset.slug || '').toLowerCase();
        const ts = norm(c.querySelector('.fw-semibold')?.textContent);
        return ds.startsWith(target) || target.startsWith(ds) || ds.includes(target) || target.includes(ds)
            || ts.startsWith(target) || target.startsWith(ts) || ts.includes(target) || target.includes(ts);
      });
      if (m) return m;
      let best = null, bestScore = 0;
      cards.forEach(c => {
        const candidates = [c.dataset.slug || '', c.querySelector('img')?.getAttribute('alt') || '', c.querySelector('.fw-semibold')?.textContent || ''];
        const sc = Math.max(...candidates.map(t => score(t, target)));
        if (sc > bestScore) { bestScore = sc; best = c; }
      });
      return bestScore >= 2 ? best : null;
    };
    const match = findBySlug(slug);
    if (match) {
      // Ensure filters don't hide the product
      if (headerSearchInput) headerSearchInput.value = '';
      document.querySelectorAll('#productTypeCollapse input[type="checkbox"]:checked').forEach(cb => cb.checked = false);
      const pf = document.getElementById('priceFrom'); if (pf) pf.value = '';
      const pt = document.getElementById('priceTo'); if (pt) pt.value = '';
      filterProducts();
      // Scroll products into view to give context, then open modal
      scrollToProductsSection();
      openProductModal(match);
    }
  });

  // ========= Random Reviews Section (Carousel - 6 per slide, max 24 total, 4s interval) =========
  (function buildRandomReviews() {
    const inner = document.getElementById('reviewsCarouselInner');
    if (!inner) return;

    const REVIEWS_PER_SLIDE = 6;
    const MAX_REVIEWS = 24;

    const productCards = Array.from(document.querySelectorAll('.product-card'));
    if (productCards.length === 0) return;

    // Sample user names
    const users = [
      'Alex M.', 'Jamie S.', 'Renee T.', 'Chris D.', 'Sam P.', 'Jordan K.',
      'Taylor R.', 'Morgan L.', 'Casey H.', 'Avery B.', 'Pat G.', 'Drew C.'
    ];
    // Category-tailored comment pools
    const commentPools = {
      catFood: [
        'My cat finishes every bowl now. No tummy issues.',
        'Great ingredients—my cat’s coat looks shinier.',
        'Perfect kibble size and no more picky eating.',
        'Smells fresh and my cat actually asks for meals.',
        'Helped with hairballs and digestion for my cat.'
      ],
      dogFood: [
        'My dog’s coat looks healthier after switching to this.',
        'Great energy levels and firm stools—awesome food.',
        'Picky eater approved. Bowl is licked clean.',
        'Nice kibble size and zero upset tummy.',
        'High-quality protein—my dog loves the taste.'
      ],
      treatsCat: [
        'Perfect bite-sized rewards for my cat.',
        'My cat goes crazy for these—great for bonding.',
        'Soft enough for my senior cat to enjoy.',
        'Nice crunch and no strong smell—cat-approved.',
        'Works great as a topper to entice eating.'
      ],
      treatsDog: [
        'Great for training sessions—easy to break apart.',
        'My dog loves the flavor and waggs non-stop.',
        'Soft texture and no crumbs in my pocket.',
        'Perfect size treats for daily rewards.',
        'No stomach issues—even with sensitive pups.'
      ],
      dentalTreats: [
        'Noticeably fresher breath after a week.',
        'Tartar build-up reduced—my vet noticed!',
        'Chewy but lasts long enough to clean teeth.',
        'My dog actually enjoys dental time now.',
        'Great texture and easy on the gums.'
      ],
      supplementsCat: [
        'Helped with my cat’s sensitive tummy.',
        'We saw better appetite and digestion.',
        'Easy to mix and my cat didn’t mind the taste.',
        'Eyes watering less—seems to help a lot.',
        'Great daily support—noticed gradual improvements.'
      ],
      supplementsDog: [
        'My dog’s digestion improved within a week.',
        'Firmed up stools and better overall mood.',
        'Easy to give and no refusals from my pup.',
        'Joints seem happier after consistent use.',
        'Great quality—recommended by our vet.'
      ],
      toys: [
        'Durable and keeps my pet busy for ages.',
        'Still in one piece after lots of play—impressed.',
        'Perfect size and squeak. Instant favorite.',
        'Great enrichment—my pet loves chasing it.',
        'Soft but tough—good for indoor play.'
      ],
      accessories: [
        'Fits comfortably—no rubbing or slipping.',
        'Easy to put on and adjust—secure feel.',
        'Looks stylish and seems well made.',
        'Lightweight but sturdy hardware—nice quality.',
        'My walks feel safer with this harness.'
      ],
      supplies: [
        'Comfy and cozy—my pet naps in it all day.',
        'Washable and holds shape after cleaning.',
        'Well stitched and supportive bolsters.',
        'Nice neutral look that fits our home.',
        'Great value for the build quality.'
      ],
      generic: [
        'Exactly as described and great quality for the price.',
        'Arrived quickly and works as expected.',
        'Solid build and my pet approves.',
        'Would definitely purchase again.',
        'Five stars—highly recommend.'
      ]
    };

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function poolFor(meta) {
      // Decide the most appropriate pool based on meta flags
      const hay = `${meta.title} ${meta.alt}`;
      const isDental = /(dental|denta|dentastix)/i.test(hay) || (meta.isTreats && /(dental|denta)/i.test(meta.typeText));
      if (meta.isFood) {
        if (meta.hasCat) return commentPools.catFood;
        if (meta.hasDog) return commentPools.dogFood;
      }
      if (meta.isTreats) {
        if (isDental) return commentPools.dentalTreats;
        if (meta.hasCat) return commentPools.treatsCat;
        if (meta.hasDog) return commentPools.treatsDog;
      }
      if (meta.isSupplements) {
        if (meta.hasCat) return commentPools.supplementsCat;
        if (meta.hasDog) return commentPools.supplementsDog;
        return commentPools.generic;
      }
      if (meta.isToys) return commentPools.toys;
      if (meta.isAccessories) return commentPools.accessories;
      if (meta.isSupplies) return commentPools.supplies;
      return commentPools.generic;
    }

    // Build one review per product with a tailored comment and a persisted rating
    const reviews = productCards.map(card => {
      const meta = getCardMeta(card);
      const title = (card.querySelector('.fw-semibold')?.textContent || '').trim();
      const category = (card.querySelector('.text-muted')?.textContent || '').trim();
      const price = (card.querySelector('.price')?.textContent || '').trim();
      const img = card.querySelector('img')?.getAttribute('src') || '';
      const pool = poolFor(meta);
      const comment = pick(pool);
      // Ratings: reuse the same localStorage-backed generator used in modal
      let rating = 5, reviewsCount = 100;
      try {
        const key = ratingKeyFor(card);
        const r = getOrCreateRating(key);
        rating = r.rating;
        reviewsCount = r.reviews;
      } catch (_) {}
      return { title, category, price, img, comment, user: pick(users), rating, reviewsCount };
    });

    function chunk(arr, size) {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    }

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    const limited = reviews.length > MAX_REVIEWS ? shuffle(reviews.slice()).slice(0, MAX_REVIEWS) : reviews;
    const groups = chunk(limited, REVIEWS_PER_SLIDE);
    inner.innerHTML = '';

    groups.forEach((group, idx) => {
      const item = document.createElement('div');
      item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
      const row = document.createElement('div');
      row.className = 'row g-3';

      group.forEach(prod => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm';

        const body = document.createElement('div');
        body.className = 'card-body';

        // Header row: product thumbnail + title
        const header = document.createElement('div');
        header.className = 'd-flex align-items-center gap-3 mb-2';
        header.innerHTML = `
          <img src="${prod.img}" alt="${prod.title}" class="review-product-img">
          <div>
            <div class="fw-semibold">${prod.title}</div>
            <div class="review-meta">${prod.category} • <span class="text-orange">${prod.price}</span></div>
          </div>
        `;

        // Rating row
        const ratingWrap = document.createElement('div');
        ratingWrap.className = 'product-rating';
        ratingWrap.setAttribute('aria-label', `Rated ${prod.rating?.toFixed?.(1) || '5.0'} out of 5`);
        const starsHtml = typeof prod.rating === 'number' ? renderStars(prod.rating) : renderStars(5);
        ratingWrap.innerHTML = `
          <span class="stars">${starsHtml}</span>
          <span class="rating-score">${(prod.rating ?? 5).toFixed(1)}</span>
          <span class="rating-reviews">(${prod.reviewsCount ?? 100})</span>
        `;

        // Review text
        const reviewText = document.createElement('p');
        reviewText.className = 'review-text mb-2';
        reviewText.textContent = prod.comment;

        // User + meta line
        const userLine = document.createElement('div');
        userLine.className = 'd-flex align-items-center gap-2';
        userLine.innerHTML = `
          <span class="badge bg-dark">Verified Purchase</span>
          <span class="review-user">${prod.user}</span>
        `;

  body.appendChild(header);
  body.appendChild(ratingWrap);
        body.appendChild(reviewText);
        body.appendChild(userLine);
        card.appendChild(body);
        col.appendChild(card);
        row.appendChild(col);
      });

      item.appendChild(row);
      inner.appendChild(item);
    });
  })();
  
  
});