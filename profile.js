// Profile page logic

function getNotificationTimes() {
    const user = getCurrentUser();
    if (!user) return ['', ''];
    const key = `growthlock_notifications_${user.id}`;
    return JSON.parse(localStorage.getItem(key)) || ['', ''];
}

function saveNotificationTimes(times) {
    const user = getCurrentUser();
    if (!user) return;
    const key = `growthlock_notifications_${user.id}`;
    localStorage.setItem(key, JSON.stringify(times));
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        logout();
        window.location.href = 'login.html';
    }
}

function isFirebaseProfileReady() {
    return typeof firebase !== 'undefined' && typeof firebase.storage === 'function' && typeof firebase.database === 'function';
}

function getFirebaseProfileRef(userId) {
    if (!userId || !isFirebaseProfileReady()) return null;
    return firebase.database().ref(`growthlock_user_profiles/${userId}`);
}

async function uploadProfilePictureToFirebase(user, file) {
    if (!user || !user.id || !isFirebaseProfileReady()) {
        throw new Error('Firebase profile sync not available');
    }

    const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop().toLowerCase() : 'jpg';
    const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg';
    const storageRef = firebase.storage().ref(`growthlock_profile_pictures/${user.id}/profile.${safeExt}`);

    await storageRef.put(file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: 'public,max-age=31536000'
    });

    const profilePicUrl = await storageRef.getDownloadURL();
    const profileRef = getFirebaseProfileRef(user.id);
    if (profileRef) {
        await profileRef.update({
            profilePicUrl: profilePicUrl,
            email: user.email || '',
            fullname: user.fullname || '',
            updatedAt: new Date().toISOString()
        });
    }

    return profilePicUrl;
}

async function loadProfilePictureFromFirebase(user) {
    if (!user || !user.id || !isFirebaseProfileReady()) return null;
    const profileRef = getFirebaseProfileRef(user.id);
    if (!profileRef) return null;

    const snapshot = await profileRef.once('value');
    const data = snapshot.val();
    return data && data.profilePicUrl ? data.profilePicUrl : null;
}

function getDefaultProfilePicture() {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23666" width="100" height="100"/><circle cx="50" cy="30" r="15" fill="%23fff"/><path d="M30 70 Q50 50 70 70" fill="%23fff"/></svg>';
}

function persistProfilePictureForUser(user, profilePicData) {
    if (!user || !user.id) return null;

    const users = getAllUsers();
    let found = false;
    const updatedUsers = users.map((existingUser) => {
        if (existingUser.id === user.id || existingUser.email === user.email) {
            found = true;
            return { ...existingUser, profilePic: profilePicData };
        }
        return existingUser;
    });

    if (!found) {
        updatedUsers.push({ ...user, profilePic: profilePicData });
    }

    saveUsers(updatedUsers);

    const refreshedUser = { ...user, profilePic: profilePicData };
    localStorage.setItem('growthlock_currentUser', JSON.stringify(refreshedUser));
    return refreshedUser;
}

// Populate profile info when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    let currentUser = getCurrentUser();
    document.getElementById('profileName').textContent = currentUser.fullname;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('user-header').textContent = `Welcome, ${currentUser.fullname}`;

    // stats
    document.getElementById('statStreak').textContent = calculateCurrentStreak();
    document.getElementById('statWeekly').textContent = calculateWeeklyConsistency() + '%';
    document.getElementById('statTotal').textContent = calculateTotalTrackedDays();

    // Load profile picture
    const profilePicImg = document.getElementById('profilePicImg');
    if (profilePicImg) {
        if (currentUser.profilePic) {
            profilePicImg.src = currentUser.profilePic;
        } else {
            profilePicImg.src = getDefaultProfilePicture();
        }
    }

    // Pull remote picture if available so it follows the user across devices.
    loadProfilePictureFromFirebase(currentUser)
        .then((remotePictureUrl) => {
            if (!remotePictureUrl) return;
            currentUser = persistProfilePictureForUser(currentUser, remotePictureUrl) || currentUser;
            if (profilePicImg) {
                profilePicImg.src = remotePictureUrl;
            }
        })
        .catch((error) => {
            console.warn('Could not load Firebase profile picture:', error);
        });

    // Handle profile picture change
    const picInput = document.getElementById('profilePicInput');
    if (picInput) {
        picInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be smaller than 5MB');
                    return;
                }

                if (isFirebaseProfileReady()) {
                    try {
                        const remoteUrl = await uploadProfilePictureToFirebase(currentUser, file);
                        currentUser = persistProfilePictureForUser(currentUser, remoteUrl) || currentUser;
                        profilePicImg.src = remoteUrl;
                        alert('Profile picture updated and synced!');
                        return;
                    } catch (error) {
                        console.warn('Firebase upload failed, saving locally instead:', error);
                    }
                }

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const picData = evt.target.result;
                    currentUser = persistProfilePictureForUser(currentUser, picData) || currentUser;

                    // Display
                    profilePicImg.src = picData;
                    alert('Profile picture updated!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // load saved notification times
    const times = getNotificationTimes();
    if (times[0]) document.getElementById('notifyTime1').value = times[0];
    if (times[1]) document.getElementById('notifyTime2').value = times[1];

    document.getElementById('saveNotifBtn').addEventListener('click', () => {
        const t1 = document.getElementById('notifyTime1').value;
        const t2 = document.getElementById('notifyTime2').value;
        saveNotificationTimes([t1, t2]);
        alert('Notification times saved!');
        // reschedule notifications immediately
        if (typeof scheduleNotifications === 'function') {
            scheduleNotifications();
        }
    });
});