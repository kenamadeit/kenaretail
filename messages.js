/* ======================================
   MESSAGES - CHAT LOGIC
   Real-time messaging system with email notifications
   ====================================== */

let currentUser = null;
let localPollingIntervalId = null;

const LIVE_MESSAGES_PATH = 'growthlock_messages_live';

function getDisplayName(user) {
    if (!user) return 'User';
    return user.fullname || user.fullName || user.name || user.email || 'User';
}

function notify(message) {
    if (typeof showToast === 'function') {
        showToast(message);
        return;
    }
    console.log(message);
}

// EmailJS configuration - Replace with your own service
const EMAILJS_SERVICE_ID = 'your_service_id'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'your_template_id'; // Replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'your_public_key'; // Replace with your EmailJS public key
const ADMIN_EMAIL = 'kenamadeit@gmail.com'; // Replace with your email

document.addEventListener('DOMContentLoaded', () => {
    console.log('Messages page loaded');

    if (!isLoggedIn()) {
        console.log('Not logged in, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    currentUser = getCurrentUser();
    console.log('Current user:', currentUser);

    if (!currentUser) {
        console.error('Could not get current user');
        alert('Error: Could not load user information. Please log in again.');
        window.location.href = 'login.html';
        return;
    }

    const userHeader = document.getElementById('user-header');
    if (userHeader) {
        userHeader.textContent = getDisplayName(currentUser);
    }

    initializeMessageFeed();

    // Enable send on Enter key (Ctrl+Enter)
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                console.log('Ctrl+Enter pressed');
                sendMessage();
            }
        });
    }
});

function initializeMessageFeed() {
    if (isFirebaseDatabaseReady()) {
        subscribeToLiveConversation(currentUser.id);
        return;
    }

    // Fallback for environments without Firebase database support.
    loadMessages();
    localPollingIntervalId = setInterval(() => {
        loadMessages();
    }, 2000);
}

function isFirebaseDatabaseReady() {
    return typeof firebase !== 'undefined' && typeof firebase.database === 'function';
}

function getConversationRef(userId) {
    if (!isFirebaseDatabaseReady() || !userId) return null;
    return firebase.database().ref(`${LIVE_MESSAGES_PATH}/${userId}`);
}

function subscribeToLiveConversation(userId) {
    const conversationRef = getConversationRef(userId);
    if (!conversationRef) {
        loadMessages();
        return;
    }

    conversationRef.on('value', (snapshot) => {
        const raw = snapshot.val() || {};
        const conversationMessages = Object.keys(raw).map((key) => {
            const item = raw[key] || {};
            return {
                ...item,
                id: item.id || key,
                userId: item.userId || userId
            };
        }).sort((a, b) => getTimestampValue(a.timestamp) - getTimestampValue(b.timestamp));

        mergeConversationIntoLocalCache(userId, conversationMessages);
        loadMessages();
    }, (error) => {
        console.error('Live subscription failed, using local fallback:', error);
        notify('Live sync failed. Check Firebase Database rules/config.');
        loadMessages();
    });
}

function mergeConversationIntoLocalCache(userId, conversationMessages) {
    const allMessages = getAllMessages().filter(msg => msg.userId !== userId);
    saveMessages([...allMessages, ...conversationMessages]);
}

function getTimestampValue(timestamp) {
    if (!timestamp) return 0;
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Get all messages from localStorage
 */
function getAllMessages() {
    const messages = localStorage.getItem('growthlock_messages');
    return messages ? JSON.parse(messages) : [];
}

/**
 * Save messages to localStorage
 */
function saveMessages(messages) {
    localStorage.setItem('growthlock_messages', JSON.stringify(messages));
}

/**
 * Send a message
 */
async function sendMessage() {
    console.log('sendMessage() called');
    console.log('currentUser:', currentUser);

    if (!currentUser) {
        console.error('No current user found');
        alert('Error: User not logged in. Please refresh the page.');
        return;
    }

    const input = document.getElementById('messageInput');
    if (!input) {
        console.error('Message input element not found');
        return;
    }

    const text = input.value.trim();
    console.log('Message text:', text);

    if (!text) {
        console.warn('Empty message');
        notify('Please type a message');
        return;
    }

    const message = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: getDisplayName(currentUser),
        userEmail: currentUser.email,
        type: 'user',
        text: text,
        timestamp: new Date().toISOString(),
        read: false
    };

    console.log('Creating message:', message);

    try {
        // Always keep sender-side history visible immediately.
        const messages = getAllMessages();
        messages.push(message);
        saveMessages(messages);

        if (isFirebaseDatabaseReady()) {
            const conversationRef = getConversationRef(currentUser.id);
            if (conversationRef) {
                const liveRecord = {
                    ...message,
                    timestamp: new Date().toISOString()
                };
                await conversationRef.child(message.id).set(liveRecord);
            }
        }

        input.value = '';
        loadMessages();
        scrollToBottom();

        notify('Message sent!');

        // Optional admin email notification in addition to live sync.
        sendEmailToAdmin(message);
    } catch (error) {
        console.error('Error sending message:', error);
        const isPermissionError = error && (error.code === 'PERMISSION_DENIED' || String(error).toLowerCase().includes('permission'));
        if (isPermissionError) {
            notify('Message saved locally, but live sync was blocked by Firebase rules.');
            return;
        }
        notify('Error sending message');
    }
}

/**
 * Load and display all messages
 */
function loadMessages() {
    console.log('loadMessages() called');
    console.log('currentUser:', currentUser);

    if (!currentUser) {
        console.warn('No current user, cannot load messages');
        return;
    }

    try {
        const messages = getAllMessages();
        console.log('All messages:', messages);

        const userMessages = messages.filter(m => m.userId === currentUser.id);
        console.log('Filtered user messages:', userMessages);
        
        const list = document.getElementById('messagesList');
        if (!list) {
            console.error('Messages list container not found');
            return;
        }
        
        if (userMessages.length === 0) {
            list.innerHTML = '<div class="no-messages">No messages yet. Start a conversation!</div>';
            console.log('No messages to display');
            return;
        }

        list.innerHTML = userMessages.map(msg => {
            const date = new Date(msg.timestamp);
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('en-US');
            
            return `
                <div class="message ${msg.type}">
                    <div>
                        <div class="message-sender">${msg.type === 'admin' ? '👨‍💼 Admin' : '👤 You'}</div>
                        <div class="message-content">${escapeHtml(msg.text)}</div>
                        <div class="message-time">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('Messages rendered on page');
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

/**
 * Scroll message list to bottom
 */
function scrollToBottom() {
    const list = document.getElementById('messagesList');
    setTimeout(() => {
        list.scrollTop = list.scrollHeight;
    }, 100);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Send email notification to admin
 */
function sendEmailToAdmin(message) {
    // Skip if EmailJS is not configured
    if (EMAILJS_SERVICE_ID === 'your_service_id') {
        console.log('EmailJS not configured - message saved locally only');
        return;
    }

    const templateParams = {
        to_email: ADMIN_EMAIL,
        from_name: message.userName,
        from_email: message.userEmail,
        message: message.text,
        timestamp: new Date(message.timestamp).toLocaleString(),
        user_id: message.userId
    };

    console.log('Sending email with params:', templateParams);

    // Send email using EmailJS
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
        .then(function(response) {
            console.log('✅ Email sent successfully:', response);
            notify('Message sent to admin!');
        }, function(error) {
            console.error('❌ Email failed to send:', error);
            notify('Failed to send message to admin. Please try again.');

            // Log detailed error for debugging
            if (error.text) {
                console.error('Error details:', error.text);
            }
        });
}