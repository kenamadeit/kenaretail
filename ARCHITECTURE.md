# GrowthLock Architecture Overview

## Authentication Layer
- Entry pages: `login.html`, `register.html`
- Auth runtime: `auth.js`
- Providers: Firebase Google OAuth and Firebase Apple OAuth
- Config: `firebase-config.js`

## User Session/Data Layer
- Local user records: `growthlock_users`
- Active session: `growthlock_currentUser`
- Per-user routine data: `growthlock_routines_<userId>` and `growthlock_custom_<userId>`

## App Layer
- `dashboard.html` and app scripts consume `growthlock_currentUser`.
- Admin tools read aggregated local data from storage for reporting.

## Authentication Flow
1. User opens `login.html` or `register.html`.
2. User chooses Google or Apple.
3. Firebase popup returns user identity.
4. App upserts local profile in `growthlock_users`.
5. App stores session in `growthlock_currentUser`.
6. App redirects to `dashboard.html`.

## Security Notes
- Firebase handles provider authentication.
- App should be run on `http://localhost` or `https` origins.
- Keep authorized domains updated in Firebase console.

## Legacy Removal Status
Removed from active architecture:
- `forgot-password.html`
- `firebase-auth.js`
- Email/password auth and reset paths
