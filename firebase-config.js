/* ======================================
   FIREBASE APP CONFIG
   Update these values from your Firebase project settings.
   ====================================== */

(function () {
    if (typeof firebase === 'undefined') {
        return;
    }

    var firebaseConfig = {
        apiKey: 'AIzaSyCqkiCECkSNO-YN1Hp85RLNFiGDfkBg7Q0',
        authDomain: 'growthlock-6a9e3.firebaseapp.com',
        databaseURL: 'https://growthlock-6a9e3-default-rtdb.firebaseio.com',
        projectId: 'growthlock-6a9e3',
        storageBucket: 'growthlock-6a9e3.firebasestorage.app',
        messagingSenderId: '276084600312',
        appId: '1:276084600312:web:1e42399c45d0c1b9b67a0d'
    };

    try {
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
    } catch (error) {
        console.warn('Firebase initialization skipped:', error && error.message ? error.message : error);
    }
})();
