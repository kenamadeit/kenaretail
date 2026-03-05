# 🔧 Firebase Password Reset - Troubleshooting Guide

## Common Issues & Solutions

---

## ❌ "Firebase is not defined"

### Cause
Firebase CDN script not loading or not loaded yet.

### Solution
1. **Check internet connection** - Firebase needs internet
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Hard refresh page** (Ctrl+F5)
4. **Check browser console** (F12 → Console tab)
5. Verify CDN URLs in `forgot-password.html`:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js"></script>
   ```

---

## ❌ "Your API key is invalid"

### Cause
Firebase config credentials are incorrect or incomplete.

### Solution
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click your project → **Project Settings** (⚙️ icon)
3. Go to **"Your apps"** section
4. Click the web app (🌐)
5. Copy the entire `firebaseConfig` object
6. **Replace** ALL values in `forgot-password.html`:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_ACTUAL_API_KEY",
       authDomain: "YOUR_ACTUAL_DOMAIN.firebaseapp.com",
       projectId: "YOUR_ACTUAL_PROJECT_ID",
       storageBucket: "YOUR_ACTUAL_BUCKET.appspot.com",
       messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
       appId: "YOUR_ACTUAL_APP_ID"
   };
   ```

---

## ❌ "auth/operation-not-allowed"

### Cause
Email/Password authentication not enabled in Firebase.

### Solution
1. Go to Firebase Console → **Authentication**
2. Click **"Sign-in method"** tab
3. Click **"Email/Password"**
4. Toggle **"Enable"** to ON
5. Click **"Save"**
6. Refresh your app (Ctrl+F5)

---

## ❌ Not receiving password reset emails

### Cause
Multiple possible reasons

### Solutions

**Solution 1: Check spam folder**
- Gmail: Look in **Spam** & **Promotions** tabs
- Outlook: Check **Junk** folder
- Yahoo: Check **Spam** folder

**Solution 2: Verify authorized domains**
1. Firebase Console → **Authentication** → **Settings**
2. Scroll to **"Authorized domains"**
3. Add your domain:
   - Testing: Add `localhost:8000`
   - Phone: Add `172.20.10.2:8000`
   - Production: Add your actual domain
4. Click **"Add domain"**

**Solution 3: Check email templates**
1. Firebase Console → **Authentication** → **Templates**
2. Click **"Password reset"**
3. Verify email is enabled (should show)
4. Check "Sender" name is set
5. Leave template as default (or customize)
6. Click **"Save"**

**Solution 4: Wait a few seconds**
- Emails sometimes take 30-60 seconds
- Try waiting before retrying

**Solution 5: Check account email**
- Verify email was typed correctly
- No extra spaces

---

## ❌ "auth/too-many-requests"

### Cause
User attempted password reset too many times in short period.

### Solution
- **Wait 5-10 minutes** and try again
- This is security feature (prevents abuse)
- User can try different email if needed

---

## ❌ Reset link not working / "Invalid code"

### Cause
Link expired or mangled in email client.

### Solution
1. **Links expire after 1 hour** - must click within 1 hour
2. Copy-paste long URLs carefully
3. Try clicking link again
4. Restart password reset process
5. Check URL didn't get split across lines in email

---

## ❌ "auth/network-request-failed"

### Cause
Network connectivity issue or firewall blocking Firebase.

### Solution
1. **Check internet connection**
   ```
   Test: Try visiting google.com
   ```

2. **Check firewall/proxy**
   - Try disabling VPN
   - Check company firewall
   - Try different network

3. **Check Firebase domain is reachable**
   ```
   Try accessing: https://console.firebase.google.com
   ```

4. **Clear browser cache** (Ctrl+Shift+Delete)

5. **Try different browser**

---

## ❌ Page stuck on loading spinner

### Cause
Request hanging/not completing.

### Solution
1. **Wait 30 seconds** - sometimes slow networks
2. **Check browser console** (F12 → Console)
3. **Check Firebase config** - verify all values present
4. **Hard refresh** (Ctrl+F5)
5. **Try again** with fresh page load

---

## ❌ "auth/user-not-found"

### Cause
Email doesn't match any registered account.

### Solution
1. **Verify email spelling**
2. **Check correct account email**
3. **Register new account** if needed
4. Ask user to register first

> **Note:** Firebase shows this error for security, but app shows generic message

---

## ❌ Authorized domains error

### Cause
Domain not in Firebase's authorized list.

### Solution
1. Firebase Console → **Authentication** → **Settings**
2. Scroll to **"Authorized domains"**
3. Add your domain:
   ```
   localhost:8000          (local testing)
   172.20.10.2:8000       (phone testing)
   example.com            (production)
   www.example.com        (production)
   ```
4. Click **"Add domain"** for each
5. Wait 2-5 minutes for Firebase to propagate
6. Hard refresh (Ctrl+F5)

---

## ✅ How to Debug

### **Step 1: Open Browser Console**
- **Windows:** Press `F12` or `Ctrl+Shift+I`
- **Mac:** Press `Cmd+Option+I`

### **Step 2: Look for errors**
```javascript
// Good signs:
"✅ Password reset email sent to: user@example.com"

// Bad signs:
"❌ Password reset error: auth/..."
"Firebase is not defined"
"Cannot read property 'auth' of undefined"
```

### **Step 3: Share console errors**
If stuck, copy console error and:
1. Check error code above
2. Reference [Firebase Auth Errors](https://firebase.google.com/docs/auth/troubleshoot-auth)
3. Check project settings match config

---

## 🔍 Testing Checklist

- [ ] Firebase project created
- [ ] Email/Password auth **enabled**
- [ ] Firebase config values **correct**
- [ ] Password reset email template **configured**
- [ ] Authorized domains **added** (localhost:8000, your IP, etc.)
- [ ] Internet connection **working**
- [ ] Browser cache **cleared**
- [ ] Firewall **allows Firebase** (not blocking)
- [ ] Can **open** forgot-password.html
- [ ] **Can submit** email form (not stuck on loading)
- [ ] **Receive email** within 60 seconds
- [ ] Email link **works** (not expired)
- [ ] Can **set new password**
- [ ] **Can login** with new password

---

## 📞 When All Else Fails

1. **Check Firebase Status**
   - Visit [Firebase Status](https://status.firebase.google.com/)
   - Check if service is down

2. **Review Firebase Logs**
   - Firebase Console → **Logs**
   - Look for authentication errors

3. **Test with demo project**
   - Create new Firebase project
   - Test if password reset works
   - Compare settings with your project

4. **Contact Firebase Support**
   - Firebase Console → **?** → **Support**
   - Firebase is usually very responsive

---

## 💡 Pro Tips

✅ **Quick test:** Use test email like `test123@gmail.com`

✅ **Check spam:** Gmail puts password resets in **Promotions** tab often

✅ **Phone testing:** 
```
Add your phone's IP to authorized domains:
172.20.10.2:8000  (your current IP)
```

✅ **Localhost testing:** Always add `localhost:8000` to authorized domains

✅ **Production domains:** Add both `example.com` AND `www.example.com`

✅ **Emails slow?** Firebase sometimes takes 30-60 seconds. Be patient.

✅ **Still stuck?** Enable localStorage debugging:
```javascript
// In browser console:
localStorage.debug = '*';
```

---

## 🎯 Quick Fixes Ranked by Likelihood

1. ✅ **Add localhost:8000 to authorized domains** (90% of issues)
2. ✅ **Verify Firebase config is correct** (5% of issues)
3. ✅ **Enable Email/Password auth** (3% of issues)
4. ✅ **Clear browser cache & hard refresh** (1% of issues)
5. ✅ **Check internet connection** (0.5% of issues)

---

## 🚀 After Troubleshooting

Once working:
- [ ] Test on desktop ✅
- [ ] Test on mobile ✅
- [ ] Test with multiple emails ✅
- [ ] Test error cases (wrong email, etc.) ✅
- [ ] Ready for production! 🎉

