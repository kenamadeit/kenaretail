/* ======================================
   ADMIN DASHBOARD - LOGIC
   Client Management & Tracking
   ====================================== */

let currentAdminUser = null;
let allClients = [];

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
});

/**
 * Check if user is logged in as admin
 */
function checkAdminAccess() {
    const currentUser = getCurrentUser();
    
    if (currentUser && currentUser.isAdmin) {
        // User is admin
        showAdminDashboard();
    } else {
        // Show login form
        document.getElementById('adminLoginContainer').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }
}

/**
 * Show admin dashboard
 */
function showAdminDashboard() {
    currentAdminUser = getCurrentUser();
    document.getElementById('adminLoginContainer').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('adminWelcome').textContent = `Welcome, ${currentAdminUser.fullname}!`;
    
    loadAndDisplayClients();
    updateStatistics();
}

/**
 * Handle admin login
 */
function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    let hasErrors = false;

    if (!email) {
        showToast('Please enter admin email');
        hasErrors = true;
    }

    if (!password) {
        showToast('Please enter admin password');
        hasErrors = true;
    }

    if (hasErrors) return;

    // Get all users
    const users = getAllUsers();
    
    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        showToast('Admin credentials not found');
        return;
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (user.passwordHash !== passwordHash) {
        showToast('Invalid email or password');
        return;
    }

    // Check if admin
    if (!user.isAdmin) {
        showToast('You do not have admin access');
        return;
    }

    // Login successful
    const sessionUser = {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        isAdmin: true,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('growthlock_currentUser', JSON.stringify(sessionUser));
    showToast('✓ Admin login successful');
    
    setTimeout(() => {
        showAdminDashboard();
    }, 1000);
}

/**
 * Load and display all clients
 */
function loadAndDisplayClients() {
    allClients = getAllUsers().filter(u => !u.isAdmin);
    renderClientsTable(allClients);
}

/**
 * Render clients table
 */
function renderClientsTable(clientsToDisplay) {
    const tbody = document.getElementById('clientsTableBody');
    const noClientsMsg = document.getElementById('noClientsMessage');

    tbody.innerHTML = '';

    if (clientsToDisplay.length === 0) {
        noClientsMsg.style.display = 'block';
        return;
    }

    noClientsMsg.style.display = 'none';

    clientsToDisplay.forEach(client => {
        const createdDate = new Date(client.createdAt).toLocaleDateString();
        const purchaseCount = client.purchases ? client.purchases.length : 0;
        const lastLogin = client.lastLogin ? new Date(client.lastLogin).toLocaleDateString() : 'Never';
        const isActive = client.lastLogin && (Date.now() - new Date(client.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;
        const status = isActive ? '🟢 Active' : '🔴 Inactive';
        
        // Get photo count
        const photos = getClientPhotos(client.id);
        const photoCount = photos.length;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.fullname}</td>
            <td>${client.email}</td>
            <td>${createdDate}</td>
            <td>${purchaseCount}</td>
            <td>${status}</td>
            <td>${photoCount} photos</td>
            <td>
                <button onclick="viewClientDetails('${client.id}')">View</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Filter clients based on search and status
 */
function filterClients() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;

    const filtered = allClients.filter(client => {
        const matchesSearch = 
            client.fullname.toLowerCase().includes(searchText) ||
            client.email.toLowerCase().includes(searchText);

        let matchesStatus = true;
        if (statusFilter) {
            const isActive = client.lastLogin && (Date.now() - new Date(client.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;
            matchesStatus = statusFilter === 'active' ? isActive : !isActive;
        }

        return matchesSearch && matchesStatus;
    });

    renderClientsTable(filtered);
}

/**
 * View client details in modal
 */
function viewClientDetails(clientId) {
    const client = allClients.find(c => c.id === clientId);
    if (!client) return;

    // Populate modal
    document.getElementById('modalTitle').textContent = `${client.fullname} - Details`;
    document.getElementById('modalName').textContent = client.fullname;
    document.getElementById('modalEmail').textContent = client.email;
    document.getElementById('modalRegDate').textContent = new Date(client.createdAt).toLocaleDateString();
    
    const isActive = client.lastLogin && (Date.now() - new Date(client.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;
    document.getElementById('modalStatus').textContent = isActive ? '🟢 Active' : '🔴 Inactive';

    // Purchase history
    const purchaseHistory = document.getElementById('purchaseHistory');
    purchaseHistory.innerHTML = '';

    if (client.purchases && client.purchases.length > 0) {
        client.purchases.forEach(purchase => {
            const item = document.createElement('div');
            item.className = 'purchase-item';
            item.innerHTML = `
                <strong>${purchase.product}</strong><br>
                Date: ${new Date(purchase.date).toLocaleDateString()}<br>
                Amount: $${purchase.amount || 0}
            `;
            purchaseHistory.appendChild(item);
        });
    } else {
        purchaseHistory.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No purchases yet</p>';
    }

    // Progress photos
    const photos = getClientPhotos(clientId);
    const photosContainer = document.getElementById('progressPhotos');
    const noPhotosMsg = document.getElementById('noPhotosMessage');

    photosContainer.innerHTML = '';

    if (photos.length === 0) {
        noPhotosMsg.style.display = 'block';
    } else {
        noPhotosMsg.style.display = 'none';
        photos.forEach(photo => {
            const photoDiv = document.createElement('div');
            photoDiv.innerHTML = `
                <img src="${photo.data}" alt="Progress photo" onclick="viewPhotoFullscreen('${photo.data}')">
                <div class="photo-date">${new Date(photo.date).toLocaleDateString()}</div>
            `;
            photosContainer.appendChild(photoDiv);
        });
    }

    // Client notes
    document.getElementById('clientNotes').value = client.notes || '';
    document.getElementById('clientNotes').dataset.clientId = clientId;

    // Show modal
    document.getElementById('clientModal').classList.add('show');
}

/**
 * Get client photos from localStorage
 */
function getClientPhotos(clientId) {
    const photos = localStorage.getItem(`growthlock_photos_${clientId}`);
    return photos ? JSON.parse(photos) : [];
}

/**
 * View photo fullscreen
 */
function viewPhotoFullscreen(photoData) {
    const img = new Image();
    img.src = photoData;
    const w = window.open("");
    w.document.write(img.outerHTML);
}

/**
 * Save client notes
 */
function saveClientNotes() {
    const notes = document.getElementById('clientNotes').value;
    const clientId = document.getElementById('clientNotes').dataset.clientId;

    const client = allClients.find(c => c.id === clientId);
    if (client) {
        client.notes = notes;
        const users = getAllUsers();
        const userIndex = users.findIndex(u => u.id === clientId);
        if (userIndex !== -1) {
            users[userIndex] = client;
            saveUsers(users);
            showToast('✓ Notes saved');
        }
    }
}

/**
 * Close modal
 */
function closeClientModal() {
    document.getElementById('clientModal').classList.remove('show');
}

/**
 * Update statistics
 */
function updateStatistics() {
    const users = getAllUsers();
    const clients = users.filter(u => !u.isAdmin);

    // Total clients
    document.getElementById('totalClients').textContent = clients.length;

    // Active clients
    const activeClients = clients.filter(c => 
        c.lastLogin && (Date.now() - new Date(c.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000
    ).length;
    document.getElementById('activeClients').textContent = activeClients;

    // Total purchases
    let totalPurchases = 0;
    let totalRevenue = 0;
    clients.forEach(client => {
        if (client.purchases) {
            totalPurchases += client.purchases.length;
            client.purchases.forEach(p => {
                totalRevenue += p.amount || 0;
            });
        }
    });
    document.getElementById('totalPurchases').textContent = totalPurchases;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * Admin logout
 */
function handleAdminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        logout();
        showToast('✓ Logged out');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('clientModal');
    if (event.target === modal) {
        closeClientModal();
    }
};