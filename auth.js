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
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (registerForm) {
        setupRegisterForm();
    }

    if (loginForm) {
        setupLoginForm();
    }

    // Check if user is already logged in
    if (isLoggedIn()) {
        // Redirect to dashboard or main page
        if (!document.getElementById('registerForm') && !document.getElementById('loginForm')) {
            // Already on main page
        } else {
            // If on auth pages and logged in, redirect to dashboard
            if (document.getElementById('registerForm') || document.getElementById('loginForm')) {
                // Could redirect here if needed
            }
        }
    }
});

/**
 * Setup registration form handlers
 */
function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleRegister();
    });

    // Real-time password validation
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            clearErrors();
        });
    }

    // Profile picture preview
    const picInput = document.getElementById('profilePic');
    if (picInput) {
        picInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showError('profilePic-error', 'Image must be smaller than 5MB');
                    picInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const preview = document.getElementById('picPreview');
                    const previewImg = document.getElementById('picPreviewImg');
                    if (preview && previewImg) {
                        previewImg.src = evt.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

/**
 * Handle registration submission
 */
function handleRegister() {
    clearErrors();
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('terms').checked;
    const profilePicFile = document.getElementById('profilePic')?.files[0];

    let hasErrors = false;

    // Validate full name
    if (!fullname || fullname.length < 3) {
        showError('fullname-error', 'Name must be at least 3 characters');
        hasErrors = true;
    }

    // Validate email
    if (!isValidEmail(email)) {
        showError('email-error', 'Please enter a valid email address');
        hasErrors = true;
    }

    // Check if email already exists
    const existingUser = getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        showError('email-error', 'Email already registered');
        hasErrors = true;
    }

    // Validate password strength
    if (!isValidPassword(password)) {
        showError('password-error', 'Password must have 8+ chars, uppercase, and numbers');
        hasErrors = true;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
        showError('confirmPassword-error', 'Passwords do not match');
        hasErrors = true;
    }

    // Validate terms
    if (!termsAccepted) {
        showError('terms-error', 'You must accept the terms');
        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    // Handle profile picture upload
    if (profilePicFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const profilePicData = e.target.result; // base64
            createUserWithPic(fullname, email, password, profilePicData);
        };
        reader.readAsDataURL(profilePicFile);
    } else {
        createUserWithPic(fullname, email, password, null);
    }
}

/**
 * Create user after profile pic is processed
 */
function createUserWithPic(fullname, email, password, profilePic) {
    const newUser = {
        id: Date.now().toString(),
        fullname: fullname,
        email: email,
        passwordHash: hashPassword(password),
        profilePic: profilePic,
        createdAt: new Date().toISOString(),
        purchases: [],
        preferences: {
            newsletter: false,
            notifications: true
        }
    };

    // Save user
    const users = getAllUsers();
    users.push(newUser);
    saveUsers(users);

    // Show success message
    showSuccess();
    disableForm(document.getElementById('registerForm'));

    // Redirect to login
    redirectAfterDelay('login.html', 2000);
}

// ======================================
// 3. LOGIN LOGIC
// ======================================

/**
 * Setup login form handlers
 */
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
}

/**
 * Handle login submission
 */
function handleLogin() {
    clearErrors();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    let hasErrors = false;

    // Validate email
    if (!email) {
        showError('email-error', 'Please enter your email');
        hasErrors = true;
    }

    // Validate password
    if (!password) {
        showError('password-error', 'Please enter your password');
        hasErrors = true;
    }

        if (hasErrors) {
                return;
        }

        // Set Firebase persistence based on Remember Me
        var persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        firebase.auth().setPersistence(persistence)
            .then(function() {
                return firebase.auth().signInWithEmailAndPassword(email, password);
            })
            .then(function(userCredential) {
                document.getElementById('successMessage').style.display = 'block';
                setTimeout(function() {
                    window.location.href = 'dashboard.html';
                }, 1200);
            })
            .catch(function(error) {
                showErrorAlert(error.message || 'Email or password incorrect');
            });
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

// ======================================
// 7. FORGOT PASSWORD LOGIC
// ======================================

/**
 * Show forgot password modal
 */
function showForgotPasswordModal(event) {
    event.preventDefault();
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear previous errors
        document.getElementById('reset-email-error').textContent = '';
        document.getElementById('new-password-error').textContent = '';
        document.getElementById('confirm-password-error').textContent = '';
    }
}

/**
 * Close forgot password modal
 */
function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
        // Clear form
        document.getElementById('resetEmail').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('reset-email-error').textContent = '';
        document.getElementById('new-password-error').textContent = '';
        document.getElementById('confirm-password-error').textContent = '';
    }
}

/**
 * Handle password reset
 */
function handlePasswordReset() {
    const resetEmail = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Clear previous errors
    document.getElementById('reset-email-error').textContent = '';
    document.getElementById('new-password-error').textContent = '';
    document.getElementById('confirm-password-error').textContent = '';

    let hasErrors = false;

    // Validate email
    if (!resetEmail) {
        document.getElementById('reset-email-error').textContent = 'Please enter your email';
        hasErrors = true;
    } else if (!isValidEmail(resetEmail)) {
        document.getElementById('reset-email-error').textContent = 'Please enter a valid email';
        hasErrors = true;
    }

    // Validate new password
    if (!newPassword) {
        document.getElementById('new-password-error').textContent = 'Please enter new password';
        hasErrors = true;
    } else if (!isValidPassword(newPassword)) {
        document.getElementById('new-password-error').textContent = 'Password must have 8+ chars, uppercase, and numbers';
        hasErrors = true;
    }

    // Validate password confirmation
    if (!confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Please confirm password';
        hasErrors = true;
    } else if (newPassword !== confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    // Find user and update password
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === resetEmail.toLowerCase());

    if (userIndex === -1) {
        document.getElementById('reset-email-error').textContent = 'Email not found';
        return;
    }

    // Update password
    users[userIndex].passwordHash = hashPassword(newPassword);
    users[userIndex].updatedAt = new Date().toISOString();
    saveUsers(users);

    // Show success and close modal
    alert('✅ Password reset successfully! Please login with your new password.');
    closeForgotPasswordModal();

    // Optionally redirect to login or clear fields
    document.getElementById('loginEmail').value = resetEmail;
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeForgotPasswordModal();
            }
        });
    }
});