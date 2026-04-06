import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { NotificationsComponent } from './components/notifications.component';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, NotificationsComponent, RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true
})
export class AppComponent implements OnInit {
  title = 'islamicstreak';
  isLoggedIn$: Observable<boolean>;

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private preferencesService = inject(NotificationPreferencesService);
  private schedulerService = inject(NotificationSchedulerService);

  constructor() {
    this.isLoggedIn$ = this.authService.getIsLoggedIn();
  }

  ngOnInit() {
    // Initialize theme on app startup
    this.themeService.initTheme();

    // Register Service Worker for background notifications
    this.registerServiceWorker();

    // Initialize notification system when user logs in
    this.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.initializeNotifications();
      } else {
        this.schedulerService.stopScheduler();
      }
    });
  }

  private async initializeNotifications(): Promise<void> {
    try {
      // Load user preferences
      await this.preferencesService.loadPreferences();

      // Request browser push notification permission
      if (this.preferencesService.getPreferencesValue()?.pushEnabled) {
        await this.preferencesService.requestNotificationPermission();
      }

      // Start the notification scheduler
      this.schedulerService.startScheduler();

      console.log('✅ Notification system initialized');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Register Service Worker for background notifications
   * Allows notifications even when browser is minimized or tab is in background
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registered:', registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle Service Worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('✅ Service Worker updated');
              // Optional: notify user about update
              this.notifyServiceWorkerUpdate();
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  private notifyServiceWorkerUpdate(): void {
    // Optional: Show user that app has been updated
    console.log('📱 New version available - page reload recommended');
  }
}
