/* ======================================
   GROWTHLOCK - JavaScript Logic
   Mobile-First Hair Growth Tracker
   Production-Ready with localStorage
   ====================================== */

// ======================================
// 1. DATA STRUCTURE & INITIALIZATION
// ======================================

/**
 * Resolve storage keys for the currently signed-in user.
 * Falls back to legacy global keys for backward compatibility.
 */
function getTrackingStorageKeys() {
  let user = null;
  if (typeof getCurrentUser === "function") {
    user = getCurrentUser();
  }

  if (user && user.id) {
    return {
      routinesKey: `growthlock_routines_${user.id}`,
      customKey: `growthlock_custom_${user.id}`
    };
  }

  return {
    routinesKey: "growthlock_routines",
    customKey: "growthlock_custom"
  };
}

/**
 * Routine data structure:
 * {
 *   routineType: [
 *     { date: "MM/DD/YYYY", count: 1-2 },
 *     ...
 *   ]
 * }
 */
const trackingStorageKeys = getTrackingStorageKeys();
const legacyRoutinesData = JSON.parse(localStorage.getItem("growthlock_routines")) || null;
let routinesData = JSON.parse(localStorage.getItem(trackingStorageKeys.routinesKey)) || legacyRoutinesData || {
  minoxidil: [],
  derma: [],
  castor: [],
  rosemary: [],
  custom: []
};

/**
 * Custom routines data structure:
 * [
 *   { id: timestamp, name: "Hair Massage", frequency: "daily", confirmations: [] },
 *   ...
 * ]
 */
const legacyCustomRoutinesData = JSON.parse(localStorage.getItem("growthlock_custom")) || null;
let customRoutines = JSON.parse(localStorage.getItem(trackingStorageKeys.customKey)) || legacyCustomRoutinesData || [];

// Persist migrated user-scoped data when falling back from legacy keys.
if (trackingStorageKeys.routinesKey !== "growthlock_routines" && legacyRoutinesData && !localStorage.getItem(trackingStorageKeys.routinesKey)) {
  localStorage.setItem(trackingStorageKeys.routinesKey, JSON.stringify(legacyRoutinesData));
}
if (trackingStorageKeys.customKey !== "growthlock_custom" && legacyCustomRoutinesData && !localStorage.getItem(trackingStorageKeys.customKey)) {
  localStorage.setItem(trackingStorageKeys.customKey, JSON.stringify(legacyCustomRoutinesData));
}

// Initialize app on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  renderWeeklyOverview();
  updateAllProgress();
  loadCustomRoutines();
  scheduleNotifications();
  renderHeaderNav();
});

// global logout handler (used by nav buttons)
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    logout();
    window.location.href = 'login.html';
  }
}

// populate header navigation links if element exists
function renderHeaderNav() {
  const headerNav = document.getElementById('header-nav');
  if (!headerNav) return;
  if (!isLoggedIn()) return;
  const user = getCurrentUser();
  const href = user.isAdmin ? 'admin.html' : 'profile.html';
  const label = user.isAdmin ? 'Admin' : 'Profile';
  const adminClass = user.isAdmin ? ' admin' : '';

  // append profile/admin link if not already present
  if (!headerNav.querySelector('.nav-link.profile')) {
    const a = document.createElement('a');
    a.href = href;
    a.className = 'nav-link profile' + adminClass;
    a.textContent = `👤 ${label}`;
    headerNav.appendChild(a);
  }
}


/**
 * Initialize the app - set up UI elements and listeners
 */
function initializeApp() {
  updateTodayDate();
  setupOptionalEventListeners();
  renderWeeklyOverview();
}

// ======================================
// 2. DATE & TIME UTILITIES
// ======================================

/**
 * Get current date in MM/DD/YYYY format
 */
function getTodayDate() {
  const today = new Date();
  return today.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

/**
 * Get date string from Date object
 */
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

/**
 * Get date n days ago
 */
function getDateNDaysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return formatDate(date);
}

/**
 * Get day of week abbreviation (Sun, Mon, etc.)
 */
function getDayOfWeekAbbr(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Update header with today's date
 */
function updateTodayDate() {
  const badge = document.getElementById("today-date");
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  if (badge) badge.textContent = dateStr;
}

// ======================================
// 3. ROUTINE CONFIRMATION LOGIC
// ======================================

/**
 * Confirm completion of a routine
 * @param {string} type - Routine type (minoxidil, derma, castor, rosemary)
 * @param {number} maxDaily - Maximum confirmations per day (1 or 2)
 */
function confirmRoutine(type, maxDaily = 1) {
  const today = getTodayDate();
  
  // Initialize routine array if it doesn't exist
  if (!routinesData[type]) {
    routinesData[type] = [];
  }

  // Find entry for today
  let todayEntry = routinesData[type].find(entry => entry.date === today);

  if (!todayEntry) {
    // Create new entry for today
    routinesData[type].push({ date: today, count: 1 });
    showToast(`✓ ${capitalizeType(type)} confirmed (1/${maxDaily})`);
  } else if (todayEntry.count < maxDaily) {
    // Increment count if under limit
    todayEntry.count += 1;
    showToast(`✓ ${capitalizeType(type)} confirmed (${todayEntry.count}/${maxDaily})`);
  } else {
    // Already reached max for today
    showToast(`Already confirmed ${maxDaily}x today for ${capitalizeType(type)}`);
    return;
  }

  // Save and update UI
  saveRoutinesData();
  updateRoutineUI(type);
  updateAllProgress();
  triggerButtonConfirmedAnimation(type);
}

/**
 * Update routine button UI based on today's status
 */
function updateRoutineUI(type) {
  const today = getTodayDate();
  const statusEl = document.getElementById(`${type}-status`);
  
  if (!statusEl) return;

  const todayEntry = routinesData[type]?.find(e => e.date === today);
  
  if (!todayEntry) {
    statusEl.textContent = type === "derma" ? "Not confirmed this week" : "Not confirmed today";
  } else {
    const max = type === "minoxidil" || type === "derma" ? 2 : 1;
    statusEl.textContent = `✓ Confirmed ${todayEntry.count}/${max}`;
  }
}

/**
 * Capitalize routine type for display
 */
function capitalizeType(type) {
  const names = {
    minoxidil: "Minoxidil",
    derma: "Derma Roller",
    castor: "Castor Oil",
    rosemary: "Rosemary Oil"
  };
  return names[type] || type;
}

/**
 * Trigger visual animation for confirmed button
 */
function triggerButtonConfirmedAnimation(type) {
  const button = document.querySelector(`.${type}-btn`);
  if (button) {
    button.classList.add("confirmed");
    setTimeout(() => button.classList.remove("confirmed"), 2000);
  }
}

// ======================================
// 4. PROGRESS TRACKING
// ======================================

/**
 * Calculate current streak based on minoxidil confirmations
 */
function calculateCurrentStreak() {
  const minoxidilEntries = routinesData.minoxidil || [];
  
  if (minoxidilEntries.length === 0) return 0;

  // Sort entries by date (newest first)
  const sortedEntries = [...minoxidilEntries].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  let streak = 0;
  let currentDate = new Date();

  for (let entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    const daysDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate weekly consistency percentage
 */
function calculateWeeklyConsistency() {
  const today = new Date();
  let weekConfirmations = 0;
  
  // Check last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);

    const confirmed = routinesData.minoxidil?.some(e => e.date === dateStr) || false;
    if (confirmed) weekConfirmations++;
  }

  return Math.round((weekConfirmations / 7) * 100);
}

/**
 * Calculate total tracked days across all routines
 */
function calculateTotalTrackedDays() {
  const allDates = new Set();
  
  Object.values(routinesData).forEach(entries => {
    if (Array.isArray(entries)) {
      entries.forEach(entry => {
        if (entry.date) allDates.add(entry.date);
      });
    }
  });

  return allDates.size;
}

/**
 * Calculate completion percentage for this week
 */
function calculateWeeklyCompletionPercentage() {
  const today = new Date();
  let totalPossible = 0;
  let completed = 0;

  // Target: 4x Minoxidil, 2x Derma, 2x Castor, 2x Rosemary = 10 confirmations per week (showing as 14)
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);

    // 2 minoxidil per day = 14 for week
    totalPossible += 2;

    const minoxEntry = routinesData.minoxidil?.find(e => e.date === dateStr);
    if (minoxEntry) completed += minoxEntry.count || 1;
  }

  return { completed: Math.min(completed, totalPossible), totalPossible };
}

/**
 * Update all progress displays
 */
function updateAllProgress() {
  updateStreakDisplay();
  updateWeeklyDisplay();
  updateTotalTrackedDisplay();
  updateProgressBar();
  updateStatsDisplay();
  updateAllRoutineUI();
}

// ======================================
// 8. NOTIFICATION SETTINGS
// ======================================

/**
 * Read stored notification times for current user.
 * Returns array of strings ["HH:MM","HH:MM"]
 */
function getNotificationTimes() {
  const user = getCurrentUser();
  if (!user) return ['', ''];
  const key = `growthlock_notifications_${user.id}`;
  return JSON.parse(localStorage.getItem(key)) || ['', ''];
}

/**
 * Save array of times for current user.
 */
function saveNotificationTimes(times) {
  const user = getCurrentUser();
  if (!user) return;
  const key = `growthlock_notifications_${user.id}`;
  localStorage.setItem(key, JSON.stringify(times));
}

/**
 * Schedule browser notifications based on stored times.
 * Runs every second and fires when hour:minute matches.
 */
function scheduleNotifications() {
  if (!isLoggedIn()) return;
  const times = getNotificationTimes();
  if (!Array.isArray(times) || times.length === 0) return;

  // request permission once
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }

  // clear existing interval
  if (window.notificationInterval) {
    clearInterval(window.notificationInterval);
  }

  window.notificationInterval = setInterval(() => {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0,5);
    times.forEach(t => {
      if (t && t === hhmm && now.getSeconds() === 0) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('GrowthLock Reminder', { body: 'Time to follow your routine!' });
        }
      }
    });
  }, 1000);
}


/**
 * Update streak display
 */
function updateStreakDisplay() {
  const streak = calculateCurrentStreak();
  const display = document.getElementById("streak-display");
  if (display) {
    display.textContent = streak;
  }
}

/**
 * Update weekly consistency display
 */
function updateWeeklyDisplay() {
  const weekly = calculateWeeklyConsistency();
  const display = document.getElementById("weekly-display");
  if (display) {
    display.textContent = weekly;
  }
}

/**
 * Update total tracked days display
 */
function updateTotalTrackedDisplay() {
  const total = calculateTotalTrackedDays();
  const display = document.getElementById("total-tracked");
  if (display) {
    display.textContent = total;
  }
}

/**
 * Update progress bar
 */
function updateProgressBar() {
  const { completed, totalPossible } = calculateWeeklyCompletionPercentage();
  const percentage = (completed / totalPossible) * 100;
  
  const barFill = document.getElementById("progress-bar-fill");
  const barText = document.getElementById("progress-bar-text");
  
  if (barFill) {
    barFill.style.width = percentage + "%";
  }
  if (barText) {
    barText.textContent = `${completed}/${totalPossible}`;
  }
}

/**
 * Update stats display
 */
function updateStatsDisplay() {
  const types = ["minoxidil", "derma", "castor", "rosemary"];
  
  types.forEach(type => {
    const count = routinesData[type]?.length || 0;
    const display = document.getElementById(`stat-${type}`);
    if (display) {
      display.textContent = `${count} times`;
    }
  });
}

/**
 * Update UI for all routines
 */
function updateAllRoutineUI() {
  ["minoxidil", "derma", "castor", "rosemary"].forEach(type => updateRoutineUI(type));
}

// ======================================
// 5. WEEKLY OVERVIEW
// ======================================

/**
 * Render weekly overview grid
 */
function renderWeeklyOverview() {
  const container = document.getElementById("week-grid");
  if (!container) return;

  container.innerHTML = "";

  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayAbbr = getDayOfWeekAbbr(date);

    // Check if minoxidil was confirmed
    const isCompleted = routinesData.minoxidil?.some(e => e.date === dateStr) || false;

    const dayCell = document.createElement("div");
    dayCell.className = `day-cell ${isCompleted ? "completed" : ""}`;
    dayCell.innerHTML = `
      <span class="day-label">${dayAbbr}</span>
      <div class="day-indicator"></div>
    `;

    container.appendChild(dayCell);
  }
}

// ======================================
// 6. CUSTOM ROUTINES
// ======================================

/**
 * Add a new custom routine
 */
function addCustomRoutine() {
  const nameInput = document.getElementById("routine-name");
  const frequencySelect = document.getElementById("routine-frequency");

  const name = nameInput?.value?.trim();
  const frequency = frequencySelect?.value || "daily";

  if (!name) {
    showToast("Please enter a routine name");
    return;
  }

  const routine = {
    id: Date.now(),
    name: name,
    frequency: frequency,
    confirmations: []
  };

  customRoutines.push(routine);
  saveCustomRoutines();
  
  if (nameInput) nameInput.value = "";
  if (frequencySelect) frequencySelect.value = "daily";
  
  loadCustomRoutines();
  showToast(`✓ Routine "${name}" added!`);
}

/**
 * Load and display custom routines
 */
function loadCustomRoutines() {
  const container = document.getElementById("custom-routines-list");
  if (!container) return;

  container.innerHTML = "";

  if (customRoutines.length === 0) {
    container.innerHTML = '<p class="reminder-empty">No custom routines yet. Add one above!</p>';
    return;
  }

  customRoutines.forEach(routine => {
    const today = getTodayDate();
    const confirmed = routine.confirmations.includes(today);

    const item = document.createElement("div");
    item.className = "custom-routine-item";
    item.innerHTML = `
      <div>
        <div class="routine-name">${routine.name}</div>
        <div class="routine-frequency">${routine.frequency}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="delete-routine-btn" onclick="deleteCustomRoutine(${routine.id})">Delete</button>
      </div>
    `;

    // Make clickable to confirm
    item.style.cursor = "pointer";
    item.onclick = () => toggleCustomRoutineConfirmation(routine.id);
    if (confirmed) {
      item.style.background = "rgba(76, 175, 80, 0.2)";
      item.style.borderColor = "rgba(129, 199, 132, 0.5)";
    }

    container.appendChild(item);
  });
}

/**
 * Toggle confirmation for custom routine
 */
function toggleCustomRoutineConfirmation(id) {
  const routine = customRoutines.find(r => r.id === id);
  if (!routine) return;

  const today = getTodayDate();
  const index = routine.confirmations.indexOf(today);

  if (index > -1) {
    routine.confirmations.splice(index, 1);
    showToast(`Removed confirmation for ${routine.name}`);
  } else {
    routine.confirmations.push(today);
    showToast(`✓ ${routine.name} confirmed!`);
  }

  saveCustomRoutines();
  loadCustomRoutines();
}

/**
 * Delete a custom routine
 */
function deleteCustomRoutine(id) {
  const routine = customRoutines.find(r => r.id === id);
  if (!routine) return;

  if (confirm(`Delete "${routine.name}"?`)) {
    customRoutines = customRoutines.filter(r => r.id !== id);
    saveCustomRoutines();
    loadCustomRoutines();
    showToast(`✓ Routine deleted`);
  }
}

// ======================================
// 7. REMINDERS
// ======================================

/**
 * Generate and display reminders
 */
function generateReminders() {
  const container = document.getElementById("reminder-list");
  if (!container) return;

  const today = getTodayDate();
  const reminders = [];

  // Check minoxidil (2x daily)
  const minoxEntry = routinesData.minoxidil?.find(e => e.date === today);
  if (!minoxEntry || minoxEntry.count < 2) {
    const remaining = minoxEntry ? 2 - minoxEntry.count : 2;
    reminders.push(`💧 Don't forget ${remaining} more Minoxidil confirmation${remaining > 1 ? 's' : ''} today!`);
  }

  // Check derma roller (2x weekly)
  let dermaThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    if (routinesData.derma?.some(e => e.date === dateStr)) {
      dermaThisWeek++;
    }
  }
  if (dermaThisWeek < 2) {
    reminders.push(`🔄 Derma roller: ${dermaThisWeek}/2 this week`);
  }

  // Custom routine reminders
  customRoutines.forEach(routine => {
    const confirmed = routine.confirmations.includes(today);
    if (!confirmed && routine.frequency === "daily") {
      reminders.push(`🔹 Don't forget: ${routine.name}`);
    }
  });

  container.innerHTML = "";

  if (reminders.length === 0) {
    container.innerHTML = '<li class="reminder-empty">🎉 All set! You\'ve completed your routines!</li>';
    return;
  }

  reminders.forEach(reminder => {
    const item = document.createElement("li");
    item.className = "reminder-item";
    item.textContent = reminder;
    container.appendChild(item);
  });
}

// ======================================
// 8. STORAGE MANAGEMENT
// ======================================

/**
 * Save routines data to localStorage
 */
function saveRoutinesData() {
  localStorage.setItem(trackingStorageKeys.routinesKey, JSON.stringify(routinesData));
  generateReminders();
}

/**
 * Save custom routines to localStorage
 */
function saveCustomRoutines() {
  localStorage.setItem(trackingStorageKeys.customKey, JSON.stringify(customRoutines));
}

/**
 * Reset all data with confirmation
 */
function resetData() {
  if (confirm("⚠️  Are you sure? This will delete ALL tracking data.\n\nThis cannot be undone.")) {
    if (confirm("Really sure? Click OK to confirm.")) {
      routinesData = {
        minoxidil: [],
        derma: [],
        castor: [],
        rosemary: [],
        custom: []
      };
      customRoutines = [];
      localStorage.removeItem(trackingStorageKeys.routinesKey);
      localStorage.removeItem(trackingStorageKeys.customKey);
      updateAllProgress();
      loadCustomRoutines();
      renderWeeklyOverview();
      showToast("✓ All data has been reset");
    }
  }
}

/**
 * Export data as JSON file
 */
function exportData() {
  const exportData = {
    exportDate: new Date().toISOString(),
    routines: routinesData,
    customRoutines: customRoutines
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `growthlock-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast("✓ Data exported successfully");
}

// ======================================
// 9. UI NOTIFICATIONS
// ======================================

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// ======================================
// 10. OPTIONAL EVENT LISTENERS
// ======================================

/**
 * Setup optional event listeners
 */
function setupOptionalEventListeners() {
  // Enter key to add custom routine
  const routineNameInput = document.getElementById("routine-name");
  if (routineNameInput) {
    routineNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addCustomRoutine();
      }
    });
  }

  // Generate reminders on init
  generateReminders();
}

// ======================================
// 11. AUTO-REFRESH
// ======================================

// Refresh UI every minute to keep data current
setInterval(() => {
  const currentDate = getTodayDate();
  updateAllProgress();
  generateReminders();
}, 60000);

// Initialize UI
updateProgress();