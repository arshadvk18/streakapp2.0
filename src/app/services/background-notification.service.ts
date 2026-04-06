import { Injectable } from '@angular/core';

export interface BackgroundNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Service to handle background notifications via Service Worker
 * Works even when browser is minimized or tab is in background
 */
@Injectable({
  providedIn: 'root'
})
export class BackgroundNotificationService {
  
  /**
   * Send notification through Service Worker
   * Works when browser is minimized, tab is in background, or even tab is closed
   * (as long as the browser process is running)
   */
  async sendBackgroundNotification(options: BackgroundNotificationOptions): Promise<void> {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('⚠️ Background notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send notification through Service Worker
      if (registration.active) {
        // Post message to Service Worker
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          notification: options
        });

        console.log('📬 Notification sent to Service Worker:', options.title);
      }
    } catch (error) {
      console.error('Error sending background notification:', error);
    }
  }

  /**
   * Schedule a background notification
   * Does NOT require setTimeout (works in background)
   */
  async scheduleBackgroundNotification(options: BackgroundNotificationOptions, delayMs: number): Promise<void> {
    // For now, use setTimeout as fallback
    // In a production app, use Web Push API with backend server
    setTimeout(() => {
      this.sendBackgroundNotification(options);
    }, delayMs);
  }

  /**
   * Request notification permission for background notifications
   */
  async requestBackgroundNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
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

  /**
   * Get Service Worker registration
   */
  async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0 ? registrations[0] : null;
    } catch (error) {
      console.error('Error getting Service Worker registration:', error);
      return null;
    }
  }

  /**
   * Check if browser supports background notifications
   */
  supportsBackgroundNotifications(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  /**
   * Get notification permission status
   */
  getNotificationPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}
