# Firebase Setup (Current)

This project now uses social-only authentication with Firebase.

## Required Providers
1. Google (enabled)

## Setup Steps
1. Open Firebase Console.
2. Go to Authentication -> Sign-in method.
3. Enable Google provider.
4. Add authorized domains:
   - `localhost`
   - your production domain (for example `kenaretail.shop`)
5. Confirm `firebase-config.js` contains the correct project config.

## Local Testing
1. Run a local server (do not use `file://`).
2. Open `http://localhost:8000/login.html`.
3. Test Google sign-in.
4. Verify redirect to `dashboard.html`.

## Notes
- Email/password and password reset are intentionally disabled in the app UI.
