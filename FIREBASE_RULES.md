# Firebase Realtime Database Rules

The app currently writes to two Realtime Database paths:

- `growthlock_user_profiles/{userId}`
- `growthlock_messages_live/{userId}/{messageId}`

Use the rules file in [firebase-database.rules.json](firebase-database.rules.json) to replace the expiring Test Mode rules in Firebase Console.

## How to Apply Rules
1. Open Firebase Console.
2. Go to **Realtime Database** -> **Rules**.
3. Paste the contents of [firebase-database.rules.json](firebase-database.rules.json).
4. Click **Publish**.

## Apply From GitHub (Recommended)
1. In GitHub, open **Settings** -> **Secrets and variables** -> **Actions**.
2. Add a repository secret named `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. Put the full JSON content of a Firebase Admin SDK service account key in that secret.
4. Push to `main` (or run the workflow manually in Actions).

The workflow file is [deploy-firebase-rules.yml](.github/workflows/deploy-firebase-rules.yml). It deploys [firebase-database.rules.json](firebase-database.rules.json) to project `growthlock-6a9e3`.

## What The Rules Do
1. Lock everything else down by default.
2. Allow the app’s profile sync to save user profile records.
3. Allow live message records to be saved under each user subtree.
4. Validate the message and profile shape so random data is rejected.

## Important
These rules keep the app working with the current client-side login flow, but they are still broader than a full auth-based design. For stronger security later, move the database access to Firebase Auth + custom claims.
