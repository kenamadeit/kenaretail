# Firebase Setup (Current)

This project now uses social-only authentication with Firebase.

## Required Providers
1. Google (enabled)
2. Apple (enabled)

## Setup Steps
1. Open Firebase Console.
2. Go to Authentication -> Sign-in method.
3. Enable Google provider.
4. Enable Apple provider and complete Apple credentials:
   - Apple Team ID
   - Key ID
   - Private key
   - Service ID
5. Add authorized domains:
   - `localhost`
   - your production domain (for example `kenaretail.shop`)
6. Confirm `firebase-config.js` contains the correct project config.

## Local Testing
1. Run a local server (do not use `file://`).
2. Open `http://localhost:8000/login.html`.
3. Test Google sign-in.
4. Test Apple sign-in.
5. Verify redirect to `dashboard.html`.

## Notes
- Email/password and password reset are intentionally disabled in the app UI.
- If Apple popup fails, recheck Apple credentials and authorized domains in Firebase.
