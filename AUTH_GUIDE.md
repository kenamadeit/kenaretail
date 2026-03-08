# GrowthLock Authentication Guide

## Current Auth Model
GrowthLock now uses social-only authentication.

Allowed providers:
- Google Sign-In
- Apple Sign-In

Not available:
- Email/password registration
- Email/password login
- Forgot password flow

## Auth Pages
- `login.html`: social sign-in entry page
- `register.html`: social sign-in entry page (same social flow)
- `auth.js`: binds social buttons and manages session persistence in local storage

## Account Creation Behavior
- First sign-in with Google or Apple creates a local app profile automatically.
- Returning sign-ins update local profile metadata and restore session.

## Session Behavior
- Active session key: `growthlock_currentUser`
- User profile list: `growthlock_users`

## Firebase Requirements
1. Firebase project configured in `firebase-config.js`.
2. Google provider enabled in Firebase Authentication.
3. Apple provider enabled in Firebase Authentication.
4. Authorized domains include your production domain and local development host.

## Redirect Behavior
- Successful sign-in redirects to `dashboard.html`.
- Logged-in users visiting auth pages are redirected to `dashboard.html`.

## Removed Legacy Flows
These legacy flows were intentionally removed:
- Password reset page and script
- Manual create account form
- Manual login form
