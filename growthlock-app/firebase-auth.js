/**
 * Firebase Authentication - Password Reset
 * Handles password reset flow with Firebase Authentication
 * Browser-compatible (no modules/exports)
 */

// Global Firebase auth reference
let auth = null;

/**
 * Initialize Firebase Authentication
 * Called after Firebase SDK loads
 */
function initializeFirebaseAuth() {
    try {
        // Get reference to Firebase auth
        auth = firebase.auth();
        console.log('✅ Firebase Auth initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase Auth initialization error:', error);
        return false;
    }
}

/**
 * Handle forgot password form submission
 */
async function handleForgotPassword() {
    // Make sure auth is initialized
    if (!auth) {
        if (!initializeFirebaseAuth()) {
            console.error('❌ Firebase not initialized');
            showErrorAlert('Firebase not initialized. Please refresh the page.');
            return;
        }
    }

    const email = document.getElementById('resetEmail').value.trim();
    
    // Clear previous errors
    document.getElementById('email-error').textContent = '';
    document.getElementById('errorAlert').style.display = 'none';
    document.getElementById('errorAlert').textContent = '';

    // Validate email
    if (!email) {
        document.getElementById('email-error').textContent = 'Please enter your email address';
        return;
    }

    if (!isValidEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        return;
    }

    // Show loading state
    showLoadingState();

    try {
        /**
         * Send password reset email using Firebase Authentication
         * 
         * Firebase sends a secure email with:
         * - Unique reset link
         * - Password reset form pre-signed
         * - Link expires in 1 hour
         * - No OTP needed - Firebase handles security
         */
        await auth.sendPasswordResetEmail(email, {
            url: window.location.origin + '/login.html',
            handleCodeInApp: false
        });

        console.log('✅ Password reset email sent to:', email);
        
        // Show success message
        showSuccessState();
        
    } catch (error) {
        console.error('❌ Password reset error:', error);
        
        // Handle specific Firebase errors
        handlePasswordResetError(error, email);
        
        // Hide loading state
        hideLoadingState();
    }
}

/**
 * Handle Firebase authentication errors
 * 
 * @param {Error} error - Firebase error object
 * @param {string} email - Email that was attempted
 */
function handlePasswordResetError(error, email) {
    const errorAlert = document.getElementById('errorAlert');
    let errorMessage = 'An error occurred. Please try again.';

    console.error('Firebase Auth Error Code:', error.code);
    console.error('Firebase Auth Error Message:', error.message);

    // Check if auth is undefined
    if (!auth) {
        errorMessage = 'Firebase not properly initialized. Please refresh the page.';
        errorAlert.textContent = errorMessage;
        errorAlert.style.display = 'block';
        return;
    }

    switch (error.code) {
        case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            document.getElementById('email-error').textContent = errorMessage;
            break;
            
        case 'auth/user-not-found':
            // For security, don't reveal if email exists
            errorMessage = 'If this email exists in our database, a reset link has been sent.';
            showSuccessState();
            return;
            
        case 'auth/too-many-requests':
            errorMessage = 'Too many reset attempts. Please try again later (in 5-10 minutes).';
            break;
            
        case 'auth/operation-not-allowed':
            errorMessage = 'Password reset is currently disabled. Please contact support.';
            break;
            
        case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
            
        default:
            errorMessage = error.message || 'An error occurred while sending the reset email.';
    }

    errorAlert.textContent = errorMessage;
    errorAlert.style.display = 'block';
}

/**
 * Show loading state with spinner
 */
function showLoadingState() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('formButtons').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    
    // Disable input
    document.getElementById('resetEmail').disabled = true;
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('formButtons').style.display = 'block';
    document.getElementById('resetEmail').disabled = false;
}

/**
 * Show success message state
 */
function showSuccessState() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('formButtons').style.display = 'none';
    document.getElementById('afterSuccess').style.display = 'block';
    document.getElementById('resetEmail').disabled = true;
}

/**
 * Show error alert
 */
function showErrorAlert(message) {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
    }
}

/**
 * Reset form to initial state
 */
function resetForm() {
    document.getElementById('resetEmail').value = '';
    document.getElementById('resetEmail').disabled = false;
    document.getElementById('email-error').textContent = '';
    document.getElementById('errorAlert').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('formButtons').style.display = 'block';
    document.getElementById('afterSuccess').style.display = 'none';
    document.getElementById('resetEmail').focus();
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Handle password update after clicking email link
 * This is called automatically by Firebase when user clicks reset link
 */
async function verifyPasswordResetCode(code) {
    if (!auth) return null;
    
    try {
        // Verify the reset code is valid
        const email = await auth.verifyPasswordResetCode(code);
        console.log('✅ Reset code valid for email:', email);
        return email;
    } catch (error) {
        console.error('❌ Invalid reset code:', error);
        return null;
    }
}

/**
 * Confirm password reset with new password
 * 
 * @param {string} code - Reset code from email link
 * @param {string} newPassword - New password from user
 */
async function confirmPasswordReset(code, newPassword) {
    if (!auth) throw new Error('Firebase not initialized');
    
    try {
        await auth.confirmPasswordReset(code, newPassword);
        console.log('✅ Password reset successful');
        return true;
    } catch (error) {
        console.error('❌ Password reset confirmation error:', error);
        throw error;
    }
}

/**
 * Check if user is already authenticated
 * Redirect to dashboard if logged in
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, attempting Firebase initialization...');
    
    // Wait a moment for Firebase to load
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            console.log('Firebase SDK detected');
            
            if (!initializeFirebaseAuth()) {
                console.error('Failed to initialize Firebase Auth');
                showErrorAlert('Firebase initialization failed. Please refresh the page.');
                return;
            }

            // Check authentication state
            auth.onAuthStateChanged((user) => {
                if (user) {
                    // User is already authenticated
                    console.log('User already logged in, redirecting...');
                    window.location.href = 'index.html';
                } else {
                    // User is not authenticated, allow password reset
                    console.log('Ready for password reset');
                }
            });
        } else {
            console.error('Firebase SDK not loaded');
            showErrorAlert('Firebase SDK not loaded. Please refresh the page.');
        }
    }, 500);

    // Auto-focus email input
    const emailInput = document.getElementById('resetEmail');
    if (emailInput) {
        emailInput.focus();
    }

    // Allow Enter key to submit
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleForgotPassword();
            }
        });
    }
});
