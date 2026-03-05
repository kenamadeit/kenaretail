# 🎨 Password Reset UI Screens

## Screen 1: Forgot Password Form

```
┌─────────────────────────────────────┐
│                                     │
│    ✨ GrowthLock                    │
│    Reset Your Password              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Enter your registered email      ││
│  │ address and we'll send you a     ││
│  │ password reset link.             ││
│  │                                  ││
│  │ Email Address *                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ user@example.com               │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ Send Reset Link  >             │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ← Back to Login                  ││
│  └─────────────────────────────────┘│
│                                     │
│  💡 Check your email (including    │
│  spam folder) for the password     │
│  reset link. Click the link to     │
│  create a new password.            │
│                                     │
└─────────────────────────────────────┘
```

---

## Screen 2: Loading State

```
┌─────────────────────────────────────┐
│                                     │
│    ✨ GrowthLock                    │
│    Reset Your Password              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Enter your registered email      ││
│  │ address and we'll send you a     ││
│  │ password reset link.             ││
│  │                                  ││
│  │ Email Address *                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ ••••••••••••••••••••• (disabled)│││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │        ⟳ Sending reset link...   ││
│  │                                  ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

## Screen 3: Success State

```
┌─────────────────────────────────────┐
│                                     │
│    ✨ GrowthLock                    │
│    Reset Your Password              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ┌──────────────────────────────┐ ││
│  │ │✅ Email Sent!                │ ││
│  │ │                              │ ││
│  │ │ A password reset link has    │ ││
│  │ │ been sent to your email.     │ ││
│  │ │ Please check your inbox and  │ ││
│  │ │ follow the link to reset     │ ││
│  │ │ your password.               │ ││
│  │ └──────────────────────────────┘ ││
│  │                                  ││
│  │ 💡 Didn't receive the email?    ││
│  │ Check your spam folder or try  ││
│  │ again.                          ││
│  │                                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ Try Another Email  >           │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ← Back to Login                  ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

## Screen 4: Error State (Invalid Email)

```
┌─────────────────────────────────────┐
│                                     │
│    ✨ GrowthLock                    │
│    Reset Your Password              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ⚠️ Invalid email address format. ││
│  │                                  ││
│  │ Email Address *                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ invalid-email (red border)     │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ Send Reset Link  >             │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ← Back to Login                  ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

## Screen 5: Error State (Too Many Attempts)

```
┌─────────────────────────────────────┐
│                                     │
│    ✨ GrowthLock                    │
│    Reset Your Password              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ┌────────────────────────────────┐││
│  │ │ ❌ Too many reset attempts.    │││
│  │ │ Please try again later         │││
│  │ │ (in 5-10 minutes).             │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ Email Address *                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ user@example.com               │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ Send Reset Link  >             │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ← Back to Login                  ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

## Screen 6: Firebase Email Message

```
┌─────────────────────────────────────┐
│                                     │
│ From: noreply@firebasemail.com      │
│ To: user@example.com                │
│ Subject: Reset your GrowthLock      │
│          password                   │
│                                     │
│ ───────────────────────────────────  │
│                                     │
│ You requested to reset your         │
│ GrowthLock password.                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Reset Password                  │ │
│ │       (BUTTON)                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ This link expires in 1 hour.        │
│                                     │
│ If you didn't request this,         │
│ ignore this email.                  │
│                                     │
│ ---                                 │
│ Firebase Authentication             │
│                                     │
└─────────────────────────────────────┘
```

**User clicks button → Firebase password reset form loads**

---

## Screen 7: Firebase Reset Form (Auto-Generated by Firebase)

```
┌─────────────────────────────────────┐
│                                     │
│  GrowthLock                         │
│  Reset your password?               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ New Password                     ││
│  │ ┌────────────────────────────────┐││
│  │ │ ••••••••••••••••••••••         │││
│  │ └────────────────────────────────┘││
│  │ ⚠️ 8+ chars, uppercase, numbers  ││
│  │                                  ││
│  │ Confirm New Password             ││
│  │ ┌────────────────────────────────┐││
│  │ │ ••••••••••••••••••••••         │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ Save New Password              │││
│  │ └────────────────────────────────┘││
│  └─────────────────────────────────┘│
│                                     │
│ Powered by Firebase                 │
│                                     │
└─────────────────────────────────────┘
```

**User enters new password → Firebase updates password** → Redirects to login

---

## Screen 8: Final - Login with New Password

```
┌─────────────────────────────────────┐
│                                     │
│    ✨ GrowthLock                    │
│    Welcome Back                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Email Address                   ││
│  │ ┌────────────────────────────────┐││
│  │ │ user@example.com               │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ Password                         ││
│  │ ┌────────────────────────────────┐││
│  │ │ ••••••••••••••• (NEW PASSWORD) │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ ┌────────────────────────────────┐││
│  │ │ Login  >                       │││
│  │ └────────────────────────────────┘││
│  │                                  ││
│  │ 🔑 Forgot password?              ││
│  └─────────────────────────────────┘│
│                                     │
│ Don't have an account? Register     │
│                                     │
└─────────────────────────────────────┘
```

**✅ Successfully logged in with new password!**

---

## 📱 Mobile View (Example: iPhone)

```
┌──────────────────┐
│                  │
│ ✨ GrowthLock    │
│ Reset Password   │
│                  │
│ ┌────────────────┐│
│ │ Email *        ││
│ │ ┌──────────────┐││
│ │ │user@example. │││
│ │ │com           │││
│ │ └──────────────┘││
│ │                ││
│ │ ┌──────────────┐││
│ │ │Send Link › ││
│ │ └──────────────┘││
│ │                ││
│ │ ← Back         ││
│ └────────────────┘│
│                  │
│ 💡 Check spam    │
│ folder           │
│                  │
└──────────────────┘
```

---

## Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Background | Sea Blue Gradient | `#0a3d62` → `#1a7fa0` |
| Primary Text | White | `#ffffff` |
| Primary Button | Cyan | `#00d4ff` |
| Success Green | | `#00c864` |
| Error Red | | `#ff6464` |
| Border Glow | Cyan | `rgba(0,212,255,0.3)` |
| Loading Spinner | Cyan | `#00d4ff` |

---

## ✨ Features in Screenshot

✅ Clean, modern design
✅ Clear visual hierarchy
✅ Intuitive user flow
✅ Mobile-responsive
✅ Accessibility color contrast
✅ Loading states
✅ Error feedback
✅ Success confirmation
✅ Professional appearance

