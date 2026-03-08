/* ======================================
   PROGRESS PHOTOS - LOGIC
   Camera Capture, Upload, Gallery Management
   ====================================== */

let currentUser = null;
let stream = null;
let shouldMirrorPreview = false;
let photoGallery = [];
let selectedMonth = 'all';

// ======================================
// INITIALIZATION
// ======================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = getCurrentUser();
    
    // Set up tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Set up button handlers
    document.getElementById('startCameraBtn')?.addEventListener('click', startCamera);
    document.getElementById('capturePhotoBtn')?.addEventListener('click', capturePhoto);
    document.getElementById('stopCameraBtn')?.addEventListener('click', stopCamera);
    document.getElementById('fileInput')?.addEventListener('change', handleFileSelect);
    document.getElementById('uploadLabel')?.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('saveCameraPhotoBtn')?.addEventListener('click', saveCameraPhoto);
    document.getElementById('saveUploadPhotoBtn')?.addEventListener('click', saveUploadPhoto);

    // Check browser compatibility and show warning if needed
    checkBrowserCompatibility();

    // Set up filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedMonth = e.target.dataset.month;
            loadPhotosGallery();
        });
    });

    // Load initial data
    loadPhotosGallery();
    updatePhotoStats();
});

// ======================================
// BROWSER COMPATIBILITY CHECK
// ======================================

function checkBrowserCompatibility() {
    const hasCameraAPI = navigator.mediaDevices ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;

    const warningElement = document.getElementById('browserWarning');
    if (warningElement && !hasCameraAPI) {
        warningElement.style.display = 'block';
    }
}

// ======================================
// TAB SWITCHING
// ======================================

function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // If switching to camera tab, refresh camera
    if (tabName === 'camera') {
        // Camera will be started on click
    }
}

// ======================================
// CAMERA FUNCTIONALITY
// ======================================

async function startCamera() {
    try {
        // Reset any existing stream before requesting a new one.
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        // Check if we're on HTTPS or localhost
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isLocalNetwork = /^192\.168\.|^10\.|^172\./.test(window.location.hostname);

        if (!isSecure && !isLocalNetwork) {
            showNotification('⚠️ Camera requires HTTPS. For mobile testing, use your computer\'s IP address (like 192.168.x.x:8000) or upload photos instead.', 'warning');
            return;
        }

        // Request camera access with mobile-friendly constraints
        const constraints = {
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 }
            },
            audio: false
        };

        // Check browser support for camera APIs
        if (!navigator.mediaDevices && !navigator.webkitGetUserMedia && !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
            showNotification('❌ Camera not supported on this browser/device. Please use a modern browser or upload photos instead.', 'error');
            return;
        }

        // Try modern getUserMedia first, then fallbacks
        let getUserMedia = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        } else if (navigator.webkitGetUserMedia) {
            getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
        } else if (navigator.mozGetUserMedia) {
            getUserMedia = navigator.mozGetUserMedia.bind(navigator);
        } else if (navigator.msGetUserMedia) {
            getUserMedia = navigator.msGetUserMedia.bind(navigator);
        }

        if (!getUserMedia) {
            showNotification('❌ Camera API not available. Try updating your browser or use photo upload.', 'error');
            return;
        }

        // For older browsers, convert callback to promise.
        const requestStream = async (requestedConstraints) => {
            if (getUserMedia.length > 1) {
                return await new Promise((resolve, reject) => {
                    getUserMedia(requestedConstraints, resolve, reject);
                });
            }
            return await getUserMedia(requestedConstraints);
        };

        try {
            stream = await requestStream(constraints);
        } catch (cameraError) {
            // Some devices reject facingMode constraints; retry with generic video.
            stream = await requestStream({ video: true, audio: false });
        }

        const videoTrack = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
        const trackSettings = videoTrack && videoTrack.getSettings ? videoTrack.getSettings() : null;
        shouldMirrorPreview = !!(trackSettings && trackSettings.facingMode === 'user');

        const videoElement = document.getElementById('videoElement');
        if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.setAttribute('playsinline', 'true');
            videoElement.muted = true;
            // Mirror front camera preview so movement feels natural on phones.
            videoElement.style.transform = shouldMirrorPreview ? 'scaleX(-1)' : 'scaleX(1)';
            videoElement.style.transformOrigin = 'center center';
            await videoElement.play();
        }

        // Update button states
        const startBtn = document.getElementById('startCameraBtn');
        const captureBtn = document.getElementById('capturePhotoBtn');
        const stopBtn = document.getElementById('stopCameraBtn');
        if (startBtn) startBtn.style.display = 'none';
        if (captureBtn) captureBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'inline-block';

        showNotification('📷 Camera started! Position yourself and tap Capture.', 'success');
    } catch (error) {
        console.error('Camera error:', error);

        let errorMessage = 'Could not access camera. ';
        let suggestion = '';

        if (error.name === 'NotAllowedError') {
            errorMessage += 'Camera permission denied.';
            suggestion = 'Please enable camera access in your browser settings and refresh the page.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on your device.';
            suggestion = 'Try using a device with a camera or upload photos instead.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage += 'Camera not supported.';
            suggestion = 'Your browser may not support camera access. Try a different browser or upload photos.';
        } else if (error.name === 'SecurityError') {
            errorMessage += 'Camera access blocked for security reasons.';
            suggestion = 'This usually happens when not using HTTPS. For testing, use your computer\'s local IP address.';
        } else if (error.message && error.message.includes('is not an object')) {
            errorMessage += 'Browser compatibility issue.';
            suggestion = 'Your browser may not support camera access. Try updating to a newer version or use photo upload instead.';
        } else {
            errorMessage += error.message || 'Unknown camera error.';
            suggestion = 'Try refreshing the page or use photo upload instead.';
        }

        showNotification(errorMessage, 'error');

        // Show additional help after a delay
        setTimeout(() => {
            if (suggestion) {
                showNotification('💡 ' + suggestion, 'info');
            }
        }, 3000);
    }
}

function capturePhoto() {
    const videoElement = document.getElementById('videoElement');
    const canvasElement = document.getElementById('canvasElement');
    const previewElement = document.getElementById('cameraPreview');

    if (videoElement && canvasElement) {
        if (!stream || !videoElement.videoWidth || !videoElement.videoHeight) {
            showNotification('Camera is not ready yet. Wait a moment and try again.', 'warning');
            return;
        }

        // Set canvas dimensions
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        // Draw video frame to canvas
        const ctx = canvasElement.getContext('2d');
        // Ensure no transform is carried over when capturing the frame.
        if (typeof ctx.resetTransform === 'function') {
            ctx.resetTransform();
        } else {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        if (shouldMirrorPreview) {
            ctx.translate(canvasElement.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(videoElement, 0, 0);

        // Display preview
        canvasElement.toBlob(blob => {
            if (!blob) {
                showNotification('Could not capture this photo. Please try again.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.innerHTML = `
                    <div style="position: relative;">
                        <img src="${e.target.result}" alt="Camera capture" />
                        <div style="margin-top: 10px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px;">
                            Photo captured - Add notes below and save
                        </div>
                    </div>
                `;
            };
            reader.readAsDataURL(blob);
        });

        showNotification('Photo captured! Add notes if desired and tap Save.', 'success');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    const videoElement = document.getElementById('videoElement');
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.style.transform = 'scaleX(1)';
    }

    shouldMirrorPreview = false;

    // Update button states
    document.getElementById('startCameraBtn').style.display = 'inline-block';
    document.getElementById('capturePhotoBtn').style.display = 'none';
    document.getElementById('stopCameraBtn').style.display = 'none';

    showNotification('Camera stopped.', 'info');
}

function saveCameraPhoto() {
    const canvasElement = document.getElementById('canvasElement');
    const captionInput = document.getElementById('cameraCaption');

    if (!canvasElement.width) {
        showNotification('Please capture a photo first.', 'warning');
        return;
    }

    canvasElement.toBlob(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
            savePhoto(e.target.result, captionInput.value);
            // Clear form
            document.getElementById('cameraPreview').innerHTML = '';
            captionInput.value = '';
            // Stop camera
            stopCamera();
        };
        reader.readAsDataURL(blob);
    });
}

// ======================================
// FILE UPLOAD FUNCTIONALITY
// ======================================

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file.', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be smaller than 5MB.', 'error');
        return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewElement = document.getElementById('uploadPreview');
        previewElement.innerHTML = `
            <div style="position: relative;">
                <img src="${e.target.result}" alt="Upload preview" />
                <div style="margin-top: 10px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px;">
                    Image ready - Add notes below and save
                </div>
            </div>
        `;
        // Store the data temporarily
        window.uploadedImageData = e.target.result;
    };
    reader.readAsDataURL(file);

    showNotification('Image selected. Add notes if desired and tap Save.', 'success');
}

function saveUploadPhoto() {
    if (!window.uploadedImageData) {
        showNotification('Please select an image first.', 'warning');
        return;
    }

    const captionInput = document.getElementById('uploadCaption');
    savePhoto(window.uploadedImageData, captionInput.value);
    
    // Clear form
    document.getElementById('uploadPreview').innerHTML = '';
    document.getElementById('uploadCaption').value = '';
    document.getElementById('fileInput').value = '';
    window.uploadedImageData = null;
}

// ======================================
// PHOTO STORAGE
// ======================================

function savePhoto(imageData, caption = '') {
    if (!currentUser) {
        showNotification('User not found. Please login again.', 'error');
        return;
    }

    try {
        // Get existing photos
        const storageKey = `growthlock_photos_${currentUser.id}`;
        let photos = JSON.parse(localStorage.getItem(storageKey)) || [];

        // Create photo object
        const photo = {
            id: Date.now(),
            data: imageData,
            date: new Date().toISOString(),
            caption: caption,
            month: new Date().toISOString().substring(0, 7) // YYYY-MM format
        };

        // Add to array
        photos.push(photo);

        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(photos));

        photoGallery = photos;
        loadPhotosGallery();
        updatePhotoStats();

        showNotification('Photo saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving photo:', error);
        showNotification('Error saving photo. Storage may be full.', 'error');
    }
}

// ======================================
// GALLERY DISPLAY
// ======================================

function loadPhotosGallery() {
    if (!currentUser) return;

    try {
        const storageKey = `growthlock_photos_${currentUser.id}`;
        let photos = JSON.parse(localStorage.getItem(storageKey)) || [];
        photoGallery = photos;

        // Filter by month if selected
        let filteredPhotos = photos;
        if (selectedMonth !== 'all') {
            filteredPhotos = photos.filter(photo => photo.month === selectedMonth);
        }

        // Sort by date descending (newest first)
        filteredPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));

        const galleryContainer = document.getElementById('photosGallery');
        if (!galleryContainer) return;

        if (filteredPhotos.length === 0) {
            galleryContainer.innerHTML = '<div class="no-photos-message">No photos yet. Start by capturing or uploading your first progress photo!</div>';
            return;
        }

        galleryContainer.innerHTML = filteredPhotos.map((photo, index) => {
            const date = new Date(photo.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });

            return `
                <div class="photo-card" onclick="viewPhoto(${index})">
                    <img src="${photo.data}" alt="Progress photo">
                    <div class="photo-card-info">
                        <div class="photo-date">${dateStr}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Update month options
        updateMonthFilters();

    } catch (error) {
        console.error('Error loading gallery:', error);
        showNotification('Error loading photos.', 'error');
    }
}

function updateMonthFilters() {
    if (!currentUser) return;

    try {
        const storageKey = `growthlock_photos_${currentUser.id}`;
        let photos = JSON.parse(localStorage.getItem(storageKey)) || [];

        // Get unique months
        const months = new Set();
        photos.forEach(photo => {
            months.add(photo.month);
        });

        const monthArray = Array.from(months).sort().reverse();

        const filterContainer = document.querySelector('.gallery-filters');
        if (!filterContainer) return;

        // Preserve "All" button
        filterContainer.innerHTML = '<button class="filter-btn active" data-month="all">All Photos</button>';

        monthArray.forEach(month => {
            const date = new Date(month + '-01');
            const monthStr = date.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });

            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.month = month;
            btn.textContent = monthStr;
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                selectedMonth = month;
                loadPhotosGallery();
            });

            filterContainer.appendChild(btn);
        });

    } catch (error) {
        console.error('Error updating month filters:', error);
    }
}

function viewPhoto(index) {
    const storageKey = `growthlock_photos_${currentUser.id}`;
    const photos = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Apply same filter as gallery
    let filteredPhotos = photos;
    if (selectedMonth !== 'all') {
        filteredPhotos = photos.filter(photo => photo.month === selectedMonth);
    }
    filteredPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));

    const photo = filteredPhotos[index];
    if (!photo) return;

    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalInfo = document.getElementById('modalInfo');

    const date = new Date(photo.date);
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    modalImage.src = photo.data;
    modalInfo.innerHTML = `
        <strong>${dateStr}</strong><br>
        ${photo.caption ? `<em>${photo.caption}</em>` : 'No notes'}
    `;

    modal.classList.add('show');
}

// ======================================
// COMPARISON SECTION
// ======================================

function loadComparison() {
    if (!currentUser) return;

    try {
        const storageKey = `growthlock_photos_${currentUser.id}`;
        const photos = JSON.parse(localStorage.getItem(storageKey)) || [];

        if (photos.length === 0) {
            return;
        }

        // Sort by date
        photos.sort((a, b) => new Date(a.date) - new Date(b.date));

        const beforeSection = document.getElementById('beforePhoto');
        const afterSection = document.getElementById('afterPhoto');
        const statsSection = document.getElementById('comparisonStats');

        if (!beforeSection || !afterSection) return;

        const firstPhoto = photos[0];
        const latestPhoto = photos[photos.length - 1];

        const firstDate = new Date(firstPhoto.date);
        const latestDate = new Date(latestPhoto.date);
        const daysPassed = Math.floor((latestDate - firstDate) / (1000 * 60 * 60 * 24));
        const monthsPassed = Math.floor(daysPassed / 30);

        beforeSection.innerHTML = `<img src="${firstPhoto.data}" alt="Before photo">`;
        afterSection.innerHTML = `<img src="${latestPhoto.data}" alt="After photo">`;

        if (statsSection) {
            statsSection.innerHTML = `
                <strong>Progress Summary:</strong><br>
                Started: ${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br>
                Current: ${latestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br>
                Duration: ${monthsPassed} months, ${daysPassed % 30} days<br>
                Total Photos: ${photos.length}
            `;
        }

    } catch (error) {
        console.error('Error loading comparison:', error);
    }
}

// ======================================
// STATISTICS
// ======================================

function updatePhotoStats() {
    if (!currentUser) return;

    try {
        const storageKey = `growthlock_photos_${currentUser.id}`;
        const photos = JSON.parse(localStorage.getItem(storageKey)) || [];

        // Calculate current month streak
        const currentMonth = new Date().toISOString().substring(0, 7);
        const currentMonthPhotos = photos.filter(p => p.month === currentMonth);

        // Calculate months with photos
        const monthsWithPhotos = new Set();
        photos.forEach(photo => monthsWithPhotos.add(photo.month));

        // Update stats
        const totalPhotosEl = document.getElementById('totalPhotos');
        const thisMonthEl = document.getElementById('thisMonth');
        const monthStreakEl = document.getElementById('monthStreak');

        if (totalPhotosEl) totalPhotosEl.textContent = photos.length;
        if (thisMonthEl) thisMonthEl.textContent = currentMonthPhotos.length;
        if (monthStreakEl) monthStreakEl.textContent = monthsWithPhotos.size;

        // Load comparison
        loadComparison();

    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// ======================================
// MODAL HANDLING
// ======================================

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Close modal when clicking outside image
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePhotoModal();
            }
        });
    }

    // Close button
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closePhotoModal);
    }
});

// ======================================
// NOTIFICATIONS
// ======================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-size: 13px;
        font-weight: 600;
        z-index: 9999;
        animation: slideInDown 0.3s ease;
        max-width: 300px;
    `;

    const colors = {
        'success': 'rgba(76, 175, 80, 0.9)',
        'error': 'rgba(244, 67, 54, 0.9)',
        'warning': 'rgba(255, 152, 0, 0.9)',
        'info': 'rgba(33, 150, 243, 0.9)'
    };

    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInUp 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ======================================
// LOGOUT FUNCTIONALITY
// ======================================

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Stop camera if running
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        logout();
        window.location.href = 'index.html';
    }
}

window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    shouldMirrorPreview = false;
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        shouldMirrorPreview = false;

        const videoElement = document.getElementById('videoElement');
        if (videoElement) {
            videoElement.srcObject = null;
        }

        const startBtn = document.getElementById('startCameraBtn');
        const captureBtn = document.getElementById('capturePhotoBtn');
        const stopBtn = document.getElementById('stopCameraBtn');
        if (startBtn) startBtn.style.display = 'inline-block';
        if (captureBtn) captureBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';
    }
});