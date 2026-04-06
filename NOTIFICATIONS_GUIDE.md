# 🔔 Background Notifications Guide

## How It Works Now

### Before (Limited)
```
Browser Tab Running ✅ → Notifications appear
Browser Minimized ✅ → Notifications appear
Browser Tab Closed ❌ → NO notifications (setTimeout stops)
```

### After (Full Background Support)
```
Browser Tab Running ✅ → Notifications appear (via in-app toast + Service Worker)
Browser Minimized ✅ → Notifications appear (via Service Worker)
Tab in Background ✅ → Notifications appear (via Service Worker)
Browser Process Running ❌ → Notifications appear (Service Worker continues)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Logs In                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
             ┌─────────────▼─────────────┐
             │ AppComponent.ngOnInit()   │
             └─────────────┬─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐    ┌────────▼────────┐  ┌─────▼──────┐
   │ Register │    │ Load User       │  │ Start      │
   │ Service  │    │ Preferences     │  │ Scheduler  │
   │ Worker   │    │ from Firestore  │  │            │
   └────┬────┘    └────────┬────────┘  └─────┬──────┘
        │                  │                  │
        │                  └──────────┬───────┘
        │                            │
        └────────────────┬───────────┘
                         │
              ┌──────────▼──────────┐
              │ At Scheduled Time   │
              │ (e.g., 8:00 AM)     │
              └──────────┬──────────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
 ┌────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐
 │ Check Quiet│    │ Send        │   │ Send        │
 │ Hours      │    │ In-App      │   │ Background  │
 │            │    │ Toast       │   │ Notification│
 └────┬──────┘    └──────┬──────┘   │ (Service    │
      │                  │          │  Worker)    │
      │         ┌────────┴──────┐   └──────┬──────┘
      └─────────▼─────────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │ User Sees            │
   │ Notification!        │
   │ 🔔 Even when        │
   │   browser minimized  │
   └──────────────────────┘
```

## Component Flow

### 1. Service Worker Registration
```typescript
// AppComponent.registerServiceWorker()
navigator.serviceWorker.register('/service-worker.js')
  ├─ Runs independently in background
  ├─ Handles notifications even when tab is closed
  └─ Updates checked hourly
```

### 2. Notification Scheduling
```typescript
// NotificationSchedulerService.sendNotification()
    │
    ├─ Check if quiet hours enabled → Skip if in quiet period
    │
    ├─ Send In-App Toast (when app is visible)
    │  └─ NotificationService.info()
    │
    └─ Send Background Notification (works when minimized)
       ├─ Service Worker route
       │  └─ Works even when browser minimized/closed
       │
       └─ Fallback Notification API
          └─ Legacy support for older browsers
```

### 3. What Happens at Scheduled Time
```
8:00 AM - Morning Check-in scheduled
    │
    ├─ Is quiet hours enabled? (22:00-07:00)
    │   └─ Yes → Skip notification 🔇
    │   └─ No → Continue
    │
    ├─ Check if morning check-in enabled?
    │   └─ Yes → Send notification
    │   └─ No → Skip
    │
    └─ Send notification via:
       ├─ Service Worker (primary - works minimized) ✅
       └─ Notification API (fallback) ✅
```

## Each User Gets Their Own

```
USER A                          USER B
┌──────────────────┐           ┌──────────────────┐
│ Morning: 08:00   │           │ Morning: 06:30   │
│ Quiet: 22:00-    │           │ Quiet: 23:00-    │
│ Prayer: ON       │           │ Prayer: OFF      │
│ Evening: 20:00   │           │ Evening: OFF     │
└──────┬───────────┘           └──────┬───────────┘
       │                              │
   At 07:45                      At 07:45
       │                              │
   ┌───▼──────────────┐          ┌───▼──────────────┐
   │ 🔔 Notification  │          │ 🔇 No            │
   │ "Morning check"  │          │ notification     │
   │ 8:00 AM still    │          │ (morning is      │
   │ pending          │          │  6:30, already   │
   │                  │          │  showed)         │
   └──────────────────┘          └──────────────────┘
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | Service Worker + Notification API |
| Firefox | ✅ Full | Service Worker + Notification API |
| Safari | ⚠️ Partial | Requires macOS 16+, user permission |
| IE 11 | ❌ No | Use in-app notifications only |

## Features Enabled

### ✅ Works With:
- Browser minimized
- Tab in background (playing other tabs)
- Multiple tabs open
- Device asleep (if browser is minimized but running)

### ⚠️ Limitations:
- Browser process must remain running
- Tab must not be completely closed
- User must grant notification permission
- Requires HTTPS (or localhost for development)

## User Setup

1. **First Time Opening App**:
   - User logs in
   - App requests notification permission: "Allow notifications?"
   - User clicks "Allow"

2. **Customize Notifications**:
   - Settings → Notifications
   - Toggle each notification type
   - Set custom times
   - Set quiet hours
   - Test notifications

3. **Notifications Start**:
   - Service Worker activates
   - Notifications scheduled based on user's timezone & preferences
   - Users see notifications even if browser is minimized

## Code Changes Summary

### New Files:
- `service-worker.js` - Handles background notifications
- `background-notification.service.ts` - Manages Service Worker communication

### Updated Files:
- `app.component.ts` - Registers Service Worker on startup
- `notification-scheduler.service.ts` - Uses Service Worker for notifications

## How to Test

1. **Start the app**:
   ```bash
   npm run build
   npm start
   ```

2. **Create a test notification**:
   - Go to Settings → Notifications
   - Click "Test" button for any notification type
   - See notification appear

3. **Minimize and test**:
   - Minimize the browser window
   - Click "Test" notification button
   - Notification should still appear in system tray

4. **Check logs**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for messages like:
     - "✅ Service Worker registered"
     - "✅ Background notification sent"

## Architecture Benefits

| Feature | Benefit |
|---------|---------|
| Service Worker | Runs independently, survives tab closure |
| Per-User Preferences | Each user gets their own schedule |
| Firestore Storage | Preferences sync across devices |
| Quiet Hours | No notifications during sleep |
| Fallback APIs | Works on older browsers |
| Test Notifications | Users can preview before enabling |

## Security

- ✅ Only authenticated users can access notification settings
- ✅ Each user's preferences isolated in Firestore
- ✅ Service Worker scoped to app domain only
- ✅ No cross-browser notification sharing
- ✅ Notification permission required from browser
