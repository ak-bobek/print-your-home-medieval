
/* Vektor3D – простая витрина 3D‑моделей. */
const CONFIG = window.__SHOP_CONFIG__ || { siteName: 'Vektor3D', currency: 'USD', locale: 'ru-RU', salesEmail: 'sales@yourdomain.tld' };

const state = {
  products: [],
  filtered: [],
  cart: loadCart(),
  filters: {
    query: '',
    category: 'Все',
    formats: new Set(),
    priceMax: Infinity,
    polyBand: 'any'
  }
};

const els = {
  search: document.getElementById('searchInput'),
  priceRange: document.getElementById('priceRange'),
  priceLabel: document.getElementById('priceLabel'),
  categoryChips: document.getElementById('categoryChips'),
  formatCheckboxes: document.getElementById('formatCheckboxes'),
  polyFilter: document.getElementById('polyFilter'),
  grid: document.getElementById('productGrid'),
  empty: document.getElementById('emptyState'),
  cart: document.getElementById('cartDrawer'),
  cartBackdrop: document.getElementById('cartBackdrop'),
  cartCount: document.getElementById('cartCount'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  themeToggle: document.getElementById('themeToggle'),
  tagline: document.getElementById('tagline')
};

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

function loadCart(){
  try { return JSON.parse(localStorage.getItem('vektor3d_cart')) || { items: {} }; } catch (e){ return { items: {} }; }
}
function saveCart(){ localStorage.setItem('vektor3d_cart', JSON.stringify(state.cart)); updateCartCount(); renderCart(); }
function addToCart(id){ state.cart.items[id] = (state.cart.items[id] || 0) + 1; saveCart(); openCart(); }
function removeFromCart(id){ delete state.cart.items[id]; saveCart(); }
function setQty(id, qty){ if(qty<=0){ removeFromCart(id); } else { state.cart.items[id] = qty; saveCart(); } }
function updateCartCount(){ const c = Object.values(state.cart.items).reduce((a,b)=>a+b,0); els.cartCount.textContent = c; }

function formatCurrency(n){ try { return new Intl.NumberFormat(CONFIG.locale || 'ru-RU', { style:'currency', currency: CONFIG.currency || 'USD', maximumFractionDigits:2 }).format(n); } catch(e){ return '$'+(Math.round(n*100)/100).toFixed(2); } }

async function loadProducts(){
  try{
    const res = await fetch('products.json', { cache:'no-store' });
    if(!res.ok) throw new Error('Failed to fetch');
    state.products = await res.json();
  }catch(e){
    // fallback: inline JSON
    const el = document.getElementById('inlineProducts');
    if(el && el.textContent.trim().length){
      try{ state.products = JSON.parse(el.textContent); }
      catch(e2){ console.error('Cannot parse inline products', e2); state.products = []; }
    }else{
      state.products = [];
    }
  }
  // Price slider setup
  const maxPrice = Math.max(10, Math.ceil(Math.max(...state.products.map(p=>p.price))));
  els.priceRange.max = String(maxPrice);
  els.priceRange.value = String(maxPrice);
  state.filters.priceMax = maxPrice;
  els.priceLabel.textContent = 'до ' + formatCurrency(maxPrice);

  renderCategoryChips();
  renderFormatCheckboxes();
  render();
  updateCartCount();
  applyStoredTheme();
  if(CONFIG.tagline) els.tagline.textContent = CONFIG.tagline;
}

function renderCategoryChips(){
  const cats = Array.from(new Set(state.products.map(p=>p.category))).sort();
  cats.unshift('Все');
  els.categoryChips.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (state.filters.category===cat ? ' chip--active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => { state.filters.category = cat; render(); });
    els.categoryChips.appendChild(btn);
  });
}

function renderFormatCheckboxes(){
  const formats = Array.from(new Set(state.products.flatMap(p=>p.formats))).sort();
  els.formatCheckboxes.innerHTML = '';
  formats.forEach(fmt => {
    const label = document.createElement('label');
    label.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.value = fmt;
    input.addEventListener('change', (e)=>{
      if(e.target.checked) state.filters.formats.add(fmt);
      else state.filters.formats.delete(fmt);
      render();
    });
    const span = document.createElement('span'); span.textContent = fmt;
    label.append(input, span);
    els.formatCheckboxes.appendChild(label);
  });
}

function filterProducts(){
  const q = (state.filters.query || '').toLowerCase().trim();
  const tokens = q ? q.split(/[,\s]+/).filter(Boolean) : [];
  state.filtered = state.products.filter(p=>{
    if(state.filters.category && state.filters.category !== 'Все' && p.category !== state.filters.category) return false;
    if(state.filters.formats.size > 0){
      const selected = Array.from(state.filters.formats);
      // require ALL selected formats to be present
      if(!selected.every(fmt => p.formats.includes(fmt))) return false;
    }
    if(p.price > state.filters.priceMax + 1e-9) return false;
    const poly = p.polycount || 0;
    switch(state.filters.polyBand){
      case 'lt1k': if(!(poly < 1000)) return false; break;
      case '1k-10k': if(!(poly >=1000 && poly <=10000)) return false; break;
      case '10k-50k': if(!(poly >10000 && poly <=50000)) return false; break;
      case 'gt50k': if(!(poly > 50000)) return false; break;
    }
    if(tokens.length){
      const hay = (p.name + ' ' + (p.description||'') + ' ' + p.tags.join(' ') + ' ' + p.category + ' ' + p.formats.join(' ')).toLowerCase();
      const all = tokens.every(t => hay.includes(t));
      if(!all) return false;
    }
    return true;
  });
}

function renderProducts(){
  const grid = els.grid;
  grid.innerHTML = '';
  if(!state.filtered.length){
    els.empty.classList.remove('hidden');
    return;
  } else {
    els.empty.classList.add('hidden');
  }

  const frag = document.createDocumentFragment();
  state.filtered.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card__media">
        <img src="${p.cover}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='assets/placeholder.svg'"/>
        ${p.rigged ? '<span class="badge" title="Есть риг">Rigged</span>' : ''}
        ${p.animated ? '<span class="badge" style="right:10px; left:auto;" title="Есть анимация">Animated</span>' : ''}
      </div>
      <div class="card__body">
        <h3 class="card__title" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
        <div class="card__meta"><span>${(p.polycount||0).toLocaleString('ru-RU')} tris</span><span>•</span><span>${p.formats.join(', ')}</span></div>
        <div class="card__tags">${p.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
      <div class="card__foot">
        <div class="price">${formatCurrency(p.price)}</div>
        <div class="buttons">
          <button class="btn btn--ghost buyNow" ${p.paymentLink ? '' : 'disabled'}>Купить сейчас</button>
          <button class="btn addToCart">В корзину</button>
        </div>
      </div>
    `;
    card.querySelector('.addToCart').addEventListener('click', () => addToCart(p.id));
    const buyBtn = card.querySelector('.buyNow');
    buyBtn.addEventListener('click', () => {
      if(p.paymentLink) window.open(p.paymentLink, '_blank');
      else alert('Добавьте ссылку оплаты (paymentLink) в products.json для мгновенной покупки.');
    });
    frag.appendChild(card);
  });
  grid.appendChild(frag);
  injectStructuredData(state.filtered);
}

function injectStructuredData(products){
  // Remove previous scripts
  [...document.querySelectorAll('script[data-sd="1"]')].forEach(s=>s.remove());
  products.slice(0, 24).forEach(p => {
    const sd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.name,
      "image": [location.origin + '/' + p.cover],
      "description": p.description || "",
      "sku": p.id,
      "brand": { "@type": "Brand", "name": CONFIG.siteName || "Vektor3D" },
      "offers": {
        "@type": "Offer",
        "priceCurrency": CONFIG.currency || "USD",
        "price": p.price,
        "availability": "https://schema.org/InStock",
        "url": location.href.split('#')[0]
      }
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.sd = "1";
    s.textContent = JSON.stringify(sd);
    document.head.appendChild(s);
  });
}

function render(){
  filterProducts();
  renderProducts();
}

function openCart(){ els.cart.classList.add('open'); document.getElementById('cartBackdrop').style.display = 'block'; els.cart.setAttribute('aria-hidden','false'); renderCart(); }
function closeCart(){ els.cart.classList.remove('open'); document.getElementById('cartBackdrop').style.display = 'none'; els.cart.setAttribute('aria-hidden','true'); }

function cartTotal(){
  return Object.entries(state.cart.items).reduce((sum, [id, qty]) => {
    const p = state.products.find(x => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}

function renderCart(){
  els.cartItems.innerHTML = '';
  const frag = document.createDocumentFragment();
  const ids = Object.keys(state.cart.items);
  if(!ids.length){
    els.cartItems.innerHTML = '<p style="color:var(--muted);padding:16px 0;">Корзина пуста.</p>';
  } else {
    ids.forEach(id => {
      const p = state.products.find(x => x.id===id);
      if(!p) return;
      const qty = state.cart.items[id];
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <img src="${p.cover}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='assets/placeholder.svg'"/>
        <div>
          <h4>${escapeHtml(p.name)}</h4>
          <div class="meta">${p.formats.join(', ')} • ${(p.polycount||0).toLocaleString('ru-RU')} tris</div>
          <div class="qty" style="margin-top:6px;">
            <label>Кол-во:</label>
            <input type="number" min="1" value="${qty}" aria-label="Количество для ${escapeHtml(p.name)}"/>
            <button class="btn btn--ghost removeBtn" title="Удалить" style="margin-left:6px;">Удалить</button>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800;">${formatCurrency(p.price * qty)}</div>
        </div>
      `;
      row.querySelector('input').addEventListener('change', (e)=> setQty(id, Math.max(1, Number(e.target.value)||1)));
      row.querySelector('.removeBtn').addEventListener('click', ()=> removeFromCart(id));
      frag.appendChild(row);
    });
  }
  els.cartItems.appendChild(frag);
  els.cartTotal.textContent = formatCurrency(cartTotal());
}

function mailtoCheckout(){
  const ids = Object.keys(state.cart.items);
  if(!ids.length){ alert('Корзина пуста'); return; }
  const customer = prompt('Укажите e‑mail для счёта (и при необходимости имя/компанию):', '');
  const lines = ids.map((id, i)=>{
    const p = state.products.find(x => x.id===id);
    const qty = state.cart.items[id];
    return `${i+1}. ${p.name} × ${qty} = ${formatCurrency(p.price*qty)} (${p.formats.join(', ')}, ${p.polycount} tris, id:${p.id})`;
  });
  const subject = encodeURIComponent(`Заказ ${CONFIG.siteName || 'Vektor3D'} — ${Date.now().toString().slice(-6)}`);
  const body = encodeURIComponent(
`Здравствуйте!

Хочу оформить заказ на следующие позиции:

${lines.join('\n')}

Итого: ${formatCurrency(cartTotal())}
Покупатель: ${customer||'(не указан)'}

Пожалуйста, вышлите счёт и ссылку для оплаты.
Спасибо!`
  );
  const to = encodeURIComponent(CONFIG.salesEmail || 'sales@yourdomain.tld');
  location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

// UI events
document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
document.getElementById('cartBackdrop').addEventListener('click', closeCart);
els.checkoutBtn.addEventListener('click', mailtoCheckout);

let searchDebounce;
els.search.addEventListener('input', (e)=>{
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(()=>{
    state.filters.query = e.target.value;
    render();
  }, 150);
});

els.priceRange.addEventListener('input', (e)=>{
  state.filters.priceMax = Number(e.target.value);
  els.priceLabel.textContent = 'до ' + formatCurrency(state.filters.priceMax);
  render();
});

els.polyFilter.addEventListener('change', (e)=>{
  state.filters.polyBand = e.target.value;
  render();
});

// Theme
function applyStoredTheme(){
  const stored = localStorage.getItem('theme') || (CONFIG.theme && CONFIG.theme.enableDarkMode ? 'dark' : 'light');
  document.body.classList.toggle('light', stored === 'light');
}
function toggleTheme(){
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Init
document.addEventListener('DOMContentLoaded', loadProducts);
