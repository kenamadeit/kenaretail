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

// Populate profile info when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const currentUser = getCurrentUser();
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
            profilePicImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23666" width="100" height="100"/><circle cx="50" cy="30" r="15" fill="%23fff"/><path d="M30 70 Q50 50 70 70" fill="%23fff"/></svg>';
        }
    }

    // Handle profile picture change
    const picInput = document.getElementById('profilePicInput');
    if (picInput) {
        picInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be smaller than 5MB');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const picData = evt.target.result;
                    currentUser.profilePic = picData;
                    // Update in localStorage
                    let users = JSON.parse(localStorage.getItem('growthlock_users'));
                    users = users.map(u => u.id === currentUser.id ? currentUser : u);
                    localStorage.setItem('growthlock_users', JSON.stringify(users));
                    // Update current user
                    localStorage.setItem('growthlock_currentUser', JSON.stringify(currentUser));
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