/* ======================================
   ADMIN DASHBOARD - LOGIC
   Client Management & Tracking
   ====================================== */

let currentAdminUser = null;
let allClients = [];
let liveMessagesRef = null;
let latestSeenUserMessageId = null;

const LIVE_MESSAGES_PATH = 'growthlock_messages_live';

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    setupAdminLoginHandlers();
    checkAdminAccess();
});

/**
 * Ensure Google login button is wired up
 */
function setupAdminLoginHandlers() {
    const googleBtn = document.getElementById('adminGoogleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            handleAdminGoogleLogin();
        });
    }
}

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
        document.getElementById('adminLoginContainer').style.display = 'block';
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
    subscribeToLiveMessages();
}

function isFirebaseDatabaseReady() {
    return typeof firebase !== 'undefined' && typeof firebase.database === 'function';
}

function getTimestampValue(timestamp) {
    if (!timestamp) return 0;
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function subscribeToLiveMessages() {
    if (!isFirebaseDatabaseReady()) {
        return;
    }

    if (liveMessagesRef) {
        liveMessagesRef.off();
    }

    liveMessagesRef = firebase.database().ref(LIVE_MESSAGES_PATH);
    liveMessagesRef.on('value', (snapshot) => {
        const raw = snapshot.val() || {};
        const flattenedMessages = [];

        Object.keys(raw).forEach((userId) => {
            const conversation = raw[userId] || {};
            Object.keys(conversation).forEach((messageId) => {
                const message = conversation[messageId] || {};
                flattenedMessages.push({
                    ...message,
                    id: message.id || messageId,
                    userId: message.userId || userId
                });
            });
        });

        flattenedMessages.sort((a, b) => getTimestampValue(a.timestamp) - getTimestampValue(b.timestamp));
        localStorage.setItem('growthlock_messages', JSON.stringify(flattenedMessages));

        const latestUserMessage = [...flattenedMessages].reverse().find(msg => msg.type === 'user');
        if (latestUserMessage) {
            if (latestSeenUserMessageId && latestSeenUserMessageId !== latestUserMessage.id) {
                const senderName = latestUserMessage.userName || latestUserMessage.userEmail || 'user';
                showToast(`New message from ${senderName}`);
            }
            latestSeenUserMessageId = latestUserMessage.id;
        }

        if (document.getElementById('adminDashboard').style.display === 'block') {
            loadAndDisplayClients();
        }
    }, (error) => {
        console.error('Admin live message subscription failed:', error);
        showToast('Live messages unavailable. Check Firebase Database rules/config.');
    });
}

/**
 * Handle admin login via Google (only allowed method for admin)
 */
function handleAdminGoogleLogin() {
    if (!isFirebaseReady()) {
        showToast('Google login requires Firebase configuration. Add your Firebase config and enable Google provider.');
        return;
    }

    if (!isProtocolSupportedForFirebaseAuth()) {
        showToast('Google login requires running this app on http://localhost or https://.');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const firebaseUser = result && result.user ? result.user : null;
            const email = firebaseUser && firebaseUser.email ? firebaseUser.email : '';

            if (!email) {
                showToast('Google sign-in failed: no email provided.');
                firebase.auth().signOut();
                return;
            }

            // Verify admin status before creating or updating any local record
            const existingUser = getAllUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
            if (!existingUser || !existingUser.isAdmin) {
                showToast('Access denied: this Google account does not have admin privileges.');
                firebase.auth().signOut();
                return;
            }

            const localUser = upsertLocalSocialUser(firebaseUser, 'google', email);

            const sessionUser = {
                id: localUser.id,
                fullname: localUser.fullname,
                email: localUser.email,
                profilePic: localUser.profilePic || null,
                isAdmin: true,
                loginTime: new Date().toISOString(),
                provider: 'google'
            };

            localStorage.setItem('growthlock_currentUser', JSON.stringify(sessionUser));
            showToast('✓ Admin login successful');

            setTimeout(() => {
                showAdminDashboard();
            }, 1000);
        })
        .catch((error) => {
            if (isUnsupportedAuthEnvironment(error)) {
                showToast('Google login is not supported in this browser context. Open the app from http://localhost or an https URL.');
                return;
            }
            if (isProviderDisabledError(error)) {
                showToast('Google sign-in is disabled. Enable it in Firebase Console > Authentication > Sign-in method.');
                return;
            }
            if (isInvalidCredentialError(error)) {
                showToast('Google sign-in failed due to an invalid credential. Try again.');
                return;
            }
            showToast(error.message || 'Google login failed.');
        });
}

/**
 * Load and display all clients
 */
async function loadAndDisplayClients() {
    const localClients = getAllUsers().filter(u => !u.isAdmin);
    const remoteClients = await fetchRemoteClientProfiles();
    const mergedClients = mergeClients(localClients, remoteClients);

    allClients = mergedClients.map(client => ({
        ...client,
        linkedData: getClientLinkedData(client)
    }));

    renderClientsTable(allClients);
    updateStatistics();
}

async function fetchRemoteClientProfiles() {
    if (!isFirebaseDatabaseReady()) return [];

    try {
        const snapshot = await firebase.database().ref('growthlock_user_profiles').once('value');
        const raw = snapshot.val() || {};

        return Object.keys(raw)
            .map((key) => {
                const profile = raw[key] || {};
                return {
                    id: profile.id || key,
                    fullname: profile.fullname || profile.email || 'User',
                    email: profile.email || '',
                    profilePic: profile.profilePic || null,
                    createdAt: profile.createdAt || null,
                    lastLogin: profile.lastLogin || null,
                    isAdmin: !!profile.isAdmin,
                    purchases: []
                };
            })
            .filter(profile => !profile.isAdmin);
    } catch (error) {
        console.warn('Could not load remote client profiles:', error);
        return [];
    }
}

function mergeClients(localClients, remoteClients) {
    const mergedByIdentity = new Map();

    localClients.forEach((client) => {
        const idKey = client.id ? `id:${client.id}` : null;
        const emailKey = client.email ? `email:${client.email.toLowerCase()}` : null;
        const key = idKey || emailKey;
        if (key) mergedByIdentity.set(key, { ...client });
    });

    remoteClients.forEach((client) => {
        const idKey = client.id ? `id:${client.id}` : null;
        const emailKey = client.email ? `email:${client.email.toLowerCase()}` : null;
        const existing = (idKey && mergedByIdentity.get(idKey)) || (emailKey && mergedByIdentity.get(emailKey));

        if (existing) {
            const merged = {
                ...existing,
                ...client,
                purchases: existing.purchases || []
            };
            if (idKey) mergedByIdentity.set(idKey, merged);
            if (emailKey) mergedByIdentity.set(emailKey, merged);
        } else {
            const key = idKey || emailKey;
            if (key) mergedByIdentity.set(key, { ...client });
        }
    });

    const uniqueClients = new Map();
    mergedByIdentity.forEach((client) => {
        const uniqueKey = client.id || client.email || `${Math.random()}`;
        uniqueClients.set(uniqueKey, client);
    });

    return Array.from(uniqueClients.values());
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
        const isActive = client.lastLogin && (Date.now() - new Date(client.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;
        const status = isActive ? '🟢 Active' : '🔴 Inactive';

        const linkedData = client.linkedData || getClientLinkedData(client);
        const photoCount = linkedData.photos.length;
        const messageCount = linkedData.messages.length;
        const progressSummary = linkedData.progress.progressLabel;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.fullname}</td>
            <td>${client.email}</td>
            <td>${createdDate}</td>
            <td>${purchaseCount}</td>
            <td>${status}</td>
            <td>${photoCount} photos</td>
            <td>${messageCount}</td>
            <td>${progressSummary}</td>
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

    const linkedData = client.linkedData || getClientLinkedData(client);

    // Populate modal
    document.getElementById('modalTitle').textContent = `${client.fullname} - Details`;
    document.getElementById('modalName').textContent = client.fullname;
    document.getElementById('modalEmail').textContent = client.email;
    document.getElementById('modalRegDate').textContent = new Date(client.createdAt).toLocaleDateString();
    
    const isActive = client.lastLogin && (Date.now() - new Date(client.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;
    document.getElementById('modalStatus').textContent = isActive ? '🟢 Active' : '🔴 Inactive';

    const lastLoginText = client.lastLogin ? new Date(client.lastLogin).toLocaleString() : 'Never logged in';
    document.getElementById('modalLastLogin').textContent = lastLoginText;
    document.getElementById('modalMessageCount').textContent = `${linkedData.messages.length} messages`;
    document.getElementById('modalNotificationTimes').textContent = formatNotificationTimes(linkedData.notificationTimes);
    document.getElementById('modalProfilePicStatus').textContent = client.profilePic ? 'Uploaded' : 'Not uploaded';
    document.getElementById('modalProgressDays').textContent = `${linkedData.progress.trackedDays} tracked days`;
    document.getElementById('modalPhotoTimeline').textContent = linkedData.progress.photoTimeline;

    // Profile picture preview
    const modalProfilePic = document.getElementById('modalProfilePic');
    if (modalProfilePic) {
        const fallbackAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%230a3d62' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='18' fill='%23d9f7ff'/%3E%3Cpath d='M18 92c8-18 24-28 32-28s24 10 32 28' fill='%23d9f7ff'/%3E%3C/svg%3E";
        modalProfilePic.src = client.profilePic || fallbackAvatar;
    }

    // Client message thread
    const messagesThread = document.getElementById('clientMessagesThread');
    const noMessagesMessage = document.getElementById('noClientMessagesMessage');
    if (messagesThread && noMessagesMessage) {
        const messages = [...(linkedData.messages || [])].sort((a, b) => getTimestampValue(a.timestamp) - getTimestampValue(b.timestamp));
        messagesThread.innerHTML = '';

        if (!messages.length) {
            noMessagesMessage.style.display = 'block';
        } else {
            noMessagesMessage.style.display = 'none';
            messages.forEach((message) => {
                const messageItem = document.createElement('div');
                const type = message.type === 'admin' ? 'admin' : 'user';
                const sender = type === 'admin' ? 'Admin' : (message.userName || client.fullname || 'User');
                const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'Unknown time';

                messageItem.className = `client-message-item ${type}`;
                messageItem.innerHTML = `
                    <div class="client-message-meta">${sender} • ${timestamp}</div>
                    <div class="client-message-text">${escapeHtml(message.text || '')}</div>
                `;
                messagesThread.appendChild(messageItem);
            });
        }
    }

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
    const photos = linkedData.photos;
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
 * Get client messages from localStorage
 */
function getClientMessages(clientId) {
    const messages = safeReadStorage('growthlock_messages', []);
    return messages.filter(msg => msg.userId === clientId);
}

/**
 * Get notification time settings for a client
 */
function getClientNotificationTimes(clientId) {
    return safeReadStorage(`growthlock_notifications_${clientId}`, []);
}

/**
 * Get routine data for a client.
 * Supports both per-user and legacy global storage.
 */
function getClientRoutineData(clientId) {
    const userScoped = safeReadStorage(`growthlock_routines_${clientId}`, null);
    if (userScoped) return userScoped;

    // Legacy fallback: only use the global key when there is a single client.
    const legacyGlobal = safeReadStorage('growthlock_routines', null);
    if (!legacyGlobal) return null;

    const totalClients = getAllUsers().filter(u => !u.isAdmin).length;
    return totalClients === 1 ? legacyGlobal : null;
}

/**
 * Build linked data payload for a client
 */
function getClientLinkedData(client) {
    const photos = getClientPhotos(client.id);
    const messages = getClientMessages(client.id);
    const notificationTimes = getClientNotificationTimes(client.id);
    const routines = getClientRoutineData(client.id);
    const progress = calculateClientProgress(photos, routines);

    return {
        photos,
        messages,
        notificationTimes,
        routines,
        progress
    };
}

/**
 * Calculate summary progress metrics from linked data
 */
function calculateClientProgress(photos, routines) {
    const allDates = new Set();

    if (routines && typeof routines === 'object') {
        Object.values(routines).forEach(entries => {
            if (Array.isArray(entries)) {
                entries.forEach(entry => {
                    if (entry && entry.date) allDates.add(entry.date);
                });
            }
        });
    }

    let photoTimeline = 'Not enough photos yet';
    if (photos.length >= 2) {
        const sorted = [...photos].sort((a, b) => new Date(a.date) - new Date(b.date));
        const start = new Date(sorted[0].date);
        const end = new Date(sorted[sorted.length - 1].date);
        const daySpan = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
        photoTimeline = `${daySpan} days (${photos.length} photos)`;
    } else if (photos.length === 1) {
        photoTimeline = '1 photo uploaded';
    }

    const trackedDays = allDates.size;
    const progressLabel = trackedDays > 0 ? `${trackedDays} days tracked` : `${photos.length} photos`;

    return {
        trackedDays,
        photoTimeline,
        progressLabel
    };
}

function formatNotificationTimes(times) {
    if (!Array.isArray(times) || times.length === 0) return 'Not set';
    const valid = times.filter(Boolean);
    return valid.length ? valid.join(', ') : 'Not set';
}

function safeReadStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.warn(`Failed to parse localStorage key: ${key}`, error);
        return fallback;
    }
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
    const clients = Array.isArray(allClients) ? allClients : [];

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
        if (liveMessagesRef) {
            liveMessagesRef.off();
            liveMessagesRef = null;
        }
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