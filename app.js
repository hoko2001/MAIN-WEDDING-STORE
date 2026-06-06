// ═══════════════════════════════════════════════════════════════════
//  i18n
// ═══════════════════════════════════════════════════════════════════
const T = {
  en:{nav_gallery:'Gallery',nav_reviews:'Reviews',hero_badge:'BEAUTIFUL INVITATIONS',hero_title:'Find Your Perfect',hero_subtitle:'Browse our collection of stunning wedding invitation templates.',search_placeholder:'Search invitations...',gallery_title:'All Templates',reviews_title:'⭐ Client Reviews',reviews_sub:'What our happy couples say',leave_review:'✍️ Leave a Review',modal_title:'Request This',form_first:'First Name',form_last:'Last Name',form_phone:'Phone Number',form_date:'Wedding Date',form_notes:'Special Instructions',form_submit:'Submit Request',review_modal_title:'Leave a Review',review_name:'Your Name',review_template:'Template Used',review_rating:'Rating',review_comment:'Comment',review_submit:'Submit Review',success_title:'Request Submitted!',success_msg:"Thank you! We'll contact you soon.",close:'Close',fav_title:'My Favorites'},
  fr:{nav_gallery:'Galerie',nav_reviews:'Avis',hero_badge:'BELLES INVITATIONS',hero_title:'Trouvez Votre Invitation Parfaite',hero_subtitle:"Parcourez notre collection de magnifiques modèles d'invitations.",search_placeholder:'Rechercher...',gallery_title:'Tous les Modèles',reviews_title:'⭐ Avis Clients',reviews_sub:'Ce que disent nos couples',leave_review:'✍️ Laisser un Avis',modal_title:'Demander cette',form_first:'Prénom',form_last:'Nom',form_phone:'Téléphone',form_date:'Date du Mariage',form_notes:'Instructions Spéciales',form_submit:'Envoyer la Demande',review_modal_title:'Laisser un Avis',review_name:'Votre Nom',review_template:'Modèle Utilisé',review_rating:'Note',review_comment:'Commentaire',review_submit:'Envoyer',success_title:'Demande Envoyée !',success_msg:'Merci ! Nous vous contacterons bientôt.',close:'Fermer',fav_title:'Mes Favoris'},
  ar:{nav_gallery:'المعرض',nav_reviews:'التقييمات',hero_badge:'دعوات رائعة',hero_title:'اعثر على دعوتك المثالية',hero_subtitle:'تصفح مجموعتنا من قوالب دعوات الزفاف.',search_placeholder:'ابحث...',gallery_title:'جميع القوالب',reviews_title:'⭐ آراء العملاء',reviews_sub:'ما يقوله أزواجنا',leave_review:'✍️ اترك تقييماً',modal_title:'اطلب هذه',form_first:'الاسم الأول',form_last:'اللقب',form_phone:'رقم الهاتف',form_date:'تاريخ الزفاف',form_notes:'تعليمات خاصة',form_submit:'إرسال الطلب',review_modal_title:'اترك تقييماً',review_name:'اسمك',review_template:'القالب المستخدم',review_rating:'التقييم',review_comment:'تعليق',review_submit:'إرسال',success_title:'تم إرسال الطلب!',success_msg:'شكراً! سنتصل بك قريباً.',close:'إغلاق',fav_title:'المفضلة'}
};
let lang = localStorage.getItem('lang')||'en';
function setLang(l){
  lang=l; localStorage.setItem('lang',l);
  const t=T[l]||T.en;
  document.querySelectorAll('[data-i18n]').forEach(el=>{ if(t[el.dataset.i18n]) el.textContent=t[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ if(t[el.dataset.i18nPlaceholder]) el.placeholder=t[el.dataset.i18nPlaceholder]; });
  document.documentElement.dir  = l==='ar'?'rtl':'ltr';
  document.documentElement.lang = l;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active', b.textContent===l.toUpperCase()));
}

// ═══════════════════════════════════════════════════════════════════
//  Dark mode
// ═══════════════════════════════════════════════════════════════════
function toggleDark(){
  const on = document.body.classList.toggle('dark');
  localStorage.setItem('dark', on?'1':'0');
  document.getElementById('darkToggle').textContent = on?'☀️':'🌙';
}
function initDark(){
  if(localStorage.getItem('dark')==='1'){
    document.body.classList.add('dark');
    document.getElementById('darkToggle').textContent='☀️';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Favorites (localStorage)
// ═══════════════════════════════════════════════════════════════════
function getFavs(){ try{ return JSON.parse(localStorage.getItem('favs')||'[]'); }catch{ return []; } }
function saveFavs(f){ localStorage.setItem('favs', JSON.stringify(f)); }
function isFav(id){ return getFavs().some(f=>f.id===id); }

function toggleFav(id, ev){
  ev.stopPropagation();
  const inv = allInvitations.find(i=>(i._id||i.id)===id);
  if(!inv) return;
  let favs = getFavs();
  if(isFav(id)){
    favs = favs.filter(f=>f.id!==id);
  } else {
    favs.push({ id, name:inv.name, image_url:inv.image_url, price:inv.price||0 });
  }
  saveFavs(favs);
  updateFavBtn();
  // re-render the heart on the card
  const btn = document.querySelector(`[data-fav-id="${id}"]`);
  if(btn) btn.textContent = isFav(id)?'❤️':'🤍';
}

function updateFavBtn(){
  const c = getFavs().length;
  const btn = document.getElementById('favBtn');
  document.getElementById('favCount').textContent = c;
  btn.style.display = c>0?'flex':'none';
}

function openFavDrawer(){
  const favs = getFavs();
  const list = document.getElementById('favList');
  if(!favs.length){ list.innerHTML='<p style="text-align:center;padding:2rem;color:#94a3b8">No favorites yet</p>'; }
  else {
    list.innerHTML = favs.map(f=>`
      <div class="fav-item">
        <img src="${f.image_url||''}" onerror="this.style.display='none'" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.95rem">${f.name}</div>
          <div style="color:var(--primary);font-weight:700">${Number(f.price).toLocaleString()} DA</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.4rem;flex-shrink:0">
          <button class="btn-sm" onclick="openRequestModal('${f.id}');closeFavDrawer()">Select</button>
          <button class="btn-sm btn-ghost-sm" onclick="toggleFav('${f.id}',event);renderFavDrawer()">Remove</button>
        </div>
      </div>`).join('');
  }
  document.getElementById('favDrawer').classList.add('open');
  document.getElementById('favOverlay').classList.add('open');
}

function renderFavDrawer(){ openFavDrawer(); updateFavBtn(); }
function closeFavDrawer(){
  document.getElementById('favDrawer').classList.remove('open');
  document.getElementById('favOverlay').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════════
//  State
// ═══════════════════════════════════════════════════════════════════
let allInvitations = [];
let selectedRating = 0;
let currentInvId   = null;

// ═══════════════════════════════════════════════════════════════════
//  Init
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  initDark();
  setLang(lang);
  loadInvitations();
  loadReviews();
  setupStarPicker();
  document.getElementById('requestForm').addEventListener('submit', submitRequest);
  document.getElementById('reviewForm').addEventListener('submit', submitReview);
  updateFavBtn();
});

// ═══════════════════════════════════════════════════════════════════
//  Gallery
// ═══════════════════════════════════════════════════════════════════
async function loadInvitations(){
  try{
    const r = await fetch('/api/invitations');
    allInvitations = await r.json();
    renderGallery(allInvitations);
    populateReviewTemplateSelect();
  } catch(e){ document.getElementById('templateCount').textContent='Error loading templates'; }
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('searchInput').addEventListener('input', e=>{
    const q = e.target.value.toLowerCase();
    renderGallery(q ? allInvitations.filter(i=>i.name.toLowerCase().includes(q)||i.description.toLowerCase().includes(q)) : allInvitations);
  });
});

function renderGallery(list){
  const grid = document.getElementById('galleryGrid');
  document.getElementById('templateCount').textContent = `${list.length} template${list.length===1?'':'s'} available`;
  if(!list.length){ grid.innerHTML='<p style="grid-column:1/-1;text-align:center;color:#94a3b8">No templates found</p>'; return; }
  grid.innerHTML = list.map(inv=>{
    const id  = inv._id||inv.id;
    const fav = isFav(id);
    return `
    <div class="card">
      <div class="card-image">
        <img src="${inv.image_url||''}" alt="${inv.name}" onerror="this.style.display='none'">
        <button class="fav-heart" data-fav-id="${id}" onclick="toggleFav('${id}',event)" title="Add to favorites">${fav?'❤️':'🤍'}</button>
      </div>
      <div class="card-content">
        <h3 class="card-title">${inv.name}</h3>
        <p class="card-desc">${inv.description||''}</p>
        <div class="card-footer">
          <span class="price-tag">${Number(inv.price||0).toLocaleString()} DA</span>
          <button class="btn-primary btn-sm-card" onclick="openRequestModal('${id}')">Select</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function populateReviewTemplateSelect(){
  const sel = document.getElementById('reviewTemplate');
  sel.innerHTML = '<option value="">Select template...</option>';
  allInvitations.forEach(inv=>{
    const o = document.createElement('option');
    o.value = inv._id||inv.id; o.textContent = inv.name;
    sel.appendChild(o);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Request modal
// ═══════════════════════════════════════════════════════════════════
function openRequestModal(id){
  currentInvId = id;
  const inv = allInvitations.find(i=>(i._id||i.id)===id);
  if(inv){
    document.getElementById('selectedTemplateInfo').innerHTML = `
      <img src="${inv.image_url||''}" onerror="this.style.display='none'" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0">
      <div><strong>${inv.name}</strong><br><span style="color:var(--primary);font-weight:700">${Number(inv.price||0).toLocaleString()} DA</span></div>`;
  }
  openModal('requestModal');
}

function closeRequestModal(){
  closeModal('requestModal');
  document.getElementById('requestForm').reset();
  document.getElementById('selectedTemplateInfo').innerHTML='';
}

async function submitRequest(e){
  e.preventDefault();
  const inv  = allInvitations.find(i=>(i._id||i.id)===currentInvId);
  const body = {
    invitation_id:   currentInvId,
    invitation_name: inv?.name||'',
    price:           inv?.price||0,
    first_name:  document.getElementById('firstName').value,
    last_name:   document.getElementById('lastName').value,
    phone_number:document.getElementById('phoneNumber').value,
    wedding_date:document.getElementById('weddingDate').value,
    notes:       document.getElementById('notes').value
  };
  try{
    const r = await fetch('/api/requests',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await r.json();
    if(r.ok){
      closeRequestModal();
      // Show tracking code in success modal
      document.getElementById('trackingDisplay').innerHTML = d.tracking_code
        ? `<div class="tracking-box">🔖 Your order code: <strong>${d.tracking_code}</strong><br><small>Save this to track your order</small></div>`
        : '';
      openModal('successModal');
      setTimeout(()=>closeModal('successModal'), 6000);
    } else { alert('Error: '+d.error); }
  } catch{ alert('Error submitting request'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Reviews
// ═══════════════════════════════════════════════════════════════════
async function loadReviews(){
  try{
    const reviews = await (await fetch('/api/reviews')).json();
    const grid = document.getElementById('reviewsGrid');
    if(!reviews.length){ grid.innerHTML='<p style="text-align:center;color:#94a3b8;padding:2rem">No reviews yet — be the first!</p>'; return; }
    grid.innerHTML = reviews.map(rv=>`
      <div class="review-card">
        <div class="review-stars">${'★'.repeat(rv.rating)}${'☆'.repeat(5-rv.rating)}</div>
        <p class="review-comment">"${rv.comment||''}"</p>
        <div class="review-author">— ${rv.client_name}${rv.invitation_name?' · '+rv.invitation_name:''}</div>
      </div>`).join('');
  } catch{}
}

function setupStarPicker(){
  document.querySelectorAll('#starPicker .star').forEach(s=>{
    s.addEventListener('mouseover',()=>highlightStars(+s.dataset.v));
    s.addEventListener('click',()=>{ selectedRating=+s.dataset.v; highlightStars(selectedRating); document.getElementById('reviewRating').value=selectedRating; });
  });
  document.getElementById('starPicker').addEventListener('mouseleave',()=>highlightStars(selectedRating));
}
function highlightStars(n){ document.querySelectorAll('#starPicker .star').forEach(s=>s.classList.toggle('active',+s.dataset.v<=n)); }
function openReviewModal(){ openModal('reviewModal'); }
function closeReviewModal(){ closeModal('reviewModal'); document.getElementById('reviewForm').reset(); selectedRating=0; highlightStars(0); }

async function submitReview(e){
  e.preventDefault();
  const name   = document.getElementById('reviewName').value;
  const rating = +document.getElementById('reviewRating').value;
  if(!name||!rating){ alert('Please provide your name and a rating'); return; }
  const tplSel = document.getElementById('reviewTemplate');
  try{
    const r = await fetch('/api/reviews',{ method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ invitation_id:tplSel.value||null, invitation_name:tplSel.options[tplSel.selectedIndex]?.textContent||'', client_name:name, rating, comment:document.getElementById('reviewComment').value }) });
    if(r.ok){ closeReviewModal(); alert('Thank you! Your review will appear after approval.'); }
  } catch{ alert('Error submitting review'); }
}

// ═══════════════════════════════════════════════════════════════════
//  Modal helpers
// ═══════════════════════════════════════════════════════════════════
function openModal(id){ document.getElementById(id).classList.add('active'); document.body.style.overflow='hidden'; }
function closeModal(id){ document.getElementById(id).classList.remove('active'); document.body.style.overflow='auto'; }
function closeSuccessModal(){ closeModal('successModal'); }

document.addEventListener('click', e=>{
  ['requestModal','successModal','reviewModal'].forEach(id=>{ if(e.target===document.getElementById(id)) closeModal(id); });
});
