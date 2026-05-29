// ═══════════════════════════════════════════════════════════════════
//  i18n — Arabic / French / English
// ═══════════════════════════════════════════════════════════════════
const TRANSLATIONS = {
  en: {
    nav_gallery:'Gallery', nav_reviews:'Reviews',
    hero_badge:'BEAUTIFUL INVITATIONS',
    hero_title:'Find Your Perfect Invitation',
    hero_subtitle:'Browse our collection of stunning wedding invitation templates.',
    search_placeholder:'Search invitations by name or style...',
    filter_all:'All',
    gallery_title:'All Templates',
    reviews_title:'⭐ Client Reviews', reviews_sub:'What our happy couples say',
    leave_review:'✍️ Leave a Review',
    modal_title:'Customize Your Invitation',
    form_template:'Template', form_first:'First Name', form_last:'Last Name',
    form_phone:'Phone Number', form_date:'Wedding Date', form_notes:'Special Instructions (Optional)',
    form_submit:'Submit Request',
    review_modal_title:'Leave a Review', review_name:'Your Name',
    review_template:'Template Used (Optional)', review_rating:'Rating',
    review_comment:'Comment', review_submit:'Submit Review',
    success_title:'Request Submitted!', success_msg:"Thank you! We'll contact you soon.",
    close:'Close',
  },
  fr: {
    nav_gallery:'Galerie', nav_reviews:'Avis',
    hero_badge:'BELLES INVITATIONS',
    hero_title:'Trouvez votre Invitation Parfaite',
    hero_subtitle:'Parcourez notre collection de magnifiques modèles d\'invitations de mariage.',
    search_placeholder:'Rechercher par nom ou style...',
    filter_all:'Tous',
    gallery_title:'Tous les Modèles',
    reviews_title:'⭐ Avis Clients', reviews_sub:'Ce que disent nos couples',
    leave_review:'✍️ Laisser un Avis',
    modal_title:'Personnalisez Votre Invitation',
    form_template:'Modèle', form_first:'Prénom', form_last:'Nom',
    form_phone:'Numéro de Téléphone', form_date:'Date du Mariage', form_notes:'Instructions Spéciales (Optionnel)',
    form_submit:'Soumettre la Demande',
    review_modal_title:'Laisser un Avis', review_name:'Votre Nom',
    review_template:'Modèle Utilisé (Optionnel)', review_rating:'Note',
    review_comment:'Commentaire', review_submit:'Soumettre',
    success_title:'Demande Soumise !', success_msg:'Merci ! Nous vous contacterons bientôt.',
    close:'Fermer',
  },
  ar: {
    nav_gallery:'المعرض', nav_reviews:'التقييمات',
    hero_badge:'دعوات رائعة',
    hero_title:'اعثر على دعوتك المثالية',
    hero_subtitle:'تصفح مجموعتنا من قوالب دعوات الزفاف الرائعة.',
    search_placeholder:'ابحث بالاسم أو النمط...',
    filter_all:'الكل',
    gallery_title:'جميع القوالب',
    reviews_title:'⭐ آراء العملاء', reviews_sub:'ما يقوله أزواجنا السعداء',
    leave_review:'✍️ اترك تقييماً',
    modal_title:'خصص دعوتك',
    form_template:'القالب', form_first:'الاسم الأول', form_last:'اللقب',
    form_phone:'رقم الهاتف', form_date:'تاريخ الزفاف', form_notes:'تعليمات خاصة (اختياري)',
    form_submit:'إرسال الطلب',
    review_modal_title:'اترك تقييماً', review_name:'اسمك',
    review_template:'القالب المستخدم (اختياري)', review_rating:'التقييم',
    review_comment:'تعليق', review_submit:'إرسال التقييم',
    success_title:'تم إرسال الطلب!', success_msg:'شكراً! سنتصل بك قريباً.',
    close:'إغلاق',
  }
};

let currentLang = 'en';
function setLang(lang) {
  currentLang = lang;
  const t = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key]) el.placeholder = t[key];
  });
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// ═══════════════════════════════════════════════════════════════════
//  State
// ═══════════════════════════════════════════════════════════════════
let allInvitations     = [];
let adminKey           = null;
let allRequests        = [];
let currentPackage     = 'all';
let currentStatus      = 'all';
let selectedRating     = 0;
let sortPopular        = false;
let favorites          = JSON.parse(localStorage.getItem('weddingFavorites') || '[]');
let lightboxIndex      = 0;
let lightboxList       = [];
let selectedRequestIds = new Set();
let calYear, calMonth;
let lastTrackingCode   = '';
let deferredPwaPrompt  = null;
let confirmResolve     = null; // for custom confirm dialog

// ═══════════════════════════════════════════════════════════════════
//  Admin API helper — sends key in header, never in URL
// ═══════════════════════════════════════════════════════════════════
function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'x-admin-key': adminKey,
      ...(options.headers || {})
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Custom confirm dialog (replaces window.confirm())
// ═══════════════════════════════════════════════════════════════════
function showConfirm(title, msg, icon = '⚠️', okLabel = 'Confirm') {
  return new Promise(resolve => {
    confirmResolve = resolve;
    document.getElementById('confirmIcon').textContent  = icon;
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent   = msg;
    document.getElementById('confirmOkBtn').textContent = okLabel;
    document.getElementById('confirmDialog').classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

function resolveConfirm(result) {
  document.getElementById('confirmDialog').classList.remove('active');
  document.body.style.overflow = '';
  if (confirmResolve) { confirmResolve(result); confirmResolve = null; }
}

// ═══════════════════════════════════════════════════════════════════
//  Toast notification (replaces alert())
// ═══════════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toastEl');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'toastEl';
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-show'), 10);
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 400); }, 3500);
}

// ═══════════════════════════════════════════════════════════════════
//  Init
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  loadInvitations();
  loadReviews();
  loadPublicStats();
  setupEventListeners();
  setupStarPicker();
  updateFavFab();
  checkTrackRoute();
  registerServiceWorker();
  setupPwaInstall();
});

function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', () => applyFilters());
  document.getElementById('requestForm').addEventListener('submit', submitRequest);
  document.getElementById('reviewForm').addEventListener('submit', submitReview);
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  });
  // Admin key input — submit on Enter
  document.getElementById('adminKey').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginAdmin();
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Public stats — SAFE, no business secrets
//  Only shows: happy couples (completed), templates, approved reviews
// ═══════════════════════════════════════════════════════════════════
async function loadPublicStats() {
  try {
    const r = await fetch('/api/public/stats');
    const d = await r.json();
    document.getElementById('statCompleted').textContent = (d.completed || 0).toLocaleString() + '+';
    document.getElementById('statTemplates').textContent = d.templates || 0;
    document.getElementById('statReviews').textContent   = d.reviews   || 0;
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════
//  Gallery
// ═══════════════════════════════════════════════════════════════════
async function loadInvitations() {
  try {
    const url = sortPopular ? '/api/invitations?sort=popular' : '/api/invitations';
    const r = await fetch(url);
    allInvitations = await r.json();
    lightboxList = allInvitations.filter(i => i.image_url);
    applyFilters();
    populateInvitationSelect();
    populateReviewTemplateSelect();
  } catch (e) {
    document.getElementById('templateCount').textContent = 'Error loading templates';
  }
}

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let list = allInvitations;
  if (currentPackage !== 'all') list = list.filter(i => i.package === currentPackage);
  if (q) list = list.filter(i => i.name.toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q));
  renderGallery(list);
}

function filterByPackage(pkg, btn) {
  currentPackage = pkg;
  document.querySelectorAll('.filter-row .filter-btn:not(.sort-btn)').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function togglePopularSort(btn) {
  sortPopular = !sortPopular;
  btn.classList.toggle('active', sortPopular);
  loadInvitations();
}

const PKG_BADGE = { Basic: 'badge-basic', Premium: 'badge-premium', Luxury: 'badge-luxury' };

function renderGallery(invitations) {
  const grid  = document.getElementById('galleryGrid');
  const count = document.getElementById('templateCount');
  grid.innerHTML = '';
  if (!invitations.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#475569">No invitations found</p>';
    count.textContent = '0 templates available';
    return;
  }
  invitations.forEach(inv => {
    const id      = inv._id || inv.id;
    const price   = inv.price ? `<span class="price-tag">${Number(inv.price).toLocaleString()} DA</span>` : '';
    const badge   = `<span class="pkg-badge ${PKG_BADGE[inv.package]||''}">${inv.package||'Basic'}</span>`;
    const isFav   = favorites.includes(id);
    const popular = inv.order_count > 0 ? `<span class="popular-badge">🔥 ${inv.order_count} orders</span>` : '';
    const card    = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-image" onclick="openLightbox('${id}')">
        <img src="${inv.image_url||''}" alt="${inv.name}" loading="lazy" onerror="this.style.display='none'">
        <div class="card-badges">${badge}${popular}</div>
        <div class="lightbox-hint">🔍 View</div>
      </div>
      <div class="card-content">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <h3 class="card-title">${inv.name}</h3>
          <button class="fav-heart ${isFav?'fav-active':''}" onclick="toggleFavorite(event,'${id}')" title="Save to favorites">♥</button>
        </div>
        <p class="card-description">${inv.description||''}</p>
        <div class="card-footer">
          ${price}
          <div style="display:flex;gap:.5rem">
            <button class="sample-btn" onclick="openSampleModal('${id}')">👁 Sample</button>
            <button class="card-button" onclick="openRequestModal('${id}')">Select</button>
          </div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  count.textContent = `${invitations.length} template${invitations.length===1?'':'s'} available`;
}

function populateInvitationSelect() {
  const sel = document.getElementById('invitationSelect');
  sel.innerHTML = '<option value="">Choose a template</option>';
  allInvitations.forEach(inv => {
    const id = inv._id||inv.id;
    const o  = document.createElement('option');
    o.value  = id; o.textContent = `${inv.name} — ${(inv.price||0).toLocaleString()} DA`;
    o.dataset.price = inv.price||0;
    sel.appendChild(o);
  });
  sel.addEventListener('change', updatePriceSummary);
}

function populateReviewTemplateSelect() {
  const sel = document.getElementById('reviewTemplate');
  sel.innerHTML = '<option value="">Select template...</option>';
  allInvitations.forEach(inv => {
    const o = document.createElement('option');
    o.value = inv._id||inv.id; o.textContent = inv.name;
    sel.appendChild(o);
  });
}

function updatePriceSummary() {
  const sel   = document.getElementById('invitationSelect');
  const opt   = sel.options[sel.selectedIndex];
  const price = opt?.dataset?.price;
  const box   = document.getElementById('priceSummary');
  if (price && price > 0) {
    box.innerHTML     = `<div class="price-box">💰 Price: <strong>${Number(price).toLocaleString()} DA</strong></div>`;
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Lightbox
// ═══════════════════════════════════════════════════════════════════
function openLightbox(invId) {
  const idx = lightboxList.findIndex(i => (i._id||i.id) === invId);
  if (idx === -1) return;
  lightboxIndex = idx;
  showLightboxAt(lightboxIndex);
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showLightboxAt(idx) {
  const inv = lightboxList[idx];
  if (!inv) return;
  document.getElementById('lightboxImg').src = inv.image_url;
  document.getElementById('lightboxCaption').textContent = `${inv.name} — ${(inv.price||0).toLocaleString()} DA`;
}

function lightboxNav(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxList.length) % lightboxList.length;
  showLightboxAt(lightboxIndex);
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('active')) {
    if (e.key === 'ArrowRight') lightboxNav(1);
    if (e.key === 'ArrowLeft')  lightboxNav(-1);
    if (e.key === 'Escape')     closeLightbox();
  }
  if (e.key === 'Escape' && document.getElementById('adminModal').classList.contains('active')) {
    closeAdminPanel();
  }
});

// ═══════════════════════════════════════════════════════════════════
//  Favorites
// ═══════════════════════════════════════════════════════════════════
function toggleFavorite(e, id) {
  e.stopPropagation();
  const btn = e.currentTarget;
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
    btn.classList.remove('fav-active');
  } else {
    favorites.push(id);
    btn.classList.add('fav-active');
  }
  localStorage.setItem('weddingFavorites', JSON.stringify(favorites));
  updateFavFab();
}

function updateFavFab() {
  const fab = document.getElementById('favFab');
  document.getElementById('favCount').textContent = favorites.length;
  fab.style.display = favorites.length > 0 ? 'flex' : 'none';
}

function openFavoritesPanel() {
  const list    = document.getElementById('favList');
  const favInvs = allInvitations.filter(i => favorites.includes(i._id||i.id));
  if (!favInvs.length) { list.innerHTML = '<p style="padding:1rem;color:#94a3b8">No favorites yet</p>'; }
  else {
    list.innerHTML = favInvs.map(inv => {
      const id = inv._id||inv.id;
      return `<div class="fav-item">
        <img src="${inv.image_url||''}" onerror="this.style.display='none'" style="width:56px;height:42px;object-fit:cover;border-radius:6px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.9rem">${inv.name}</div>
          <div style="color:#ec4899;font-size:.85rem">${(inv.price||0).toLocaleString()} DA</div>
        </div>
        <button class="card-button" style="padding:.4rem .8rem;font-size:.8rem" onclick="openRequestModal('${id}');closeFavoritesPanel()">Order</button>
      </div>`;
    }).join('');
  }
  document.getElementById('favPanel').classList.add('active');
}

function closeFavoritesPanel() {
  document.getElementById('favPanel').classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════════
//  Sample preview
// ═══════════════════════════════════════════════════════════════════
function openSampleModal(invId) {
  const inv = allInvitations.find(i => (i._id||i.id) === invId);
  if (!inv) return;
  document.getElementById('sampleModalName').textContent = inv.name;
  document.getElementById('sampleImg').src = inv.image_url || '';
  document.getElementById('sampleOrderBtn').onclick = () => { closeSampleModal(); openRequestModal(invId); };
  document.getElementById('sampleModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSampleModal() {
  document.getElementById('sampleModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

// ═══════════════════════════════════════════════════════════════════
//  Request modal
// ═══════════════════════════════════════════════════════════════════
function openRequestModal(invId) {
  document.getElementById('invitationSelect').value = invId;
  updatePriceSummary();
  const inv = allInvitations.find(i => (i._id||i.id) === invId);
  if (inv) {
    document.getElementById('selectedTemplateInfo').innerHTML =
      `<img src="${inv.image_url||''}" style="width:60px;height:45px;object-fit:cover;border-radius:6px;margin-right:12px">
       <div><strong>${inv.name}</strong><br><span style="color:#ec4899">${(inv.price||0).toLocaleString()} DA</span></div>`;
  }
  document.getElementById('requestModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeRequestModal() {
  document.getElementById('requestModal').classList.remove('active');
  document.getElementById('requestForm').reset();
  document.getElementById('priceSummary').style.display  = 'none';
  document.getElementById('selectedTemplateInfo').innerHTML = '';
  document.body.style.overflow = 'auto';
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function copyTrackingCode() {
  navigator.clipboard.writeText(lastTrackingCode).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy Code', 2000);
  });
}

async function submitRequest(e) {
  e.preventDefault();
  const invId   = document.getElementById('invitationSelect').value;
  const sel     = document.getElementById('invitationSelect');
  const invName = sel.options[sel.selectedIndex]?.textContent?.split(' — ')[0] || '';
  const price   = sel.options[sel.selectedIndex]?.dataset?.price || 0;
  const fn      = document.getElementById('firstName').value;
  const ln      = document.getElementById('lastName').value;
  const ph      = document.getElementById('phoneNumber').value;
  const wd      = document.getElementById('weddingDate').value;
  const nt      = document.getElementById('notes').value;

  if (!invId||!fn||!ln||!ph||!wd) { showToast('Please fill in all required fields', 'error'); return; }

  try {
    const r = await fetch('/api/requests', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ invitation_id:invId, invitation_name:invName, first_name:fn, last_name:ln, phone_number:ph, wedding_date:wd, notes:nt, price })
    });
    const d = await r.json();
    if (r.ok) {
      closeRequestModal();
      lastTrackingCode = d.tracking_id || '';
      if (d.tracking_id) {
        document.getElementById('trackingInfo').style.display = 'block';
        document.getElementById('trackingCode').textContent   = d.tracking_id;
      }
      document.getElementById('successModal').classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(closeSuccessModal, 8000);
      loadPublicStats();
      loadInvitations();
    } else { showToast('Error: ' + d.error, 'error'); }
  } catch { showToast('Error submitting request', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Order Tracker (public)
// ═══════════════════════════════════════════════════════════════════
function checkTrackRoute() {
  const match = window.location.pathname.match(/^\/track\/([A-Z0-9]+)$/i);
  if (match) {
    openTrackModal();
    document.getElementById('trackInput').value = match[1].toUpperCase();
    doTrack();
  }
}

function openTrackModal() {
  document.getElementById('trackModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTrackModal() {
  document.getElementById('trackModal').classList.remove('active');
  document.getElementById('trackResult').style.display = 'none';
  document.getElementById('trackInput').value = '';
  document.body.style.overflow = 'auto';
}

async function doTrack() {
  const code = document.getElementById('trackInput').value.trim().toUpperCase();
  if (!code) { showToast('Enter a tracking code', 'error'); return; }
  const resultEl = document.getElementById('trackResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<p style="color:#94a3b8">Searching...</p>';
  try {
    const r = await fetch(`/api/track/${code}`);
    if (!r.ok) { resultEl.innerHTML = '<p style="color:#ef4444">❌ Order not found. Check the code and try again.</p>'; return; }
    const d = await r.json();
    const steps = ['pending','in_progress','completed'];
    const stepLabels = { pending:'Received', in_progress:'In Progress', completed:'Ready!' };
    const statusIdx = steps.indexOf(d.status);
    resultEl.innerHTML = `
      <div class="track-card">
        <div class="track-name">👰 ${d.first_name}'s Order</div>
        <div class="track-template">🎨 ${d.invitation_name}</div>
        <div class="track-date">💍 Wedding: ${d.wedding_date}</div>
        <div class="track-steps">
          ${steps.map((s, i) => `
            <div class="track-step ${i <= statusIdx ? 'done' : ''} ${d.status === s ? 'current' : ''}">
              <div class="track-dot"></div>
              <div class="track-step-label">${stepLabels[s]}</div>
            </div>
          `).join('<div class="track-line"></div>')}
        </div>
        <div class="track-status status-${d.status}">${(d.status||'').replace('_',' ')}</div>
      </div>`;
  } catch { resultEl.innerHTML = '<p style="color:#ef4444">Error checking order. Try again.</p>'; }
}

// ═══════════════════════════════════════════════════════════════════
//  Reviews
// ═══════════════════════════════════════════════════════════════════
async function loadReviews() {
  try {
    const r = await fetch('/api/reviews');
    const reviews = await r.json();
    const grid = document.getElementById('reviewsGrid');
    if (!reviews.length) { grid.innerHTML = '<p style="text-align:center;color:#94a3b8">No reviews yet — be the first!</p>'; return; }
    grid.innerHTML = reviews.map(rv => `
      <div class="review-card">
        <div class="review-stars">${'★'.repeat(rv.rating)}${'☆'.repeat(5-rv.rating)}</div>
        <p class="review-comment">"${rv.comment||''}"</p>
        <div class="review-author">— ${rv.client_name}${rv.invitation_name?' · '+rv.invitation_name:''}</div>
      </div>`).join('');
  } catch {}
}

function setupStarPicker() {
  const stars = document.querySelectorAll('#starPicker .star');
  stars.forEach(s => {
    s.addEventListener('mouseover', () => highlightStars(+s.dataset.v));
    s.addEventListener('click', () => {
      selectedRating = +s.dataset.v;
      highlightStars(selectedRating);
      document.getElementById('reviewRating').value = selectedRating;
    });
  });
  document.getElementById('starPicker').addEventListener('mouseleave', () => highlightStars(selectedRating));
}

function highlightStars(n) {
  document.querySelectorAll('#starPicker .star').forEach(s => s.classList.toggle('active', +s.dataset.v <= n));
}

function openReviewModal()  { document.getElementById('reviewModal').classList.add('active'); document.body.style.overflow='hidden'; }
function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
  document.getElementById('reviewForm').reset();
  selectedRating=0; highlightStars(0);
  document.body.style.overflow='auto';
}

async function submitReview(e) {
  e.preventDefault();
  const name    = document.getElementById('reviewName').value;
  const tplSel  = document.getElementById('reviewTemplate');
  const tplId   = tplSel.value;
  const tplNm   = tplSel.options[tplSel.selectedIndex]?.textContent;
  const rating  = +document.getElementById('reviewRating').value;
  const comment = document.getElementById('reviewComment').value;
  if (!name||!rating) { showToast('Please provide name and rating', 'error'); return; }
  try {
    const r = await fetch('/api/reviews', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ invitation_id:tplId||null, invitation_name:tplNm||'', client_name:name, rating, comment })
    });
    if (r.ok) { closeReviewModal(); showToast('Thank you! Your review will appear after approval.', 'success'); }
  } catch { showToast('Error submitting review', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Admin — Auth
// ═══════════════════════════════════════════════════════════════════
function openAdminPanel() {
  document.getElementById('adminModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
  document.getElementById('adminModal').classList.remove('active');
  document.body.style.overflow = 'auto';
  adminKey = null;
  document.getElementById('adminLogin').style.display     = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminKey').value = '';
}

async function loginAdmin() {
  const key = document.getElementById('adminKey').value.trim();
  if (!key) { showToast('Enter admin key', 'error'); return; }
  try {
    // Verify key using header auth
    const r = await fetch('/api/admin/requests', { headers: { 'x-admin-key': key } });
    if (r.ok) {
      adminKey = key;
      document.getElementById('adminLogin').style.display     = 'none';
      document.getElementById('adminDashboard').style.display = 'flex';
      // Load requests tab by default
      allRequests = await r.json();
      renderRequests();
      updateOrdersSubtitle();
      updatePendingBadge();
    } else { showToast('Invalid admin key', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

function logoutAdmin() {
  adminKey = null;
  allRequests = [];
  document.getElementById('adminLogin').style.display     = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminKey').value = '';
}

// ═══════════════════════════════════════════════════════════════════
//  Admin — Tab switching
// ═══════════════════════════════════════════════════════════════════
function switchAdminTab(name, btn) {
  document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display='none');
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+name).style.display = 'block';
  btn.classList.add('active');
  if (name==='requests')  loadAdminRequests();
  if (name==='templates') loadAdminTemplates();
  if (name==='analytics') loadAdminAnalytics();
  if (name==='calendar')  { loadAdminRequests().then(() => renderCalendar()); }
  if (name==='reviews')   loadAdminReviews();
}

// ═══════════════════════════════════════════════════════════════════
//  Admin — Requests tab
// ═══════════════════════════════════════════════════════════════════
function filterRequests(status, btn) {
  currentStatus = status;
  document.querySelectorAll('.status-filter .filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  selectedRequestIds.clear();
  updateBulkBar();
  renderRequests();
  syncSelectAllCheckbox();
}

function renderRequests() {
  const list = currentStatus==='all' ? allRequests : allRequests.filter(r=>r.status===currentStatus);
  const el   = document.getElementById('requestsList');
  if (!list.length) { el.innerHTML='<p style="text-align:center;color:#475569;padding:2rem">No orders found</p>'; return; }
  const statusOpts = ['pending','in_progress','completed','archived'];
  el.innerHTML = list.map(req => {
    const id      = req._id||req.id;
    const opts    = statusOpts.map(s=>`<option value="${s}" ${req.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('');
    const isChecked = selectedRequestIds.has(id);
    const waLink  = `https://wa.me/${req.phone_number.replace(/\D/g,'')}?text=${encodeURIComponent(`Hello ${req.first_name}! Your invitation "${req.invitation_name}" update:`)}`;
    return `
    <div class="request-item ${isChecked?'request-selected':''}">
      <div class="request-header">
        <input type="checkbox" class="bulk-checkbox" ${isChecked?'checked':''} onchange="toggleBulkSelect('${id}',this.checked)" title="Select for bulk action">
        <h3>${req.first_name} ${req.last_name}</h3>
        <span class="status-chip status-${req.status}">${req.status.replace('_',' ')}</span>
      </div>
      <div class="request-info">
        <div><strong>📱</strong> ${req.phone_number}</div>
        <div><strong>💍</strong> ${req.wedding_date}</div>
        <div><strong>🎨</strong> ${req.invitation_name}</div>
        <div><strong>💰</strong> ${(req.price||0).toLocaleString()} DA</div>
        <div><strong>📅</strong> ${new Date(req.created_at).toLocaleDateString()}</div>
        <div><strong>🔗</strong> ${req.tracking_id||'—'}</div>
        ${req.notes?`<div style="grid-column:1/-1"><strong>📝</strong> ${req.notes}</div>`:''}
      </div>
      <div class="admin-note-wrap">
        <textarea class="admin-note-input" id="anote-${id}" placeholder="Internal notes (not visible to client)...">${req.admin_notes||''}</textarea>
        <button class="small-btn" onclick="saveAdminNote('${id}')">💾 Save Note</button>
      </div>
      <div class="request-status">
        <select id="status-${id}">${opts}</select>
        <button onclick="updateRequestStatus('${id}')">Update</button>
        <a href="${waLink}" target="_blank" class="small-btn wa-btn">💬 WhatsApp</a>
        <button class="danger-btn" onclick="deleteRequest('${id}')">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

function updateOrdersSubtitle() {
  const total   = allRequests.length;
  const pending = allRequests.filter(r=>r.status==='pending').length;
  document.getElementById('ordersSubtitle').textContent = `${total} total • ${pending} pending`;
}

function updatePendingBadge() {
  const pending = allRequests.filter(r=>r.status==='pending').length;
  const badge   = document.getElementById('pendingBadge');
  if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline'; }
  else             { badge.style.display = 'none'; }
}

// Bulk selection
function toggleBulkSelect(id, checked) {
  if (checked) selectedRequestIds.add(id);
  else selectedRequestIds.delete(id);
  updateBulkBar();
  document.querySelectorAll('.request-item').forEach(el => {
    const cb = el.querySelector('.bulk-checkbox');
    if (cb) el.classList.toggle('request-selected', cb.checked);
  });
  syncSelectAllCheckbox();
}

function toggleSelectAll(checked) {
  const visible = currentStatus==='all' ? allRequests : allRequests.filter(r=>r.status===currentStatus);
  visible.forEach(r => {
    const id = r._id||r.id;
    if (checked) selectedRequestIds.add(id);
    else selectedRequestIds.delete(id);
  });
  updateBulkBar();
  renderRequests(); // re-render to reflect checked state
}

function syncSelectAllCheckbox() {
  const visible = currentStatus==='all' ? allRequests : allRequests.filter(r=>r.status===currentStatus);
  const cb = document.getElementById('selectAllCheck');
  if (!cb) return;
  if (visible.length === 0) { cb.checked = false; cb.indeterminate = false; return; }
  const selectedVisible = visible.filter(r => selectedRequestIds.has(r._id||r.id)).length;
  if (selectedVisible === 0)              { cb.checked = false; cb.indeterminate = false; }
  else if (selectedVisible === visible.length) { cb.checked = true;  cb.indeterminate = false; }
  else                                    { cb.checked = false; cb.indeterminate = true;  }
}

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  const n   = selectedRequestIds.size;
  bar.style.display = n > 0 ? 'flex' : 'none';
  document.getElementById('bulkCount').textContent = `${n} order${n===1?'':'s'} selected`;
}

async function applyBulkStatus() {
  const status = document.getElementById('bulkStatusSel').value;
  const ids    = [...selectedRequestIds];
  if (!ids.length) return;
  const ok = await showConfirm('Update Status', `Set ${ids.length} order${ids.length===1?'':'s'} to "${status.replace('_',' ')}"?`, '📋', 'Update');
  if (!ok) return;
  try {
    const r = await adminFetch('/api/admin/requests/bulk', {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ids, status })
    });
    if (r.ok) {
      selectedRequestIds.clear();
      updateBulkBar();
      await loadAdminRequests();
      showToast(`${ids.length} order${ids.length===1?'':'s'} updated`, 'success');
    } else { showToast('Bulk update failed', 'error'); }
  } catch { showToast('Error', 'error'); }
}

async function confirmBulkDelete() {
  const ids = [...selectedRequestIds];
  if (!ids.length) return;
  const ok = await showConfirm('Delete Orders', `Permanently delete ${ids.length} order${ids.length===1?'':'s'}? This cannot be undone.`, '🗑️', '🗑 Delete');
  if (!ok) return;
  try {
    const r = await adminFetch('/api/admin/requests/bulk', {
      method:'DELETE', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ids })
    });
    if (r.ok) {
      const d = await r.json();
      selectedRequestIds.clear();
      updateBulkBar();
      await loadAdminRequests();
      showToast(`${d.deleted} order${d.deleted===1?'':'s'} deleted`, 'success');
    } else { showToast('Bulk delete failed', 'error'); }
  } catch { showToast('Error', 'error'); }
}

function clearBulkSelection() {
  selectedRequestIds.clear();
  updateBulkBar();
  document.getElementById('selectAllCheck').checked     = false;
  document.getElementById('selectAllCheck').indeterminate = false;
  renderRequests();
}

async function saveAdminNote(id) {
  const note = document.getElementById(`anote-${id}`).value;
  try {
    const r = await adminFetch(`/api/admin/requests/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ admin_notes: note, status: allRequests.find(r=>(r._id||r.id)===id)?.status })
    });
    if (r.ok) {
      showToast('Note saved', 'success');
      const req = allRequests.find(r=>(r._id||r.id)===id);
      if (req) req.admin_notes = note;
    }
  } catch { showToast('Error saving note', 'error'); }
}

async function loadAdminRequests() {
  try {
    const r = await adminFetch('/api/admin/requests');
    allRequests = await r.json();
    renderRequests();
    updateOrdersSubtitle();
    updatePendingBadge();
    syncSelectAllCheckbox();
  } catch { showToast('Error loading orders', 'error'); }
}

async function updateRequestStatus(id) {
  const status = document.getElementById(`status-${id}`).value;
  try {
    const r = await adminFetch(`/api/admin/requests/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ status })
    });
    if (r.ok) { await loadAdminRequests(); showToast('Status updated', 'success'); }
    else showToast('Error updating status', 'error');
  } catch { showToast('Error', 'error'); }
}

async function deleteRequest(id) {
  const req = allRequests.find(r=>(r._id||r.id)===id);
  const name = req ? `${req.first_name} ${req.last_name}` : 'this order';
  const ok = await showConfirm('Delete Order', `Delete order from ${name}? This cannot be undone.`, '🗑️', '🗑 Delete');
  if (!ok) return;
  try {
    const r = await adminFetch(`/api/admin/requests/${id}`, { method:'DELETE' });
    if (r.ok) { await loadAdminRequests(); showToast('Order deleted', 'success'); }
  } catch { showToast('Error', 'error'); }
}

async function exportCSV() {
  try {
    const r = await adminFetch('/api/admin/requests/export/csv');
    const csv = await r.text();
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
      download: `orders-${new Date().toISOString().split('T')[0]}.csv`
    });
    a.click();
  } catch { showToast('Error exporting', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Admin — Templates tab
// ═══════════════════════════════════════════════════════════════════
async function loadAdminTemplates() {
  try {
    const r    = await fetch('/api/invitations');
    const tmpl = await r.json();
    const el   = document.getElementById('templatesList');
    el.innerHTML = tmpl.map(t => {
      const id = t._id||t.id;
      return `
      <div class="template-admin-item">
        <img src="${t.image_url||''}" onerror="this.style.display='none'" style="width:80px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <strong>${t.name}</strong> <span class="pkg-badge ${PKG_BADGE[t.package]||''}">${t.package}</span>
          <span style="font-size:.75rem;color:#94a3b8;margin-left:.5rem">🔥 ${t.order_count||0} orders</span><br>
          <small style="color:#64748b">${t.description||''}</small><br>
          <span style="color:#ec4899;font-weight:700">${(t.price||0).toLocaleString()} DA</span>
        </div>
        <div style="display:flex;gap:.5rem;flex-shrink:0">
          <button class="small-btn" onclick="editTemplate('${id}')">✏️ Edit</button>
          <button class="small-btn danger-btn" onclick="deleteTemplate('${id}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
  } catch { showToast('Error loading templates', 'error'); }
}

function openAddTemplateForm() {
  document.getElementById('editTemplateId').value = '';
  ['tplName','tplDesc','tplPrice','tplImageUrl'].forEach(id => document.getElementById(id).value='');
  document.getElementById('tplPackage').value = 'Basic';
  document.getElementById('addTemplateForm').style.display = 'block';
}

function closeAddTemplateForm() { document.getElementById('addTemplateForm').style.display='none'; }

async function editTemplate(id) {
  const t = allInvitations.find(i=>(i._id||i.id)===id) || (await (await fetch(`/api/invitations/${id}`)).json());
  document.getElementById('editTemplateId').value  = id;
  document.getElementById('tplName').value         = t.name||'';
  document.getElementById('tplDesc').value         = t.description||'';
  document.getElementById('tplPrice').value        = t.price||0;
  document.getElementById('tplPackage').value      = t.package||'Basic';
  document.getElementById('tplImageUrl').value     = t.image_url||'';
  document.getElementById('addTemplateForm').style.display='block';
}

async function saveTemplate() {
  const editId = document.getElementById('editTemplateId').value;
  let imageUrl = document.getElementById('tplImageUrl').value;
  const fileInput = document.getElementById('tplImageFile');
  if (fileInput.files[0]) {
    document.getElementById('uploadProgress').style.display='block';
    const fd = new FormData(); fd.append('image', fileInput.files[0]);
    try {
      const ur = await adminFetch('/api/admin/upload', { method:'POST', body:fd });
      const ud = await ur.json();
      if (ud.url) { imageUrl = ud.url; fileInput.value=''; }
      else { showToast('Upload failed: '+ud.error, 'error'); return; }
    } catch { showToast('Upload error', 'error'); return; }
    finally { document.getElementById('uploadProgress').style.display='none'; }
  }
  const payload = {
    name:        document.getElementById('tplName').value,
    description: document.getElementById('tplDesc').value,
    price:       +document.getElementById('tplPrice').value||0,
    package:     document.getElementById('tplPackage').value,
    image_url:   imageUrl
  };
  if (!payload.name) { showToast('Name is required', 'error'); return; }
  try {
    const url    = editId ? `/api/admin/invitations/${editId}` : '/api/admin/invitations';
    const method = editId ? 'PUT' : 'POST';
    const r = await adminFetch(url, {
      method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if (r.ok) { closeAddTemplateForm(); loadAdminTemplates(); loadInvitations(); showToast('Template saved', 'success'); }
    else { const d=await r.json(); showToast('Error: '+d.error, 'error'); }
  } catch { showToast('Error saving template', 'error'); }
}

async function deleteTemplate(id) {
  const ok = await showConfirm('Delete Template', 'Delete this template? Orders referencing it will remain intact.', '🗑️', '🗑 Delete');
  if (!ok) return;
  try {
    const r = await adminFetch(`/api/admin/invitations/${id}`, { method:'DELETE' });
    if (r.ok) { loadAdminTemplates(); loadInvitations(); showToast('Template deleted', 'success'); }
  } catch { showToast('Error', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Admin — Analytics tab (uses admin endpoint, key required)
// ═══════════════════════════════════════════════════════════════════
async function loadAdminAnalytics() {
  try {
    const r = await adminFetch('/api/admin/analytics');
    const d = await r.json();

    document.getElementById('analyticsGrid').innerHTML = `
      <div class="analytics-card"><div class="analytics-num">${d.total||0}</div><div class="analytics-label">Total Orders</div></div>
      <div class="analytics-card pending"><div class="analytics-num">${d.pending||0}</div><div class="analytics-label">Pending</div></div>
      <div class="analytics-card progress"><div class="analytics-num">${d.inProgress||0}</div><div class="analytics-label">In Progress</div></div>
      <div class="analytics-card done"><div class="analytics-num">${d.completed||0}</div><div class="analytics-label">Completed</div></div>
      <div class="analytics-card revenue"><div class="analytics-num">${(d.revenue||0).toLocaleString()} DA</div><div class="analytics-label">Total Revenue</div></div>
    `;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = d.monthly||[];
    const maxCount = Math.max(...monthly.map(m=>m.count),1);
    const canvas = document.getElementById('monthlyChart');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 600;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const barW = canvas.width/(monthly.length||1)-10;
    monthly.forEach((m,i) => {
      const h = (m.count/maxCount)*(canvas.height-40);
      const x = i*(barW+10)+5;
      const y = canvas.height-h-30;
      ctx.fillStyle='#ec4899';
      ctx.beginPath(); ctx.roundRect(x,y,barW,h,4); ctx.fill();
      ctx.fillStyle='#475569'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(months[(m._id.month-1)],x+barW/2,canvas.height-10);
      ctx.fillStyle='#0f172a';
      ctx.fillText(m.count,x+barW/2,y-5);
    });

    const top  = d.topTemplates||[];
    const maxT = Math.max(...top.map(t=>t.count),1);
    document.getElementById('topTemplatesChart').innerHTML = top.map(t=>`
      <div style="margin-bottom:.75rem">
        <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:.25rem">
          <span>${t._id}</span><span style="font-weight:700;color:#ec4899">${t.count}</span>
        </div>
        <div style="background:#f1f5f9;border-radius:999px;height:8px">
          <div style="background:linear-gradient(to right,#ec4899,#a855f7);height:8px;border-radius:999px;width:${(t.count/maxT*100).toFixed(1)}%"></div>
        </div>
      </div>`).join('');
  } catch(e) { showToast('Error loading analytics', 'error'); console.error(e); }
}

// ═══════════════════════════════════════════════════════════════════
//  Admin — Calendar tab
// ═══════════════════════════════════════════════════════════════════
function calPrev() { calMonth--; if (calMonth < 0) { calMonth=11; calYear--; } renderCalendar(); }
function calNext() { calMonth++; if (calMonth > 11) { calMonth=0;  calYear++; } renderCalendar(); }

function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calTitle').textContent = `${monthNames[calMonth]} ${calYear}`;
  const dateMap = {};
  allRequests.forEach(req => {
    if (!req.wedding_date) return;
    const key = req.wedding_date;
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(req);
  });
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const today       = new Date();
  let html = '<div class="cal-weekdays">';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => html += `<div class="cal-wd">${d}</div>`);
  html += '</div><div class="cal-days">';
  for (let i=0; i<firstDay; i++) html += '<div class="cal-day cal-empty"></div>';
  for (let d=1; d<=daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayReqs = dateMap[dateStr] || [];
    const isToday = today.getFullYear()===calYear && today.getMonth()===calMonth && today.getDate()===d;
    const dots    = dayReqs.map(r=>`<span class="cal-dot dot-${r.status}" title="${r.first_name} ${r.last_name} — ${r.invitation_name}"></span>`).join('');
    html += `<div class="cal-day ${isToday?'cal-today':''} ${dayReqs.length?'cal-has-events':''}">
      <span class="cal-day-num">${d}</span>
      <div class="cal-dots">${dots}</div>
    </div>`;
  }
  html += '</div>';
  document.getElementById('calGrid').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
//  Admin — Reviews tab
// ═══════════════════════════════════════════════════════════════════
async function loadAdminReviews() {
  try {
    const r  = await adminFetch('/api/admin/reviews');
    const rv = await r.json();
    const el = document.getElementById('adminReviewsList');
    if (!rv.length) { el.innerHTML='<p style="text-align:center;color:#475569;padding:2rem">No reviews yet</p>'; return; }
    el.innerHTML = rv.map(v => {
      const id = v._id||v.id;
      return `
      <div class="review-admin-item">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
          <div>
            <strong>${v.client_name}</strong> ${'★'.repeat(v.rating)}
            ${v.invitation_name?`<span style="color:#94a3b8;font-size:.8rem"> · ${v.invitation_name}</span>`:''}
            <br><span style="color:#475569;font-size:.875rem">${v.comment||''}</span>
          </div>
          <div style="display:flex;gap:.5rem">
            ${v.approved
              ? `<button class="small-btn danger-btn" onclick="moderateReview('${id}',false)">Hide</button>`
              : `<button class="small-btn" onclick="moderateReview('${id}',true)">✅ Approve</button>`}
            <button class="small-btn danger-btn" onclick="deleteReview('${id}')">🗑️</button>
          </div>
        </div>
        <div style="font-size:.75rem;color:#94a3b8;margin-top:.25rem">${new Date(v.created_at).toLocaleDateString()} · ${v.approved?'<span style="color:#22c55e">Approved</span>':'<span style="color:#f59e0b">Pending</span>'}</div>
      </div>`;
    }).join('');
  } catch { showToast('Error loading reviews', 'error'); }
}

async function moderateReview(id, approved) {
  try {
    const r = await adminFetch(`/api/admin/reviews/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({approved})
    });
    if (r.ok) { loadAdminReviews(); loadReviews(); showToast(approved?'Review approved':'Review hidden', 'success'); }
  } catch { showToast('Error', 'error'); }
}

async function deleteReview(id) {
  const ok = await showConfirm('Delete Review', 'Permanently delete this review?', '🗑️', '🗑 Delete');
  if (!ok) return;
  try {
    const r = await adminFetch(`/api/admin/reviews/${id}`, { method:'DELETE' });
    if (r.ok) { loadAdminReviews(); loadReviews(); showToast('Review deleted', 'success'); }
  } catch { showToast('Error', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Lazy load & PWA
// ═══════════════════════════════════════════════════════════════════
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function setupPwaInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPwaPrompt = e;
    document.getElementById('pwaInstallBanner').style.display = 'flex';
  });
  window.addEventListener('appinstalled', () => {
    document.getElementById('pwaInstallBanner').style.display = 'none';
    deferredPwaPrompt = null;
  });
}

function installPWA() {
  if (!deferredPwaPrompt) return;
  deferredPwaPrompt.prompt();
  deferredPwaPrompt.userChoice.then(() => {
    deferredPwaPrompt = null;
    document.getElementById('pwaInstallBanner').style.display = 'none';
  });
}

function dismissPWA() { document.getElementById('pwaInstallBanner').style.display = 'none'; }

// ═══════════════════════════════════════════════════════════════════
//  Close modals on backdrop click
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('click', e => {
  if (e.target===document.getElementById('requestModal')) closeRequestModal();
  if (e.target===document.getElementById('successModal')) closeSuccessModal();
  if (e.target===document.getElementById('reviewModal'))  closeReviewModal();
  if (e.target===document.getElementById('trackModal'))   closeTrackModal();
  if (e.target===document.getElementById('sampleModal'))  closeSampleModal();
  if (e.target===document.getElementById('confirmDialog')) resolveConfirm(false);
  // Admin modal backdrop — only close if clicking the fullscreen wrapper
  if (e.target===document.getElementById('adminModal') && !adminKey) closeAdminPanel();
});
