# 🚀 Growthlock Quick Start Guide

## ⚡ 30-Second Setup

1. **Open `index.html`** in your web browser
2. **That's it!** App is ready to use (no installation required)

---

## 📱 First 5 Minutes

### Confirm Your First Routine
```
1. Tap "💧 Minoxidil" button
   → Toast notification: "✓ Minoxidil confirmed (1/2)"
   
2. See status update below button
   → "✓ Confirmed 1/2"
   
3. Tap "✓ Confirmed 1/2" again
   → Toast: "✓ Minoxidil confirmed (2/2)"
```

### Check Your Progress
```
1. Scroll to "📊 Your Progress" section
2. See numbers update:
   → Current Streak: 1
   → Weekly Consistency: 14% (1 day completed)
   → Weekly Target: 1/14
```

### Try Custom Routine
```
1. Scroll to "⚙️ Custom Routines"
2. Enter name: "Hair Massage"
3. Select frequency: "daily"
4. Tap "+ Add Routine"
5. Click the routine to confirm it today
```

---

## 🎯 Common Tasks

### Confirm All Daily Routines
```javascript
// Minoxidil (morning)
confirmRoutine('minoxidil', 2);

// Minoxidil (evening)
confirmRoutine('minoxidil', 2);

// Castor Oil
confirmRoutine('castor', 1);

// Rosemary Oil
confirmRoutine('rosemary', 1);
```

### View Your Stats
- **Current Streak**: Days of consistent Minoxidil use
- **Weekly Consistency**: % of week completed
- **Total Tracked**: Total days with any routine confirmed
- **Weekly Target**: Progress on 14x weekly goal

### Export Your Data
1. Scroll to bottom
2. Tap "📥 Export Progress"
3. File downloads: `growthlock-export-YYYY-MM-DD.json`

---

## 🎨 Understanding the UI

### Color Meanings
- 🔵 **Blue buttons**: Core routines (Minoxidil, Derma)
- 🟢 **Green checkmarks**: Successfully completed
- 🟡 **Yellow reminders**: Tasks remaining today
- ⚫ **Gray indicators**: Not completed

### Animation Feedback
- **Button blink**: Tap confirmed ✨
- **Green pulse**: Routine successfully marked
- **Toast popup**: Action feedback message
- **Progress bar fill**: Real-time progress

---

## 📊 Daily Checklist

```
☐ Morning Minoxidil (1/2)
☐ Morning Castor Oil
☐ Morning Rosemary Oil

☐ Evening Minoxidil (2/2)
☐ Evening Castor Oil
☐ Evening Rosemary Oil

☐ (2x/week) Derma Roller
☐ (Daily) Hair Massage (custom)
```

---

## 💾 Your Data is Saved

- ✅ Automatically saved to browser's localStorage
- ✅ Persists after closing browser
- ✅ Full privacy (no cloud/server)
- ✅ Can export anytime to backup

---

## 🆘 Need Help?

### "Buttons not working?"
→ Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### "Data disappeared?"
→ Check if using private/incognito mode (data won't persist)

### "Want to backup data?"
→ Tap "📥 Export Progress" to download JSON file

### "Need to clear everything?"
→ Scroll to bottom, tap "⟲ Reset All Data" (requires confirmation)

---

## 🎓 Understanding Streaks

### How Streaks Work
A streak = consecutive days with proof of Minoxidil application

```
Example:
Today (3/4):    ✓ Minoxidil confirmed   → Streak = 1 day
Yesterday (3/3): ✓ Minoxidil confirmed   → Streak = 2 days
3 days ago (3/2): ✓ Minoxidil confirmed   → Streak = 3 days
4 days ago (3/1): ✗ Not confirmed        → Streak resets to 0
```

---

## 📈 Weekly Consistency

### How It's Calculated
```
Completed days this week: 5 days
÷ Total week days: 7 days
= Consistency: 71%
```

Goal: 100% (complete all 7 days)

---

## 🎯 Target Weekly Confirmations

**14 Total Needed** (2 per day × 7 days)
- Minoxidil: 14 confirmations (2×/day)
- Derma: 2 confirmations (2×/week)
- Custom routines: As defined

---

## 🌟 Pro Tips

1. **Set a Routine**: Confirm at same times daily
2. **Use Reminders**: Check reminder section often
3. **Track Streaks**: Visual motivation for consistency
4. **Custom Routines**: Add specific exercises (e.g., scalp massage)
5. **Export Monthly**: Backup data monthly for safety
6. **Review Weekly**: Check progress every Sunday

---

## 🔗 File Locations

```
Your computer:
c:\Users\Kena\Desktop\ios26\

Files:
- index.html (open this in browser)
- style.css (styling)
- script.js (logic)
- README.md (full documentation)
- QUICKSTART.md (this file)
```

---

## ✅ Verification Checklist

- [ ] index.html opens in browser
- [ ] Buttons respond when clicked
- [ ] Data saves after page refresh
- [ ] Progress numbers update
- [ ] Toast notifications appear
- [ ] Export button downloads file

---

**Ready to start tracking? Open `index.html` now! 🚀**
