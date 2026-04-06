import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PrayerTimesService, PrayerTimes } from './prayer-times.service';
import { FirestoreService, Streak } from './firestore.service';
import { BackgroundNotificationService } from './background-notification.service';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

export interface ScheduledNotification {
  id: string;
  type: 'prayer' | 'morning-checkin' | 'evening-reflection' | 'weekly-summary';
  title: string;
  message: string;
  scheduledTime: Date;
  prayerName?: string; // For prayer notifications
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSchedulerService {
  private notificationService = inject(NotificationService);
  private preferencesService = inject(NotificationPreferencesService);
  private prayerTimesService = inject(PrayerTimesService);
  private firestoreService = inject(FirestoreService);
  private backgroundNotificationService = inject(BackgroundNotificationService);

  private scheduledNotifications$ = new BehaviorSubject<ScheduledNotification[]>([]);
  private isRunning = false;
  private checkInterval: number | null = null;
  private notificationTimers: Map<string, number> = new Map();

  getScheduledNotifications(): Observable<ScheduledNotification[]> {
    return this.scheduledNotifications$.asObservable();
  }

  /**
   * Start the notification scheduler
   * Calculates all notifications for the day and schedules them
   */
  async startScheduler(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🔔 Notification scheduler started');

    // Initial calculation
    await this.calculateAndScheduleNotifications();

    // Recalculate at midnight daily (handles day changes)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.calculateAndScheduleNotifications();
      
      // Then repeat every 24 hours
      this.checkInterval = setInterval(() => {
        this.calculateAndScheduleNotifications();
      }, 24 * 60 * 60 * 1000) as unknown as number;
    }, timeUntilMidnight);
  }

  /**
   * Stop the notification scheduler
   */
  stopScheduler(): void {
    this.isRunning = false;
    
    // Clear all pending timers
    this.notificationTimers.forEach(timer => clearTimeout(timer));
    this.notificationTimers.clear();

    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
    }

    this.scheduledNotifications$.next([]);
    console.log('🔔 Notification scheduler stopped');
  }

  /**
   * Calculate all notifications for today and schedule them
   */
  private async calculateAndScheduleNotifications(): Promise<void> {
    const prefs = this.preferencesService.getPreferencesValue();
    if (!prefs || !prefs.pushEnabled) return;

    const scheduled: ScheduledNotification[] = [];

    // Clear existing timers
    this.notificationTimers.forEach(timer => clearTimeout(timer));
    this.notificationTimers.clear();

    // 1. Prayer time notifications
    this.prayerTimesService.getPrayerTimes().pipe(take(1)).subscribe(prayerTimes => {
      if (prefs.prayerNotifications && prayerTimes) {
        const prayerNotifications = this.schedulePrayerNotifications(
          prayerTimes,
          prefs.prayerNotificationMinutesBeforePrayer
        );
        scheduled.push(...prayerNotifications);
      }

      // 2. Morning check-in notification
      if (prefs.morningCheckInEnabled) {
        const morningNotif = this.scheduleDailyNotification(
          'morning-checkin',
          '🌅 Good Morning!',
          `Time to check in on your streaks today`,
          prefs.morningCheckInTime
        );
        if (morningNotif) scheduled.push(morningNotif);
      }

      // 3. Evening reflection notification
      if (prefs.eveningReflectionEnabled) {
        const eveningNotif = this.scheduleDailyNotification(
          'evening-reflection',
          '🌙 Evening Reflection',
          `How did your streaks go today?`,
          prefs.eveningReflectionTime
        );
        if (eveningNotif) scheduled.push(eveningNotif);
      }

      // 4. Weekly summary notification
      if (prefs.weeklySummaryEnabled) {
        const weeklyNotif = this.scheduleWeeklyNotification(
          'weekly-summary',
          '📊 Weekly Summary',
          `Your weekly streak progress is ready`,
          prefs.weeklySummaryDay,
          prefs.weeklySummaryTime
        );
        if (weeklyNotif) scheduled.push(weeklyNotif);
      }

      // Schedule all notifications
      scheduled.forEach(notif => this.scheduleNotification(notif));
      this.scheduledNotifications$.next(scheduled);

      console.log(`📅 Scheduled ${scheduled.length} notifications for today`);
    });
  }

  /**
   * Schedule prayer time notifications
   */
  private schedulePrayerNotifications(prayerTimes: PrayerTimes, minutesBefore: number): ScheduledNotification[] {
    const notifications: ScheduledNotification[] = [];
    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha }
    ];

    prayers.forEach(prayer => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes - minutesBefore, 0, 0);

      // Only schedule if time is in the future
      if (notificationTime > new Date()) {
        notifications.push({
          id: `prayer-${prayer.name.toLowerCase()}`,
          type: 'prayer',
          title: `⏰ ${prayer.name} Adhan`,
          message: `${prayer.name} prayer is in ${minutesBefore} minutes`,
          scheduledTime: notificationTime,
          prayerName: prayer.name
        });
      }
    });

    return notifications;
  }

  /**
   * Schedule a daily notification at specific time
   */
  private scheduleDailyNotification(
    type: 'morning-checkin' | 'evening-reflection',
    title: string,
    message: string,
    timeString: string // HH:MM format
  ): ScheduledNotification | null {
    const [hours, minutes] = timeString.split(':').map(Number);
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (notificationTime <= new Date()) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    return {
      id: `${type}-${new Date().toISOString().split('T')[0]}`,
      type: type as any,
      title,
      message,
      scheduledTime: notificationTime
    };
  }

  /**
   * Schedule a weekly notification
   */
  private scheduleWeeklyNotification(
    type: 'weekly-summary',
    title: string,
    message: string,
    dayOfWeek: string,
    timeString: string // HH:MM format
  ): ScheduledNotification | null {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dayMap: Record<string, number> = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    const targetDay = dayMap[dayOfWeek];
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);

    // Calculate days until target day
    const currentDay = notificationTime.getDay();
    let daysUntilTarget = (targetDay - currentDay + 7) % 7;
    
    // If target day is today and time has passed, schedule for next week
    if (daysUntilTarget === 0 && notificationTime <= new Date()) {
      daysUntilTarget = 7;
    }

    notificationTime.setDate(notificationTime.getDate() + daysUntilTarget);

    return {
      id: `weekly-summary-${dayOfWeek}`,
      type,
      title,
      message,
      scheduledTime: notificationTime
    };
  }

  /**
   * Schedule a single notification
   */
  private scheduleNotification(notif: ScheduledNotification): void {
    const now = new Date();
    const timeUntilNotification = notif.scheduledTime.getTime() - now.getTime();

    if (timeUntilNotification > 0) {
      const timer = setTimeout(() => {
        this.sendNotification(notif);
      }, timeUntilNotification);

      this.notificationTimers.set(notif.id, timer);
    }
  }

  /**
   * Send a notification (both push + in-app)
   * Uses Service Worker for background notifications when available
   */
  private async sendNotification(notif: ScheduledNotification): Promise<void> {
    // Check if notifications are allowed (quiet hours, etc.)
    if (!this.preferencesService.isNotificationAllowed()) {
      console.log(`⏸️ Notification skipped (quiet hours): ${notif.title}`);
      return;
    }

    // In-app notification (visible when app is open)
    this.notificationService.info(`${notif.title}: ${notif.message}`, 5000);

    // Background notification via Service Worker (works when browser is minimized)
    if (this.backgroundNotificationService.supportsBackgroundNotifications()) {
      try {
        await this.backgroundNotificationService.sendBackgroundNotification({
          title: notif.title,
          body: notif.message,
          icon: '/islamic-prayer.png',
          badge: '/islamic-badge.png',
          tag: notif.id,
          requireInteraction: notif.type === 'weekly-summary'
        });

        console.log(`✅ Background notification sent: ${notif.title}`);
      } catch (error) {
        console.error('Error sending background notification:', error);
      }
    }

    // Fallback: Browser push notification (older API, less reliable)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/islamic-prayer.png',
          badge: '/islamic-badge.png',
          tag: notif.id,
          requireInteraction: notif.type === 'weekly-summary'
        });

        console.log(`✅ Push notification sent: ${notif.title}`);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  }

  /**
   * Test notification (for settings preview)
   */
  async sendTestNotification(type: 'prayer' | 'morning-checkin' | 'evening-reflection' | 'weekly-summary'): Promise<void> {
    const messages: Record<string, { title: string; message: string }> = {
      'prayer': {
        title: '⏰ Dhuhr Adhan',
        message: 'Dhuhr prayer is in 5 minutes'
      },
      'morning-checkin': {
        title: '🌅 Good Morning!',
        message: 'Time to check in on your streaks today'
      },
      'evening-reflection': {
        title: '🌙 Evening Reflection',
        message: 'How did your streaks go today?'
      },
      'weekly-summary': {
        title: '📊 Weekly Summary',
        message: 'Your weekly streak progress is ready'
      }
    };

    const msg = messages[type];
    const testNotif: ScheduledNotification = {
      id: `test-${Date.now()}`,
      type,
      title: msg.title,
      message: msg.message,
      scheduledTime: new Date()
    };

    await this.sendNotification(testNotif);
  }
}
