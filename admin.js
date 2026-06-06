let adminKey   = null;
let allReqs    = [];
let currentStatus = 'all';

// ── Login ─────────────────────────────────────────────────────────
async function loginAdmin(){
  const key = document.getElementById('adminKeyInput').value.trim();
  if(!key) return;
  try{
    const r = await fetch(`/api/admin/requests?key=${encodeURIComponent(key)}`);
    if(r.ok){
      adminKey = key;
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboard').style.display   = 'flex';
      loadRequests();
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  } catch{ alert('Connection error'); }
}

function logoutAdmin(){
  adminKey = null;
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display   = 'none';
  document.getElementById('adminKeyInput').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// ── Tabs ──────────────────────────────────────────────────────────
function switchTab(name, btn){
  document.querySelectorAll('.tab-pane').forEach(p=>p.style.display='none');
  document.querySelectorAll('.side-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+name).style.display='block';
  btn.classList.add('active');
  if(name==='requests')  loadRequests();
  if(name==='templates') loadTemplates();
  if(name==='analytics') loadAnalytics();
  if(name==='reviews')   loadReviews();
}

// ── Requests ──────────────────────────────────────────────────────
function filterRequests(s,btn){
  currentStatus=s;
  document.querySelectorAll('.status-filter .chip').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderRequests();
}

async function loadRequests(){
  try{
    allReqs = await (await fetch(`/api/admin/requests?key=${encodeURIComponent(adminKey)}`)).json();
    renderRequests();
  } catch{ alert('Error loading requests'); }
}

function renderRequests(){
  const list = currentStatus==='all' ? allReqs : allReqs.filter(r=>r.status===currentStatus);
  const el   = document.getElementById('requestsList');
  if(!list.length){ el.innerHTML='<div class="empty-state">No requests found</div>'; return; }
  const opts = ['pending','in_progress','completed','archived'];
  el.innerHTML = list.map(req=>{
    const id = req._id||req.id;
    const selectOpts = opts.map(s=>`<option value="${s}" ${req.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('');
    return `
    <div class="req-card">
      <div class="req-card-header">
        <div>
          <span class="req-name">${req.first_name} ${req.last_name}</span>
          ${req.tracking_code?`<span class="tracking-tag">🔖 ${req.tracking_code}</span>`:''}
        </div>
        <span class="status-chip status-${req.status}">${req.status.replace('_',' ')}</span>
      </div>
      <div class="req-details">
        <span>📱 ${req.phone_number}</span>
        <span>💍 ${req.wedding_date}</span>
        <span>🎨 ${req.invitation_name}</span>
        <span>💰 ${(req.price||0).toLocaleString()} DA</span>
        <span>📅 ${new Date(req.created_at).toLocaleDateString()}</span>
        ${req.notes?`<span style="grid-column:1/-1">📝 ${req.notes}</span>`:''}
      </div>
      <div class="req-actions">
        <select id="status-${id}">${selectOpts}</select>
        <input type="text" id="note-${id}" placeholder="Add a note..." value="${req.status_note||''}">
        <button class="btn-primary btn-sm-admin" onclick="updateRequest('${id}')">Update</button>
        <button class="btn-danger btn-sm-admin" onclick="deleteRequest('${id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

async function updateRequest(id){
  const status     = document.getElementById(`status-${id}`).value;
  const status_note= document.getElementById(`note-${id}`).value;
  try{
    const r = await fetch(`/api/admin/requests/${id}?key=${encodeURIComponent(adminKey)}`,{
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status, status_note, notify:true })
    });
    if(r.ok) loadRequests();
    else alert('Error updating');
  } catch{ alert('Error'); }
}

async function deleteRequest(id){
  if(!confirm('Delete this request?')) return;
  try{
    await fetch(`/api/admin/requests/${id}?key=${encodeURIComponent(adminKey)}`,{ method:'DELETE' });
    loadRequests();
  } catch{ alert('Error'); }
}

async function exportCSV(){
  try{
    const r   = await fetch(`/api/admin/requests/export/csv?key=${encodeURIComponent(adminKey)}`);
    const csv = await r.text();
    const a   = Object.assign(document.createElement('a'),{
      href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
      download:`requests-${new Date().toISOString().split('T')[0]}.csv`
    });
    a.click();
  } catch{ alert('Error exporting'); }
}

// ── Templates ─────────────────────────────────────────────────────
async function loadTemplates(){
  try{
    const tmpl = await (await fetch('/api/invitations')).json();
    document.getElementById('templatesList').innerHTML = tmpl.map(t=>{
      const id=t._id||t.id;
      return `
      <div class="tmpl-card">
        <img src="${t.image_url||''}" onerror="this.style.display='none'" style="width:100px;height:72px;object-fit:cover;border-radius:8px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div class="tmpl-name">${t.name}</div>
          <div style="color:#64748b;font-size:.875rem">${t.description||''}</div>
          <div style="color:#ec4899;font-weight:700;margin-top:.25rem">${(t.price||0).toLocaleString()} DA</div>
        </div>
        <div class="tmpl-actions">
          <button class="btn-ghost btn-sm-admin" onclick="editTemplate('${id}')">✏️ Edit</button>
          <button class="btn-danger btn-sm-admin" onclick="deleteTemplate('${id}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
  } catch{ alert('Error loading templates'); }
}

function openAddTemplateForm(){
  document.getElementById('editTemplateId').value='';
  ['tplName','tplDesc','tplPrice','tplImageUrl'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('formTitle').textContent='Add Template';
  document.getElementById('addTemplateForm').style.display='block';
}
function closeAddTemplateForm(){ document.getElementById('addTemplateForm').style.display='none'; }

async function editTemplate(id){
  try{
    const t = await (await fetch(`/api/invitations/${id}`)).json();
    document.getElementById('editTemplateId').value = id;
    document.getElementById('tplName').value    = t.name||'';
    document.getElementById('tplDesc').value    = t.description||'';
    document.getElementById('tplPrice').value   = t.price||0;
    document.getElementById('tplImageUrl').value= t.image_url||'';
    document.getElementById('formTitle').textContent='Edit Template';
    document.getElementById('addTemplateForm').style.display='block';
  } catch{ alert('Error loading template'); }
}

async function saveTemplate(){
  let imageUrl = document.getElementById('tplImageUrl').value;
  const file   = document.getElementById('tplImageFile').files[0];
  if(file){
    document.getElementById('uploadProgress').style.display='block';
    try{
      const fd = new FormData(); fd.append('image',file);
      const ur = await fetch(`/api/admin/upload?key=${encodeURIComponent(adminKey)}`,{ method:'POST', body:fd });
      const ud = await ur.json();
      if(ud.url){ imageUrl=ud.url; document.getElementById('tplImageFile').value=''; }
      else { alert('Upload failed: '+ud.error); return; }
    } catch{ alert('Upload error'); return; }
    finally{ document.getElementById('uploadProgress').style.display='none'; }
  }
  const editId  = document.getElementById('editTemplateId').value;
  const payload = { name:document.getElementById('tplName').value, description:document.getElementById('tplDesc').value, price:+document.getElementById('tplPrice').value||0, image_url:imageUrl };
  if(!payload.name){ alert('Name is required'); return; }
  try{
    const r = await fetch(`${editId?`/api/admin/invitations/${editId}`:'/api/admin/invitations'}?key=${encodeURIComponent(adminKey)}`,{
      method: editId?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if(r.ok){ closeAddTemplateForm(); loadTemplates(); }
    else { const d=await r.json(); alert('Error: '+d.error); }
  } catch{ alert('Error saving'); }
}

async function deleteTemplate(id){
  if(!confirm('Delete this template?')) return;
  try{
    await fetch(`/api/admin/invitations/${id}?key=${encodeURIComponent(adminKey)}`,{ method:'DELETE' });
    loadTemplates();
  } catch{ alert('Error'); }
}

// ── Analytics ─────────────────────────────────────────────────────
async function loadAnalytics(){
  try{
    const d = await (await fetch('/api/analytics/summary')).json();
    document.getElementById('analyticsGrid').innerHTML=`
      <div class="stat-card"><div class="stat-num">${d.total||0}</div><div class="stat-lbl">Total Requests</div></div>
      <div class="stat-card yellow"><div class="stat-num">${d.pending||0}</div><div class="stat-lbl">Pending</div></div>
      <div class="stat-card blue"><div class="stat-num">${d.inProgress||0}</div><div class="stat-lbl">In Progress</div></div>
      <div class="stat-card green"><div class="stat-num">${d.completed||0}</div><div class="stat-lbl">Completed</div></div>
      <div class="stat-card pink"><div class="stat-num">${(d.revenue||0).toLocaleString()} DA</div><div class="stat-lbl">Revenue</div></div>`;

    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const canvas=document.getElementById('monthlyChart');
    const ctx=canvas.getContext('2d');
    canvas.width=canvas.offsetWidth||600;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const monthly=d.monthly||[];
    if(monthly.length){
      const max=Math.max(...monthly.map(m=>m.count),1);
      const bw=(canvas.width/monthly.length)-8;
      monthly.forEach((m,i)=>{
        const h=(m.count/max)*(canvas.height-40);
        const x=i*(bw+8)+4, y=canvas.height-h-30;
        ctx.fillStyle='#ec4899';
        ctx.beginPath(); ctx.roundRect(x,y,bw,h,4); ctx.fill();
        ctx.fillStyle='#475569'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText(months[(m._id.month-1)%12],x+bw/2,canvas.height-8);
        ctx.fillStyle='#0f172a'; ctx.fillText(m.count,x+bw/2,y-4);
      });
    }

    const top=d.topTemplates||[];
    const maxT=Math.max(...top.map(t=>t.count),1);
    document.getElementById('topTemplatesChart').innerHTML=top.map(t=>`
      <div style="margin-bottom:.75rem">
        <div style="display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.25rem">
          <span>${t._id}</span><strong style="color:#ec4899">${t.count}</strong>
        </div>
        <div style="background:#f1f5f9;border-radius:999px;height:8px">
          <div style="background:linear-gradient(to right,#ec4899,#a855f7);height:8px;border-radius:999px;width:${(t.count/maxT*100).toFixed(1)}%"></div>
        </div>
      </div>`).join('');
  } catch(e){ console.error(e); }
}

// ── Reviews ───────────────────────────────────────────────────────
async function loadReviews(){
  try{
    const rv = await (await fetch(`/api/admin/reviews?key=${encodeURIComponent(adminKey)}`)).json();
    const el = document.getElementById('adminReviewsList');
    if(!rv.length){ el.innerHTML='<div class="empty-state">No reviews yet</div>'; return; }
    el.innerHTML=rv.map(v=>{
      const id=v._id||v.id;
      return `
      <div class="review-admin-card">
        <div class="review-admin-header">
          <div>
            <strong>${v.client_name}</strong>
            <span style="color:#f59e0b;margin-left:.5rem">${'★'.repeat(v.rating)}</span>
            ${v.invitation_name?`<span style="color:#94a3b8;font-size:.8rem"> · ${v.invitation_name}</span>`:''}
          </div>
          <span style="font-size:.75rem;color:#94a3b8">${new Date(v.created_at).toLocaleDateString()} · ${v.approved?'<span style="color:#22c55e">Approved</span>':'<span style="color:#f59e0b">Pending</span>'}</span>
        </div>
        <p style="color:#475569;font-size:.9rem;margin:.5rem 0">${v.comment||''}</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          ${v.approved
            ?`<button class="btn-ghost btn-sm-admin" onclick="moderateReview('${id}',false)">Hide</button>`
            :`<button class="btn-primary btn-sm-admin" onclick="moderateReview('${id}',true)">✅ Approve</button>`}
          <button class="btn-danger btn-sm-admin" onclick="deleteReview('${id}')">🗑️ Delete</button>
        </div>
      </div>`;
    }).join('');
  } catch{ alert('Error loading reviews'); }
}

async function moderateReview(id,approved){
  try{
    await fetch(`/api/admin/reviews/${id}?key=${encodeURIComponent(adminKey)}`,{
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({approved})
    });
    loadReviews();
  } catch{ alert('Error'); }
}
async function deleteReview(id){
  if(!confirm('Delete review?')) return;
  try{ await fetch(`/api/admin/reviews/${id}?key=${encodeURIComponent(adminKey)}`,{method:'DELETE'}); loadReviews(); }
  catch{ alert('Error'); }
}
