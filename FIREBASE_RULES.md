# Firebase Realtime Database Rules for Live Messaging

This project writes live chat data under:

- `growthlock_messages_live/{userId}/{messageId}`

## 1) Quick Test Rules (Open)
Use this only for temporary testing.

```json
{
  "rules": {
    "growthlock_messages_live": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 2) Safer Rules Without Firebase Auth (Recommended for this app today)
These rules are still public, but they validate message shape and reduce abuse.

```json
{
  "rules": {
    "growthlock_messages_live": {
      "$userId": {
        "$messageId": {
          ".read": true,
          ".write": "newData.hasChildren(['id','userId','userName','userEmail','type','text','timestamp']) && newData.child('id').isString() && newData.child('id').val() == $messageId && newData.child('userId').isString() && newData.child('userId').val() == $userId && newData.child('userName').isString() && newData.child('userName').val().length <= 80 && newData.child('userEmail').isString() && newData.child('userEmail').val().length <= 120 && newData.child('type').isString() && (newData.child('type').val() == 'user' || newData.child('type').val() == 'admin') && newData.child('text').isString() && newData.child('text').val().length > 0 && newData.child('text').val().length <= 1000 && newData.child('timestamp').isString()"
        }
      }
    }
  }
}
```

## 3) Best-Practice Rules (Requires Firebase Auth)
For true security, move to Firebase Authentication and then lock to authenticated users/admin.

```json
{
  "rules": {
    "growthlock_messages_live": {
      "$userId": {
        ".read": "auth != null",
        "$messageId": {
          ".write": "auth != null && (auth.uid == $userId || root.child('admins').child(auth.uid).val() == true)"
        }
      }
    },
    "admins": {
      "$uid": {
        ".read": "auth != null && root.child('admins').child(auth.uid).val() == true",
        ".write": "false"
      }
    }
  }
}
```

## How to Apply Rules
1. Open Firebase Console.
2. Go to **Realtime Database** -> **Rules**.
3. Paste one rule set above.
4. Click **Publish**.

## Verify Live Messaging
1. Open `admin.html` and log in.
2. Open `messages.html` in another browser/account.
3. Send a message.
4. Admin should see updates instantly.

If not, check browser console for `PERMISSION_DENIED` or toast messages about live sync.
