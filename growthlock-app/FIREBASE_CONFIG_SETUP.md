# Firebase Configuration - 5 Minute Setup Guide

## Problem You're Fixing
The browser console shows: `Firebase initialization error` because the `firebaseConfig` needs your actual Firebase credentials.

## Step 1: Create Firebase Project (2 minutes)
1. Go to https://console.firebase.google.com
2. Click **"Add project"** or select existing project
3. Name it: `growthlock-app` (or any name you prefer)
4. Click **Create project** and wait for it to initialize

## Step 2: Copy Your Firebase Credentials (1 minute)
1. In Firebase Console, click the **gear icon** (⚙️) at top left
2. Select **Project Settings**
3. Scroll down to **"Your apps"** section
4. Find the **web app** or click **"Add app"** → Select **Web** if not listed
5. Copy the entire config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## Step 3: Paste into forgot-password.html (1 minute)

**File:** `forgot-password.html`  
**Lines:** 109-116

Replace this:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

With your actual config from Step 2.

## Step 4: Enable Email/Password Authentication (1 minute)
1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"** or **"Sign-in method"** tab
3. Click on **"Email/Password"** provider
4. Toggle **Enable** to ON
5. Click **Save**

## Step 5: Add Authorized Domains (1 minute)
1. In Firebase Authentication, go to **Settings** tab
2. Scroll to **Authorized domains**
3. Click **Add domain** and add:
   - `localhost:8000` (for local testing)
   - `127.0.0.1:8000` (alternative for local)
   - `172.20.10.2:8000` (for phone testing on your network)

## Step 6: Test It! (Hard Refresh)
1. Go to http://localhost:8000/forgot-password.html
2. Press **Ctrl+Shift+R** (hard refresh) to clear cache
3. Try entering an email and clicking "Send Reset Link"

## Troubleshooting

**Console shows: "Firebase initialization error"**
- Check that firebaseConfig is exactly as it appears in Firebase Console (copy-paste, no edits)
- Hard refresh (Ctrl+Shift+R) to clear cache

**Console shows: "Cannot read properties of undefined"**
- Firebase SDK failed to load - check internet connection
- Wait a moment for Firebase to load, then refresh page

**Firebase isn't defined**
- The CDN scripts at lines 101-102 failed to load
- Check that your internet connection is working
- Try hard refresh (Ctrl+Shift+R)

**"Your email domain is not authorized"**
- You haven't added the domain to Firebase yet
- Follow Step 5 above and add `localhost:8000` to authorized domains

**After adding a domain, still getting "unauthorized domain" error**
- Clear browser cache: Ctrl+Shift+Delete
- Close and reopen browser completely
- Try again

## Quick Check List
- [ ] Firebase project created
- [ ] Email/Password auth enabled
- [ ] Config copied to forgot-password.html (lines 109-116)
- [ ] Domains added to authorized list
- [ ] Hard refresh (Ctrl+Shift+R) done
- [ ] Can see form loading at http://localhost:8000/forgot-password.html

## Need Help?
Check browser console (F12) for error messages - they're very descriptive now and will tell you exactly what's wrong.

Common errors:
- `Firebase is not defined` → CDN didn't load
- `apiKey is invalid` → Check copy-paste of config
- `Unauthorized domain` → Add domain to authorized list (Step 5)

