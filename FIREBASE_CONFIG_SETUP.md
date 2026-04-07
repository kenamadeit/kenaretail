# Firebase Config Quick Setup

## Goal
Make social sign-in work (Google only).

## Checklist
- `firebase-config.js` has the correct Firebase project values.
- Google provider is enabled.
- Authorized domains include localhost and production domain.

## Quick Validation
1. Open `http://localhost:8000/login.html`.
2. Click `Continue with Google` and confirm redirect.
3. Check local storage has `growthlock_currentUser`.

## Common Mistakes
- Opening the app with `file://`.
- Domain not listed in Firebase authorized domains.
