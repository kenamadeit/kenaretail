# Social Authentication Quick Start

## 1) Configure Firebase
1. Open Firebase Console.
2. Enable Google provider.
3. Add authorized domains (`localhost` and your production host).
4. Confirm `firebase-config.js` values.

## 2) Run Locally
1. Start server:
   - `python -m http.server 8000`
2. Open:
   - `http://localhost:8000/login.html`

## 3) Validate Flow
1. Click `Continue with Google`.
2. Confirm redirect to `dashboard.html`.

## 4) Production Check
1. Open `https://your-domain/login.html`.
2. Test Google sign-in.
3. If failure occurs, verify authorized domains and provider config.

## Notes
- Email/password and forgot-password flows are intentionally removed.
