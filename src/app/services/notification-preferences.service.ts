import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationPreferences {
  userId: string;
  
  // Push notification settings
  pushEnabled: boolean;
  
  // Prayer time notifications
  prayerNotifications: boolean;
  prayerNotificationMinutesBeforePrayer: number; // 0, 5, 10, 15 minutes before
  
  // Morning streak check-in
  morningCheckInEnabled: boolean;
  morningCheckInTime: string; // HH:MM format, e.g., "08:00"
  
  // Evening reflection
  eveningReflectionEnabled: boolean;
  eveningReflectionTime: string; // HH:MM format, e.g., "20:00"
  
  // Weekly summary
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  weeklySummaryTime: string; // HH:MM format, e.g., "10:00"
  
  // Do Not Disturb
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Partial<NotificationPreferences> = {
  pushEnabled: true,
  prayerNotifications: true,
  prayerNotificationMinutesBeforePrayer: 10,
  morningCheckInEnabled: true,
  morningCheckInTime: '08:00',
  eveningReflectionEnabled: true,
  eveningReflectionTime: '20:00',
  weeklySummaryEnabled: true,
  weeklySummaryDay: 'Friday',
  weeklySummaryTime: '10:00',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
};

@Injectable({
  providedIn: 'root'
})
export class NotificationPreferencesService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private preferences$ = new BehaviorSubject<NotificationPreferences | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);

  getPreferences(): Observable<NotificationPreferences | null> {
    return this.preferences$.asObservable();
  }

  getPreferencesValue(): NotificationPreferences | null {
    return this.preferences$.value;
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /**
   * Load user's notification preferences from Firestore
   */
  async loadPreferences(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      this.preferences$.next(null);
      return;
    }

    this.loading$.next(true);
    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const prefs = userData['notificationPreferences'] as NotificationPreferences | undefined;
        
        if (prefs) {
          this.preferences$.next(prefs);
        } else {
          // Create default preferences if none exist
          await this.createDefaultPreferences(user.uid);
        }
      } else {
        // Create user document with default preferences
        await this.createDefaultPreferences(user.uid);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      this.preferences$.next(null);
    } finally {
      this.loading$.next(false);
    }
  }

  /**
   * Create default notification preferences for new user
   */
  private async createDefaultPreferences(userId: string): Promise<void> {
    const defaultPrefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES as NotificationPreferences,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await setDoc(userDocRef, {
        notificationPreferences: defaultPrefs
      }, { merge: true });

      this.preferences$.next(defaultPrefs);
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    this.loading$.next(true);
    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      
      const updatedPrefs: Partial<NotificationPreferences> = {
        ...this.preferences$.value,
        ...updates,
        userId: user.uid,
        updatedAt: new Date()
      };

      const updateData = {
        notificationPreferences: updatedPrefs
      };

      await updateDoc(userDocRef, updateData);
      this.preferences$.next(updatedPrefs as NotificationPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const defaultPrefs: Partial<NotificationPreferences> = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      userId: user.uid,
      createdAt: this.preferences$.value?.createdAt || new Date(),
      updatedAt: new Date()
    };

    await this.updatePreferences(defaultPrefs as NotificationPreferences);
  }

  /**
   * Check if notifications are allowed (respecting quiet hours)
   */
  isNotificationAllowed(): boolean {
    const prefs = this.preferences$.value;
    if (!prefs || !prefs.pushEnabled) return false;
    if (!prefs.quietHoursEnabled) return true;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const startTime = prefs.quietHoursStart;
    const endTime = prefs.quietHoursEnd;

    // Handle case where quiet hours span midnight (e.g., 22:00 - 07:00)
    if (startTime < endTime) {
      return currentTime < startTime || currentTime >= endTime;
    } else {
      return currentTime < startTime && currentTime >= endTime;
    }
  }

  /**
   * Request notification permission from browser
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }

    return false;
  }
}
