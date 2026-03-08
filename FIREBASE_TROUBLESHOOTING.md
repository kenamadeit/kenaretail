# Firebase Troubleshooting (Social Auth)

## Scope
Troubleshooting for Google sign-in in GrowthLock.

## Issue: Popup blocked
Fix:
- Allow popups for your site.
- Retry sign-in.

## Issue: auth/operation-not-supported-in-this-environment
Fix:
- Run via `http://localhost` or `https`.
- Do not run from `file://`.

## Issue: auth/invalid-credential
Fix:
- Re-check Firebase provider setup.
- Confirm your current domain is authorized in Firebase.

## Issue: Domain not authorized
Fix:
- Firebase Console -> Authentication -> Settings -> Authorized domains.
- Add your exact host.

## Verify Current Runtime
- `login.html` and `register.html` should show only Google button.
- `auth.js` should manage social sign-in and local session creation.

## Escalation Checklist
1. Verify `firebase-config.js` values.
2. Verify Google provider enabled.
3. Verify authorized domains.
4. Test on a clean browser profile with popups enabled.
