/* ======================================
   GROWTHLOCK - AUTHENTICATION LOGIC
   Handles Registration & Login
   Uses localStorage for user data
   ====================================== */

// ======================================
// 1. UTILITY FUNCTIONS
// ======================================

/**
 * Simple password hashing (client-side)
 * Note: For production, use server-side hashing
 */
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: 8+ characters, 1 uppercase, 1 number
 */
function isValidPassword(password) {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasMinLength && hasUppercase && hasNumber;
}

/**
 * Get all registered users from localStorage
 */
function getAllUsers() {
    const users = localStorage.getItem('growthlock_users');
    return users ? JSON.parse(users) : [];
}

/**
 * Save users to localStorage
 */
function saveUsers(users) {
    localStorage.setItem('growthlock_users', JSON.stringify(users));
}

/**
 * Get current logged-in user
 */
function getCurrentUser() {
    const user = localStorage.getItem('growthlock_currentUser');
    return user ? JSON.parse(user) : null;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return getCurrentUser() !== null;
}

/**
 * Redirect to page after delay
 */
function redirectAfterDelay(page, delay = 2000) {
    setTimeout(() => {
        window.location.href = page;
    }, delay);
}

/**
 * Show error message
 */
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

/**
 * Clear all error messages
 */
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
    
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
        errorAlert.classList.remove('show');
        errorAlert.textContent = '';
    }
}

/**
 * Show error alert
 */
function showErrorAlert(message) {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.classList.add('show');
    }
}

/**
 * Show success message
 */
function showSuccess() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.classList.add('show');
    }
}

/**
 * Disable form submission
 */
function disableForm(form) {
    const inputs = form.querySelectorAll('input');
    const button = form.querySelector('button[type="submit"]');
    
    inputs.forEach(input => input.disabled = true);
    if (button) button.disabled = true;
}

/**
 * Enable form submission
 */
function enableForm(form) {
    const inputs = form.querySelectorAll('input');
    const button = form.querySelector('button[type="submit"]');
    
    inputs.forEach(input => input.disabled = false);
    if (button) button.disabled = false;
}

/**
 * Reset form fields
 */
function resetForm(form) {
    form.reset();
    clearErrors();
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
        errorAlert.classList.remove('show');
    }
}

// ======================================
// 2. REGISTRATION LOGIC
// ======================================

document.addEventListener('DOMContentLoaded', () => {
    const onAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');

    // Social provider is available on both auth pages.
    attachGoogleAuthHandler();
    handlePendingRedirectAuthResult();

    // Keep signed-in users out of auth screens.
    if (onAuthPage && isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }
});

function handlePendingRedirectAuthResult() {
    if (!isFirebaseReady()) {
        return;
    }

    firebase.auth().getRedirectResult()
        .then((result) => {
            if (!result || !result.user) {
                return;
            }

            const providerName = 'google';
            const emailFromCredential = result && result.credential && result.credential.email ? result.credential.email : '';

            finalizeSocialAuth(result.user, providerName, emailFromCredential);
        })
        .catch((error) => {
            if (error && error.code === 'auth/no-auth-event') {
                return;
            }
            showErrorAlert((error && error.message) || 'Could not complete social sign-in after redirect.');
        });
}

/**
 * Attach Google auth button handler when present
 */
function attachGoogleAuthHandler() {
    const googleBtn = document.getElementById('googleAuthBtn');
    if (!googleBtn || googleBtn.dataset.bound === 'true') return;

    googleBtn.dataset.bound = 'true';
    googleBtn.addEventListener('click', handleGoogleAuth);
}

/**
 * Sign in or create account with Google via Firebase
 */
function handleGoogleAuth() {
    clearErrors();

    if (!validateRegisterConsentIfRequired()) {
        return;
    }

    if (!isFirebaseReady()) {
        showErrorAlert('Google login requires Firebase configuration. Add your Firebase config and enable Google provider.');
        return;
    }

    if (!isProtocolSupportedForFirebaseAuth()) {
        showErrorAlert('Google login requires running this app on http://localhost or https:// (not file://). Start a local server and open the app URL.');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            finalizeSocialAuth(result && result.user ? result.user : null, 'google');
        })
        .catch((error) => {
            if (isUnsupportedAuthEnvironment(error)) {
                showErrorAlert('Google login is not supported in this browser context. Open the app from http://localhost:8000 or another https URL.');
                return;
            }
            if (isProviderDisabledError(error)) {
                showErrorAlert('Google sign-in is disabled in Firebase. Enable Google under Firebase Console > Authentication > Sign-in method.');
                return;
            }
            if (isInvalidCredentialError(error)) {
                showErrorAlert('Google sign-in failed due to an invalid credential response. Try again and make sure popups/cookies are allowed for this site.');
                return;
            }
            showErrorAlert(error.message || 'Google login failed.');
        });
}

function finalizeSocialAuth(firebaseUser, provider, fallbackEmail) {
    const resolvedEmail = firebaseUser && firebaseUser.email ? firebaseUser.email : (fallbackEmail || '');

    if (!resolvedEmail) {
        showErrorAlert('Sign in failed: no account email was provided by ' + provider + '.');
        return;
    }

    const localUser = upsertLocalSocialUser(firebaseUser, provider, resolvedEmail);

    const sessionUser = {
        id: localUser.id,
        fullname: localUser.fullname,
        email: localUser.email,
        profilePic: localUser.profilePic || null,
        isAdmin: !!localUser.isAdmin,
        loginTime: new Date().toISOString(),
        provider: provider
    };

    localStorage.setItem('growthlock_currentUser', JSON.stringify(sessionUser));
    syncUserProfileToFirebase(localUser);
    requestNotificationPermissionOnLogin();

    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'block';
    }

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

function syncUserProfileToFirebase(localUser) {
    if (!localUser) return;
    if (typeof firebase === 'undefined' || typeof firebase.database !== 'function') return;

    const userKey = localUser.id || localUser.email;
    if (!userKey) return;

    firebase.database().ref(`growthlock_user_profiles/${userKey}`).update({
        id: localUser.id || '',
        fullname: localUser.fullname || '',
        email: localUser.email || '',
        profilePic: localUser.profilePic || null,
        createdAt: localUser.createdAt || new Date().toISOString(),
        lastLogin: localUser.lastLogin || new Date().toISOString(),
        isAdmin: !!localUser.isAdmin,
        authProvider: localUser.authProvider || 'google'
    }).catch((error) => {
        console.warn('Could not sync profile to Firebase:', error);
    });
}

function requestNotificationPermissionOnLogin() {
    if (typeof Notification === 'undefined') {
        return;
    }

    const currentPermission = Notification.permission;
    localStorage.setItem('growthlock_notification_permission', currentPermission);

    if (currentPermission !== 'default') {
        return;
    }

    Notification.requestPermission()
        .then((permission) => {
            localStorage.setItem('growthlock_notification_permission', permission);
            console.log('Notification permission:', permission);
        })
        .catch((error) => {
            console.warn('Notification permission request failed:', error);
        });
}

function upsertLocalSocialUser(firebaseUser, provider, email) {
    const users = getAllUsers();
    let localUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    const nowIso = new Date().toISOString();

    if (!localUser) {
        localUser = {
            id: (firebaseUser && firebaseUser.uid) ? firebaseUser.uid : Date.now().toString(),
            fullname: (firebaseUser && firebaseUser.displayName) ? firebaseUser.displayName : email.split('@')[0],
            email: email,
            profilePic: (firebaseUser && firebaseUser.photoURL) ? firebaseUser.photoURL : null,
            createdAt: nowIso,
            lastLogin: nowIso,
            purchases: [],
            preferences: {
                newsletter: false,
                notifications: true
            },
            authProvider: provider
        };
        users.push(localUser);
    } else {
        localUser.fullname = localUser.fullname || ((firebaseUser && firebaseUser.displayName) ? firebaseUser.displayName : localUser.email);
        if (firebaseUser && firebaseUser.photoURL) {
            localUser.profilePic = firebaseUser.photoURL;
        }
        localUser.lastLogin = nowIso;
        localUser.authProvider = provider;

        const index = users.findIndex(u => u.id === localUser.id);
        if (index !== -1) {
            users[index] = localUser;
        }
    }

    saveUsers(users);
    return localUser;
}

function isFirebaseReady() {
    if (typeof firebase === 'undefined' || !firebase.auth) return false;
    try {
        firebase.auth();
        return true;
    } catch (error) {
        return false;
    }
}

function isProtocolSupportedForFirebaseAuth() {
    const protocol = window.location.protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'chrome-extension:';
}

function isUnsupportedAuthEnvironment(error) {
    if (!error) return false;
    const code = error.code || '';
    const message = error.message || '';
    return code === 'auth/operation-not-supported-in-this-environment' || message.includes('operation is not supported in the environment');
}

function isInvalidCredentialError(error) {
    if (!error) return false;
    const code = error.code || '';
    const message = (error.message || '').toLowerCase();
    return code === 'auth/invalid-credential' || message.includes('invalid-credential');
}

function isProviderDisabledError(error) {
    if (!error) return false;
    const code = error.code || '';
    const message = (error.message || '').toLowerCase();
    return code === 'auth/operation-not-allowed' || message.includes('provider is disabled');
}

function validateRegisterConsentIfRequired() {
    const consentCheckbox = document.getElementById('registerConsent');
    const consentError = document.getElementById('consent-error');

    if (!consentCheckbox) {
        return true;
    }

    if (consentError) {
        consentError.textContent = '';
    }

    if (consentCheckbox.checked) {
        return true;
    }

    if (consentError) {
        consentError.textContent = 'Please accept Terms & Conditions and Privacy Policy to continue.';
    }
    showErrorAlert('You must accept Terms & Conditions and Privacy Policy before continuing.');
    return false;
}

// ======================================
// 4. LOGOUT FUNCTION
// ======================================

/**
 * Logout current user
 */
function logout() {
    localStorage.removeItem('growthlock_currentUser');
    localStorage.removeItem('growthlock_rememberMe');
    window.location.href = 'login.html';
}

/**
 * Check authentication and redirect if needed
 */
function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// ======================================
// 5. AUTO-LOGIN ON LOAD
// ======================================

/**
 * Auto-login if "Remember Me" was checked
 */
function autoLoginIfRemembered() {
    if (isLoggedIn()) {
        return; // Already logged in
    }

    const rememberData = localStorage.getItem('growthlock_rememberMe');
    if (!rememberData) {
        return;
    }

    const { email } = JSON.parse(rememberData);
    const users = getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
        const sessionUser = {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('growthlock_currentUser', JSON.stringify(sessionUser));
    }
}

// Initialize demo user and admin user on first load
if (getAllUsers().length === 0) {
    initializeDemoUser();
}

function initializeAdminUser() {
    const users = getAllUsers();
    const hasAdmin = users.some(u => u.isAdmin);
    if (!hasAdmin && typeof hashPassword === 'function') {
        users.push({
            id: Date.now().toString(),
            fullname: 'Admin',
            email: 'admin@growthlock.com',
            passwordHash: hashPassword('Admin1234'),
            isAdmin: true,
            createdAt: new Date().toISOString(),
            purchases: [],
            preferences: { newsletter: false, notifications: true }
        });
        saveUsers(users);
        console.log('Default admin user created: admin@growthlock.com / Admin1234');
    }
}
initializeAdminUser();
