// MIGRATION SCRIPT: Move localStorage users to Firebase Authentication
// Run this in a secure admin context after Firebase SDK is loaded
// WARNING: Only run once! Do not expose to users.

(async function migrateUsersToFirebase() {
  const users = JSON.parse(localStorage.getItem('growthlock_users') || '[]');
  for (const user of users) {
    if (user.email && user.password) {
      try {
        await firebase.auth().createUserWithEmailAndPassword(user.email, user.password);
        console.log(`Migrated: ${user.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`Already exists in Firebase: ${user.email}`);
        } else {
          console.error(`Error migrating ${user.email}:`, error);
        }
      }
    } else {
      console.warn(`Cannot migrate ${user.email}: password not available`);
    }
  }
  alert('Migration complete! Check console for details.');
})();
