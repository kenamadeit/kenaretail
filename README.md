# 🌟 Growthlock - Hair Growth Tracking App

A modern, iOS 26-inspired web app for tracking hair growth routine adherence with a beautiful glassy UI, sea blue theme, and mobile-first design.

---

## 📋 Features

### Core Tracking
- **Minoxidil Tracking**: Confirm twice daily
- **Derma Roller Tracking**: Confirm twice weekly
- **Oil Routines**: Track Castor Oil and Rosemary Oil applications
- **Custom Routines**: Create and track unlimited custom hair care routines
- **Streak Counter**: Maintain consistent daily habits
- **Weekly Consistency**: Track percentage of successful weeks
- **Progress Visualization**: Interactive weekly overview and progress bars

### User Experience
- **iOS 26-Inspired UI**: Modern, glassy frosted backgrounds with blur effects
- **Sea Blue Theme**: Calming primary color scheme
- **Interactive Buttons**: Blinking/glowing effects on tap/click
- **Toast Notifications**: Real-time feedback for user actions
- **Mobile-First**: Optimized for mobile devices with full responsive design
- **Reminders**: Smart reminders for incomplete routines
- **Quick Stats**: Visual summary of routine completion

### Authentication
- **Social-Only Sign-In**: Google only
- **No Manual Password Flow**: Email/password and password reset are not part of the active UI
- **Firebase Auth**: OAuth popup flow with local session persistence in `growthlock_currentUser`

### Data Management
- **localStorage Persistence**: All data saved locally, no server needed
- **Data Export**: Export tracking data as JSON file
- **Reset Option**: Clear all data with safety confirmations
- **Daily Updates**: Automatic refresh every minute

---

## 🚀 Getting Started

### Installation
Simply open `index.html` in any modern web browser. No installation or dependencies required!

```bash
# Option 1: Direct file open
open index.html

# Option 2: Using a local server (recommended)
python -m http.server 8000
# Then visit: http://localhost:8000
```

### First Time Setup
1. Open the app in your browser
2. Review today's routine cards
3. Click buttons to confirm completed tasks
4. Add custom routines if needed
5. Check progress in the Progress section

### Admin Message Setup (Optional)
To receive user messages via email:

**Option 1: EmailJS (Recommended)**
1. **Sign up for EmailJS** at [emailjs.com](https://www.emailjs.com/)
2. **Create a new email service** (Gmail, Outlook, etc.)
3. **Create an email template** with these variables:
   - `{{to_email}}` - Admin email address
   - `{{from_name}}` - User's name
   - `{{from_email}}` - User's email
   - `{{message}}` - Message content
   - `{{timestamp}}` - When message was sent
   - `{{user_id}}` - User ID
4. **Update `messages.js`** with your EmailJS credentials:
   ```javascript
   const EMAILJS_SERVICE_ID = 'your_service_id';
   const EMAILJS_TEMPLATE_ID = 'your_template_id';
   const EMAILJS_PUBLIC_KEY = 'your_public_key';
   const ADMIN_EMAIL = 'your-admin-email@example.com';
   ```

**Option 2: Webhook (Advanced)**
For custom backend integration, modify the `sendEmailToAdmin()` function to POST to your webhook endpoint.

---

## 📁 File Structure

```
ios26/
├── index.html       # HTML structure - markup for all UI components
├── style.css        # CSS styling - iOS 26 design system & animations
├── script.js        # JavaScript logic - all functionality & data management
└── README.md        # This file
```

### File Sizes & Optimization
- **index.html**: ~8 KB - Clean semantic HTML5
- **style.css**: ~30 KB - Comprehensive design system with animations
- **script.js**: ~18 KB - Fully commented, modular code
- **Total**: ~56 KB - Lightning fast load time ⚡

---

## 🎨 Design System

### Color Palette
- **Primary Sea Blue**: `#0a3d62` to `#1a7fa0` (gradient)
- **Accent Cyan**: `#00d4ff`
- **Success Green**: `#4caf50`
- **Warning Yellow**: `#ffc107`
- **Error Red**: `#f44336`
- **Glass Background**: `rgba(255, 255, 255, 0.08)`

### UI Components

#### Glass Card
Semi-transparent frosted glass effect with:
- 16px backdrop blur
- 1px border with 15% white opacity
- Smooth hover animations
- Nested shadow effects

#### Action Buttons
Interactive buttons with:
- Linear gradient backgrounds
- Blinking animation on tap
- Glow effect on active state
- Confirmed state with green pulse animation

#### Progress Indicators
- Smooth animated progress bars
- Large numeric displays
- Colored status badges
- Week overview grid

---

## 💾 Data Structure

### localStorage Keys

#### `growthlock_routines`
```javascript
{
  minoxidil: [
    { date: "03/04/2026", count: 2 },
    { date: "03/03/2026", count: 2 }
  ],
  derma: [
    { date: "03/02/2026", count: 1 }
  ],
  castor: [{ date: "03/04/2026", count: 1 }],
  rosemary: [{ date: "03/04/2026", count: 1 }]
}
```

#### `growthlock_custom`
```javascript
[
  {
    id: 1709580000000,
    name: "Hair Massage",
    frequency: "daily",
    confirmations: ["03/04/2026", "03/03/2026"]
  }
]
```

---

## 🔧 JavaScript API Reference

### Routine Management

#### `confirmRoutine(type, maxDaily)`
Confirm completion of a routine.
```javascript
confirmRoutine('minoxidil', 2);  // Confirm minoxidil (max 2x daily)
confirmRoutine('derma', 2);      // Confirm derma roller (max 2x weekly)
confirmRoutine('castor', 1);     // Confirm castor oil (max 1x daily)
```

#### `addCustomRoutine()`
Add a new custom routine from form inputs.
```javascript
addCustomRoutine();
```

#### `toggleCustomRoutineConfirmation(id)`
Mark a custom routine as confirmed/unconfirmed for today.
```javascript
toggleCustomRoutineConfirmation(1709580000000);
```

### Progress Calculations

#### `calculateCurrentStreak()`
Returns current consecutive day streak based on Minoxidil confirmations.
```javascript
let streak = calculateCurrentStreak();  // Returns: 15
```

#### `calculateWeeklyConsistency()`
Returns percentage of week completed (0-100).
```javascript
let consistency = calculateWeeklyConsistency();  // Returns: 85
```

#### `calculateTotalTrackedDays()`
Returns total number of days with any routine confirmations.
```javascript
let total = calculateTotalTrackedDays();  // Returns: 42
```

### Utility Functions

#### `updateAllProgress()`
Refresh all progress displays.
```javascript
updateAllProgress();
```

#### `showToast(message, duration)`
Display a toast notification.
```javascript
showToast("✓ Routine confirmed!", 3000);
```

#### `exportData()`
Download tracking data as JSON file.
```javascript
exportData();
```

#### `resetData()`
Clear all data with confirmation prompts.
```javascript
resetData();
```

---

## 📊 Key Calculations

### Streak Calculation
Counts consecutive days with Minoxidil confirmations from today backwards.

### Weekly Consistency
- Looks at last 7 days
- Counts days with Minoxidil confirmation
- Returns percentage: `(confirmed_days / 7) * 100`

### Progress Bar
- Target: 14 Minoxidil confirmations per week (2x daily × 7 days)
- Updates in real-time as routines are confirmed
- Visual feedback with smooth animations

### Reminders Generation
- Automatic daily reminder generation
- Checks incomplete routines
- Suggests remaining confirmations needed
- Considers routine frequency

---

## 🎯 User Workflows

### Daily Workflow
1. Open the app each morning
2. Confirm Minoxidil (1st dose)
3. Confirm any oil applications
4. View reminders for upcoming tasks

### Evening Workflow
1. Confirm Minoxidil (2nd dose)
2. Confirm evening routines
3. Check weekly progress
4. Plan next week if desired

### Weekly Workflow
1. Perform derma roller session
2. Confirm derma roller (1x this week so far)
3. Check weekly consistency percentage
4. Maintain streak for motivation

---

## 📱 Mobile Optimization

### Responsive Breakpoints
- **Mobile** (≤375px): Single column layout, optimized touch targets
- **Tablet** (768px+): 2-column grid layouts
- **Desktop** (1024px+): Full width up to 800px container

### Touch Optimization
- Large tap targets (44px minimum)
- No hover-only interactions
- Mobile-friendly form inputs
- Optimized viewport settings

### Performance
- Pure CSS animations (GPU accelerated)
- Minimal DOM reflows
- Efficient event delegation
- Optimized localStorage usage

---

## 🐛 Troubleshooting

### Data not persisting?
- Check browser localStorage is enabled
- Verify not in private/incognito mode
- Check browser console for errors

### Buttons not responding?
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check JavaScript is enabled

### Streak not calculating correctly?
- Verify dates are in correct format (MM/DD/YYYY)
- Check Minoxidil confirmations exist
- View browser console for any errors

---

## 📈 Future Enhancement Ideas

### Version 2.0
- [ ] Cloud backup with authentication
- [ ] Photo upload for progress tracking
- [ ] Weekly email reminders (requires backend)
- [ ] Habit streak milestones & achievements
- [ ] Dark mode toggle
- [ ] Multiple user profiles
- [ ] Calendar view of history
- [ ] Detailed analytics dashboard

---

## ✨ Code Quality

### Code Organization
- **HTML**: Semantic structure with clear commenting
- **CSS**: Organized by component with logical sections
- **JavaScript**: Modular functions with JSDoc comments
- **Naming**: Descriptive variable and function names

### Standards Compliance
- ✅ Valid HTML5
- ✅ Valid CSS3
- ✅ ES6 JavaScript
- ✅ WCAG Accessibility standards
- ✅ Mobile-responsive design

### Performance
- ⚡ No external dependencies
- ⚡ ~56 KB total file size
- ⚡ Loads in <1 second
- ⚡ 60 FPS animations

---

## 📄 License

This project is open source and available for personal and commercial use.

---

## 🙌 Support

For issues, suggestions, or improvements:
1. Check the Troubleshooting section above
2. Review the code comments for more details
3. Check browser console for error messages

---

**Built with ❤️ for healthy hair growth tracking**

*Last Updated: March 4, 2026*
