// Global variables
let allInvitations = [];
let adminKey = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadInvitations();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterInvitations(e.target.value);
    });
    document.getElementById('requestForm').addEventListener('submit', submitRequest);
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
async function loadInvitations() {
    try {
        const response = await fetch('/api/invitations');
        allInvitations = await response.json();
        renderGallery(allInvitations);
        populateInvitationSelect();
    } catch (error) {
        console.error('Error loading invitations:', error);
        document.getElementById('templateCount').textContent = 'Error loading templates';
    }
}

function renderGallery(invitations) {
    const galleryGrid   = document.getElementById('galleryGrid');
    const templateCount = document.getElementById('templateCount');
    galleryGrid.innerHTML = '';

    if (invitations.length === 0) {
        galleryGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#475569;">No invitations found</p>';
        templateCount.textContent = '0 templates available';
        return;
    }

    invitations.forEach(invitation => {
        // FIX: MongoDB returns _id, not id
        const id = invitation._id || invitation.id;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-image">
                <img src="${invitation.image_url}" alt="${invitation.name}" onerror="this.style.display='none'">
            </div>
            <div class="card-content">
                <h3 class="card-title">${invitation.name}</h3>
                <p class="card-description">${invitation.description}</p>
                <button class="card-button" onclick="openRequestModal('${id}')">Select</button>
            </div>
        `;
        galleryGrid.appendChild(card);
    });

    templateCount.textContent = `${invitations.length} ${invitations.length === 1 ? 'template' : 'templates'} available`;
}

function filterInvitations(query) {
    const filtered = allInvitations.filter(inv =>
        inv.name.toLowerCase().includes(query.toLowerCase()) ||
        inv.description.toLowerCase().includes(query.toLowerCase())
    );
    renderGallery(filtered);
}

function populateInvitationSelect() {
    const select = document.getElementById('invitationSelect');
    select.innerHTML = '<option value="">Choose a template</option>';
    allInvitations.forEach(inv => {
        // FIX: use _id (MongoDB ObjectId string)
        const id = inv._id || inv.id;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = inv.name;
        select.appendChild(option);
    });
}

// ─── Request modal ────────────────────────────────────────────────────────────
function openRequestModal(invitationId) {
    document.getElementById('invitationSelect').value = invitationId;
    document.getElementById('requestModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRequestModal() {
    document.getElementById('requestModal').classList.remove('active');
    document.getElementById('requestForm').reset();
    document.body.style.overflow = 'auto';
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

async function submitRequest(event) {
    event.preventDefault();

    const invitationId   = document.getElementById('invitationSelect').value;
    const invitationName = document.querySelector(`#invitationSelect option[value="${invitationId}"]`).textContent;
    const firstName      = document.getElementById('firstName').value;
    const lastName       = document.getElementById('lastName').value;
    const phoneNumber    = document.getElementById('phoneNumber').value;
    const weddingDate    = document.getElementById('weddingDate').value;
    const notes          = document.getElementById('notes').value;

    if (!invitationId || !firstName || !lastName || !phoneNumber || !weddingDate) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invitation_id:   invitationId,
                invitation_name: invitationName,
                first_name:      firstName,
                last_name:       lastName,
                phone_number:    phoneNumber,
                wedding_date:    weddingDate,
                notes
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeRequestModal();
            document.getElementById('successModal').classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(closeSuccessModal, 3000);
        } else {
            alert('Error submitting request: ' + data.error);
        }
    } catch (error) {
        console.error('Error submitting request:', error);
        alert('Error submitting request');
    }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
function openAdminPanel() {
    document.getElementById('adminModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
    document.getElementById('adminModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    adminKey = null;
}

async function loginAdmin() {
    const key = document.getElementById('adminKey').value.trim();
    if (!key) { alert('Please enter admin key'); return; }

    try {
        const response = await fetch(`/api/admin/requests?key=${encodeURIComponent(key)}`);
        if (response.ok) {
            adminKey = key;
            document.getElementById('adminLogin').style.display     = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadAdminRequests();
        } else {
            alert('Invalid admin key – make sure it matches the ADMIN_KEY environment variable on Render.');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error connecting to server');
    }
}

async function loadAdminRequests() {
    try {
        const response = await fetch(`/api/admin/requests?key=${encodeURIComponent(adminKey)}`);
        const requests = await response.json();
        const requestsList = document.getElementById('requestsList');
        requestsList.innerHTML = '';

        if (!Array.isArray(requests) || requests.length === 0) {
            requestsList.innerHTML = '<p style="text-align:center;color:#475569;">No requests yet</p>';
            return;
        }

        requests.forEach(request => {
            // FIX: use _id for all IDs
            const id = request._id || request.id;
            const item = document.createElement('div');
            item.className = 'request-item';

            // FIX: build <select> with correct selected option instead of broken value= attribute
            const statusOptions = ['pending', 'in_progress', 'completed', 'archived'];
            const statusSelect = statusOptions.map(s =>
                `<option value="${s}" ${request.status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
            ).join('');

            item.innerHTML = `
                <h3>${request.first_name} ${request.last_name}</h3>
                <div class="request-info">
                    <div><strong>Phone:</strong> ${request.phone_number}</div>
                    <div><strong>Wedding Date:</strong> ${request.wedding_date}</div>
                    <div><strong>Template:</strong> ${request.invitation_name}</div>
                    <div><strong>Submitted:</strong> ${new Date(request.created_at).toLocaleDateString()}</div>
                    ${request.notes ? `<div style="grid-column:1/-1"><strong>Notes:</strong> ${request.notes}</div>` : ''}
                </div>
                <div class="request-status">
                    <select id="status-${id}">${statusSelect}</select>
                    <button onclick="updateRequestStatus('${id}')">Update</button>
                    <button style="background:#ef4444;" onclick="deleteRequest('${id}')">Delete</button>
                </div>
            `;
            requestsList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading requests:', error);
        alert('Error loading requests');
    }
}

async function updateRequestStatus(requestId) {
    const status = document.getElementById(`status-${requestId}`).value;
    try {
        const response = await fetch(`/api/admin/requests/${requestId}?key=${encodeURIComponent(adminKey)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            loadAdminRequests();
        } else {
            alert('Error updating status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status');
    }
}

async function deleteRequest(requestId) {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
        const response = await fetch(`/api/admin/requests/${requestId}?key=${encodeURIComponent(adminKey)}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            loadAdminRequests();
        } else {
            alert('Error deleting request');
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        alert('Error deleting request');
    }
}

async function exportCSV() {
    try {
        const response = await fetch(`/api/admin/requests/export/csv?key=${encodeURIComponent(adminKey)}`);
        const csv  = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `requests-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting CSV');
    }
}

function logoutAdmin() {
    adminKey = null;
    document.getElementById('adminLogin').style.display     = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminKey').value               = '';
    document.getElementById('requestsList').innerHTML       = '';
}

// Close modals when clicking the backdrop
document.addEventListener('click', (e) => {
    if (e.target === document.getElementById('requestModal')) closeRequestModal();
    if (e.target === document.getElementById('successModal')) closeSuccessModal();
    if (e.target === document.getElementById('adminModal'))   closeAdminPanel();
});
