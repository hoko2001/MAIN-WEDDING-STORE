// ═══════════════════════════════════════════════════════════════════
//  i18n — Feature 8: Arabic / French / English
// ═══════════════════════════════════════════════════════════════════
const TRANSLATIONS = {
  en: {
    nav_gallery:'Gallery', nav_reviews:'Reviews',
    hero_badge:'BEAUTIFUL INVITATIONS',
    hero_title:'Find Your Perfect Invitation',
    hero_subtitle:'Browse our collection of stunning wedding invitation templates.',
    search_placeholder:'Search invitations by name or style...',
    filter_all:'All',
    stat_total:'Total Requests', stat_pending:'Pending', stat_completed:'Completed', stat_revenue:'Revenue (DA)',
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
    stat_total:'Total Demandes', stat_pending:'En attente', stat_completed:'Terminées', stat_revenue:'Revenu (DA)',
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
    stat_total:'إجمالي الطلبات', stat_pending:'قيد الانتظار', stat_completed:'مكتملة', stat_revenue:'الإيرادات (دج)',
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
let allInvitations  = [];
let adminKey        = null;
let allRequests     = [];
let currentPackage  = 'all';
let currentStatus   = 'all';
let selectedRating  = 0;
let sortPopular     = false;
let favorites       = JSON.parse(localStorage.getItem('weddingFavorites') || '[]');
let lightboxIndex   = 0;
let lightboxList    = [];
let selectedRequestIds = new Set();
let calYear, calMonth;
let lastTrackingCode = '';
let deferredPwaPrompt = null;

// ═══════════════════════════════════════════════════════════════════
//  Init
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  loadInvitations();
  loadReviews();
  loadAnalyticsBanner();
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
  // Close lightbox on backdrop click
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Analytics banner (public)
// ═══════════════════════════════════════════════════════════════════
async function loadAnalyticsBanner() {
  try {
    const r = await fetch('/api/analytics/summary');
    const d = await r.json();
    document.getElementById('statTotal').textContent     = d.total     || 0;
    document.getElementById('statPending').textContent   = d.pending   || 0;
    document.getElementById('statCompleted').textContent = d.completed || 0;
    document.getElementById('statRevenue').textContent   = (d.revenue  || 0).toLocaleString();
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
    // Build lightbox list
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
  if (q) list = list.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  renderGallery(list);
}

function filterByPackage(pkg, btn) {
  currentPackage = pkg;
  document.querySelectorAll('.filter-row .filter-btn:not(.sort-btn)').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

// Feature #12: toggle popular sort
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
  invitations.forEach((inv, idx) => {
    const id       = inv._id || inv.id;
    const price    = inv.price ? `<span class="price-tag">${Number(inv.price).toLocaleString()} DA</span>` : '';
    const badge    = `<span class="pkg-badge ${PKG_BADGE[inv.package]||''}">${inv.package||'Basic'}</span>`;
    const isFav    = favorites.includes(id);
    const popular  = inv.order_count > 0 ? `<span class="popular-badge">🔥 ${inv.order_count} orders</span>` : '';
    const card     = document.createElement('div');
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
    box.innerHTML  = `<div class="price-box">💰 Price: <strong>${Number(price).toLocaleString()} DA</strong></div>`;
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Feature #4 — Lightbox
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
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'ArrowRight') lightboxNav(1);
  if (e.key === 'ArrowLeft')  lightboxNav(-1);
  if (e.key === 'Escape')     closeLightbox();
});

// ═══════════════════════════════════════════════════════════════════
//  Feature #3 — Favorites
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
  const list  = document.getElementById('favList');
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
//  Feature #15 — Sample preview
// ═══════════════════════════════════════════════════════════════════
async function openSampleModal(invId) {
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
  document.getElementById('priceSummary').style.display = 'none';
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

  if (!invId||!fn||!ln||!ph||!wd) { alert('Please fill in all required fields'); return; }

  try {
    const r = await fetch('/api/requests', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ invitation_id:invId, invitation_name:invName, first_name:fn, last_name:ln, phone_number:ph, wedding_date:wd, notes:nt, price })
    });
    const d = await r.json();
    if (r.ok) {
      closeRequestModal();
      // Feature #5: show tracking code
      lastTrackingCode = d.tracking_id || '';
      if (d.tracking_id) {
        document.getElementById('trackingInfo').style.display = 'block';
        document.getElementById('trackingCode').textContent = d.tracking_id;
      }
      document.getElementById('successModal').classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(closeSuccessModal, 8000);
      loadAnalyticsBanner();
      loadInvitations(); // refresh order counts
    } else { alert('Error: ' + d.error); }
  } catch { alert('Error submitting request'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Feature #5 — Order Tracker (public)
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
  if (!code) { alert('Enter a tracking code'); return; }
  const resultEl = document.getElementById('trackResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<p style="color:#94a3b8">Searching...</p>';
  try {
    const r = await fetch(`/api/track/${code}`);
    if (!r.ok) {
      resultEl.innerHTML = '<p style="color:#ef4444">❌ Order not found. Check the code and try again.</p>';
      return;
    }
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
  } catch {
    resultEl.innerHTML = '<p style="color:#ef4444">Error checking order. Try again.</p>';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Reviews (Feature 4 original)
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
    s.addEventListener('click',     () => { selectedRating = +s.dataset.v; highlightStars(selectedRating); document.getElementById('reviewRating').value = selectedRating; });
  });
  document.getElementById('starPicker').addEventListener('mouseleave', () => highlightStars(selectedRating));
}

function highlightStars(n) {
  document.querySelectorAll('#starPicker .star').forEach(s => s.classList.toggle('active', +s.dataset.v <= n));
}

function openReviewModal()  { document.getElementById('reviewModal').classList.add('active'); document.body.style.overflow='hidden'; }
function closeReviewModal() { document.getElementById('reviewModal').classList.remove('active'); document.getElementById('reviewForm').reset(); selectedRating=0; highlightStars(0); document.body.style.overflow='auto'; }

async function submitReview(e) {
  e.preventDefault();
  const name   = document.getElementById('reviewName').value;
  const tplSel = document.getElementById('reviewTemplate');
  const tplId  = tplSel.value;
  const tplNm  = tplSel.options[tplSel.selectedIndex]?.textContent;
  const rating = +document.getElementById('reviewRating').value;
  const comment= document.getElementById('reviewComment').value;
  if (!name||!rating) { alert('Please provide name and rating'); return; }
  try {
    const r = await fetch('/api/reviews', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ invitation_id:tplId||null, invitation_name:tplNm||'', client_name:name, rating, comment })
    });
    if (r.ok) { closeReviewModal(); alert('Thank you for your review! It will appear after approval.'); }
  } catch { alert('Error submitting review'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Admin
// ═══════════════════════════════════════════════════════════════════
function openAdminPanel() { document.getElementById('adminModal').classList.add('active'); document.body.style.overflow='hidden'; }
function closeAdminPanel() { document.getElementById('adminModal').classList.remove('active'); document.body.style.overflow='auto'; adminKey=null; }

async function loginAdmin() {
  const key = document.getElementById('adminKey').value.trim();
  if (!key) { alert('Enter admin key'); return; }
  try {
    const r = await fetch(`/api/admin/requests?key=${encodeURIComponent(key)}`);
    if (r.ok) {
      adminKey = key;
      document.getElementById('adminLogin').style.display     = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
      loadAdminRequests();
    } else { alert('Invalid admin key'); }
  } catch { alert('Connection error'); }
}

function logoutAdmin() {
  adminKey = null;
  document.getElementById('adminLogin').style.display     = 'block';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminKey').value = '';
}

// ── Tabs ──────────────────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.style.display='none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+name).style.display = 'block';
  btn.classList.add('active');
  if (name==='requests')  loadAdminRequests();
  if (name==='templates') loadAdminTemplates();
  if (name==='analytics') loadAdminAnalytics();
  if (name==='reviews')   loadAdminReviews();
  if (name==='calendar')  renderCalendar();
}

// ── Requests tab ──────────────────────────────────────────────────
function filterRequests(status, btn) {
  currentStatus = status;
  document.querySelectorAll('.status-filter .filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  selectedRequestIds.clear();
  updateBulkBar();
  renderRequests();
}

function renderRequests() {
  const list = currentStatus==='all' ? allRequests : allRequests.filter(r=>r.status===currentStatus);
  const el   = document.getElementById('requestsList');
  if (!list.length) { el.innerHTML='<p style="text-align:center;color:#475569">No requests</p>'; return; }
  const statusOpts = ['pending','in_progress','completed','archived'];
  el.innerHTML = list.map(req => {
    const id = req._id||req.id;
    const opts = statusOpts.map(s=>`<option value="${s}" ${req.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('');
    const isChecked = selectedRequestIds.has(id);
    const waLink = `https://wa.me/${req.phone_number.replace(/\D/g,'')}?text=${encodeURIComponent(`Hello ${req.first_name}! Your invitation "${req.invitation_name}" update:`)}`;
    return `
    <div class="request-item ${isChecked?'request-selected':''}">
      <div class="request-header">
        <!-- Feature #9: checkbox -->
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
      <!-- Feature #10: Admin notes -->
      <div class="admin-note-wrap">
        <textarea class="admin-note-input" id="anote-${id}" placeholder="Internal notes (not visible to client)...">${req.admin_notes||''}</textarea>
        <button class="small-btn" onclick="saveAdminNote('${id}')">💾 Save Note</button>
      </div>
      <div class="request-status">
        <select id="status-${id}">${opts}</select>
        <button onclick="updateRequestStatus('${id}')">Update</button>
        <!-- Feature #8: WhatsApp quick reply -->
        <a href="${waLink}" target="_blank" class="small-btn wa-btn">💬 WhatsApp</a>
        <button class="danger-btn" onclick="deleteRequest('${id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

// Feature #9: bulk select
function toggleBulkSelect(id, checked) {
  if (checked) selectedRequestIds.add(id);
  else selectedRequestIds.delete(id);
  updateBulkBar();
  // Update row highlight
  document.querySelectorAll('.request-item').forEach(el => {
    const cb = el.querySelector('.bulk-checkbox');
    if (cb) el.classList.toggle('request-selected', cb.checked);
  });
}

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  const n = selectedRequestIds.size;
  bar.style.display = n > 0 ? 'flex' : 'none';
  document.getElementById('bulkCount').textContent = `${n} selected`;
}

async function applyBulkStatus() {
  const status = document.getElementById('bulkStatusSel').value;
  const ids = [...selectedRequestIds];
  if (!ids.length) return;
  if (!confirm(`Set ${ids.length} requests to "${status}"?`)) return;
  try {
    const r = await fetch(`/api/admin/requests/bulk?key=${encodeURIComponent(adminKey)}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ids, status })
    });
    if (r.ok) { selectedRequestIds.clear(); updateBulkBar(); loadAdminRequests(); loadAnalyticsBanner(); }
    else alert('Bulk update failed');
  } catch { alert('Error'); }
}

function clearBulkSelection() {
  selectedRequestIds.clear();
  updateBulkBar();
  renderRequests();
}

// Feature #10: save admin note
async function saveAdminNote(id) {
  const note = document.getElementById(`anote-${id}`).value;
  try {
    const r = await fetch(`/api/admin/requests/${id}?key=${encodeURIComponent(adminKey)}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ admin_notes: note, status: allRequests.find(r=>(r._id||r.id)===id)?.status })
    });
    if (r.ok) {
      const btn = document.querySelector(`#anote-${id} + button`);
      if (btn) { btn.textContent = '✅ Saved'; setTimeout(()=>btn.textContent='💾 Save Note', 2000); }
      // Update local state
      const req = allRequests.find(r=>(r._id||r.id)===id);
      if (req) req.admin_notes = note;
    }
  } catch { alert('Error saving note'); }
}

async function loadAdminRequests() {
  try {
    const r = await fetch(`/api/admin/requests?key=${encodeURIComponent(adminKey)}`);
    allRequests = await r.json();
    renderRequests();
  } catch { alert('Error loading requests'); }
}

async function updateRequestStatus(id) {
  const status = document.getElementById(`status-${id}`).value;
  try {
    const r = await fetch(`/api/admin/requests/${id}?key=${encodeURIComponent(adminKey)}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ status, notify: true })
    });
    if (r.ok) { loadAdminRequests(); loadAnalyticsBanner(); }
    else alert('Error updating status');
  } catch { alert('Error'); }
}

async function deleteRequest(id) {
  if (!confirm('Delete this request?')) return;
  try {
    const r = await fetch(`/api/admin/requests/${id}?key=${encodeURIComponent(adminKey)}`, { method:'DELETE' });
    if (r.ok) { loadAdminRequests(); loadAnalyticsBanner(); }
  } catch { alert('Error'); }
}

async function exportCSV() {
  try {
    const r = await fetch(`/api/admin/requests/export/csv?key=${encodeURIComponent(adminKey)}`);
    const csv = await r.text();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:`requests-${new Date().toISOString().split('T')[0]}.csv` });
    a.click();
  } catch { alert('Error exporting'); }
}

// ── Templates tab ──────────────────────────────────────────────────
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
  } catch { alert('Error loading templates'); }
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
  document.getElementById('editTemplateId').value = id;
  document.getElementById('tplName').value    = t.name||'';
  document.getElementById('tplDesc').value    = t.description||'';
  document.getElementById('tplPrice').value   = t.price||0;
  document.getElementById('tplPackage').value = t.package||'Basic';
  document.getElementById('tplImageUrl').value= t.image_url||'';
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
      const ur = await fetch(`/api/admin/upload?key=${encodeURIComponent(adminKey)}`, { method:'POST', body:fd });
      const ud = await ur.json();
      if (ud.url) { imageUrl = ud.url; fileInput.value=''; }
      else { alert('Upload failed: '+ud.error); return; }
    } catch { alert('Upload error'); return; }
    finally { document.getElementById('uploadProgress').style.display='none'; }
  }

  const payload = {
    name:        document.getElementById('tplName').value,
    description: document.getElementById('tplDesc').value,
    price:       +document.getElementById('tplPrice').value||0,
    package:     document.getElementById('tplPackage').value,
    image_url:   imageUrl
  };
  if (!payload.name) { alert('Name is required'); return; }

  try {
    const url    = editId ? `/api/admin/invitations/${editId}` : '/api/admin/invitations';
    const method = editId ? 'PUT' : 'POST';
    const r = await fetch(`${url}?key=${encodeURIComponent(adminKey)}`, {
      method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if (r.ok) { closeAddTemplateForm(); loadAdminTemplates(); loadInvitations(); }
    else { const d=await r.json(); alert('Error: '+d.error); }
  } catch { alert('Error saving template'); }
}

async function deleteTemplate(id) {
  if (!confirm('Delete this template?')) return;
  try {
    const r = await fetch(`/api/admin/invitations/${id}?key=${encodeURIComponent(adminKey)}`, { method:'DELETE' });
    if (r.ok) { loadAdminTemplates(); loadInvitations(); }
  } catch { alert('Error'); }
}

// ── Analytics tab ─────────────────────────────────────────────────
async function loadAdminAnalytics() {
  try {
    const r = await fetch('/api/analytics/summary');
    const d = await r.json();

    document.getElementById('analyticsGrid').innerHTML = `
      <div class="analytics-card"><div class="analytics-num">${d.total||0}</div><div class="analytics-label">Total Requests</div></div>
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
    monthly.forEach((m,i)=>{
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

    const top = d.topTemplates||[];
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
  } catch(e) { console.error(e); }
}

// ── Feature #11: Calendar tab ─────────────────────────────────────
function calPrev() { calMonth--; if (calMonth < 0) { calMonth=11; calYear--; } renderCalendar(); }
function calNext() { calMonth++; if (calMonth > 11) { calMonth=0;  calYear++; } renderCalendar(); }

function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calTitle').textContent = `${monthNames[calMonth]} ${calYear}`;

  // Map requests to wedding date
  const dateMap = {};
  allRequests.forEach(req => {
    if (!req.wedding_date) return;
    const key = req.wedding_date; // YYYY-MM-DD
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(req);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const today = new Date();

  let html = '<div class="cal-weekdays">';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => html += `<div class="cal-wd">${d}</div>`);
  html += '</div><div class="cal-days">';

  // Empty cells before first day
  for (let i=0; i<firstDay; i++) html += '<div class="cal-day cal-empty"></div>';

  for (let d=1; d<=daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayReqs = dateMap[dateStr] || [];
    const isToday = today.getFullYear()===calYear && today.getMonth()===calMonth && today.getDate()===d;
    const dots = dayReqs.map(r=>`<span class="cal-dot dot-${r.status}" title="${r.first_name} ${r.last_name} — ${r.invitation_name}"></span>`).join('');
    html += `<div class="cal-day ${isToday?'cal-today':''} ${dayReqs.length?'cal-has-events':''}">
      <span class="cal-day-num">${d}</span>
      <div class="cal-dots">${dots}</div>
    </div>`;
  }
  html += '</div>';
  document.getElementById('calGrid').innerHTML = html;
}

// ── Reviews moderation tab ────────────────────────────────────────
async function loadAdminReviews() {
  try {
    const r  = await fetch(`/api/admin/reviews?key=${encodeURIComponent(adminKey)}`);
    const rv = await r.json();
    const el = document.getElementById('adminReviewsList');
    if (!rv.length) { el.innerHTML='<p style="text-align:center;color:#475569">No reviews yet</p>'; return; }
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
  } catch { alert('Error loading reviews'); }
}

async function moderateReview(id, approved) {
  try {
    const r = await fetch(`/api/admin/reviews/${id}?key=${encodeURIComponent(adminKey)}`, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({approved})
    });
    if (r.ok) { loadAdminReviews(); loadReviews(); }
  } catch { alert('Error'); }
}

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  try {
    const r = await fetch(`/api/admin/reviews/${id}?key=${encodeURIComponent(adminKey)}`, { method:'DELETE' });
    if (r.ok) { loadAdminReviews(); loadReviews(); }
  } catch { alert('Error'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Feature #17 — Lazy-load via IntersectionObserver
// ═══════════════════════════════════════════════════════════════════
function setupLazyLoad() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('img-loaded');
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });
  document.querySelectorAll('img[loading="lazy"]').forEach(img => observer.observe(img));
}

// ═══════════════════════════════════════════════════════════════════
//  Feature #20 — PWA / Service Worker
// ═══════════════════════════════════════════════════════════════════
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function setupPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
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

function dismissPWA() {
  document.getElementById('pwaInstallBanner').style.display = 'none';
}

// ── Close modals on backdrop click ───────────────────────────────
document.addEventListener('click', e => {
  if (e.target===document.getElementById('requestModal')) closeRequestModal();
  if (e.target===document.getElementById('successModal')) closeSuccessModal();
  if (e.target===document.getElementById('adminModal'))   closeAdminPanel();
  if (e.target===document.getElementById('reviewModal'))  closeReviewModal();
  if (e.target===document.getElementById('trackModal'))   closeTrackModal();
  if (e.target===document.getElementById('sampleModal'))  closeSampleModal();
});
