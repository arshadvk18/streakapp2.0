import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationPreferencesService, NotificationPreferences } from '../services/notification-preferences.service';
import { NotificationSchedulerService } from '../services/notification-scheduler.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notifications-page">
      <!-- Header -->
      <header class="notifications-header">
        <div class="header-content">
          <button class="back-btn" (click)="goBack()" title="Back to settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-text">
            <h1>🔔 Notifications</h1>
            <p>Manage prayer times, streaks & reminders</p>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div *ngIf="loading$ | async" class="loading-state">
        <div class="spinner"></div>
        <p>Loading preferences...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!(loading$ | async)" class="notifications-content">

        <!-- Master Toggle -->
        <section class="preference-section">
          <div class="section-header">
            <h2>Push Notifications</h2>
          </div>
          <div class="toggle-item">
            <div class="toggle-label">
              <span class="label-text">Enable all notifications</span>
              <span class="label-description">You can customize each type below</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                [checked]="preferences?.pushEnabled" 
                (change)="togglePushEnabled($event)"
              />
              <span class="slider"></span>
            </label>
          </div>
        </section>

        <!-- Prayer Time Notifications -->
        <section class="preference-section" [class.disabled]="!preferences?.pushEnabled">
          <div class="section-header">
            <h2>⏰ Prayer Times</h2>
            <p>Get notified before each prayer</p>
          </div>
          
          <div class="toggle-item">
            <div class="toggle-label">
              <span class="label-text">Prayer reminders</span>
              <span class="label-description">Fajr, Dhuhr, Asr, Maghrib, Isha</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                [checked]="preferences?.prayerNotifications"
                [disabled]="!preferences?.pushEnabled"
                (change)="updatePreference('prayerNotifications', $event)"
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="preference-item" *ngIf="preferences?.prayerNotifications && preferences?.pushEnabled">
            <label class="item-label">Notify before prayer:</label>
            <div class="time-selector">
              <select 
                [value]="preferences?.prayerNotificationMinutesBeforePrayer"
                (change)="updatePreference('prayerNotificationMinutesBeforePrayer', $event)"
              >
                <option [value]="0">At prayer time</option>
                <option [value]="5">5 minutes before</option>
                <option [value]="10">10 minutes before</option>
                <option [value]="15">15 minutes before</option>
              </select>
              <button class="btn-test" (click)="testNotification('prayer')">Test</button>
            </div>
          </div>
        </section>

        <!-- Morning Check-in -->
        <section class="preference-section" [class.disabled]="!preferences?.pushEnabled">
          <div class="section-header">
            <h2>🌅 Morning Check-in</h2>
            <p>Daily reminder to track your streaks</p>
          </div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span class="label-text">Morning reminder</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                [checked]="preferences?.morningCheckInEnabled"
                [disabled]="!preferences?.pushEnabled"
                (change)="updatePreference('morningCheckInEnabled', $event)"
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="preference-item" *ngIf="preferences?.morningCheckInEnabled && preferences?.pushEnabled">
            <label class="item-label">Remind me at:</label>
            <div class="time-selector">
              <input 
                type="time" 
                [value]="preferences?.morningCheckInTime"
                (change)="updatePreference('morningCheckInTime', $event)"
              />
              <button class="btn-test" (click)="testNotification('morning-checkin')">Test</button>
            </div>
          </div>
        </section>

        <!-- Evening Reflection -->
        <section class="preference-section" [class.disabled]="!preferences?.pushEnabled">
          <div class="section-header">
            <h2>🌙 Evening Reflection</h2>
            <p>Reflect on your day's progress</p>
          </div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span class="label-text">Evening reflection</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                [checked]="preferences?.eveningReflectionEnabled"
                [disabled]="!preferences?.pushEnabled"
                (change)="updatePreference('eveningReflectionEnabled', $event)"
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="preference-item" *ngIf="preferences?.eveningReflectionEnabled && preferences?.pushEnabled">
            <label class="item-label">Remind me at:</label>
            <div class="time-selector">
              <input 
                type="time" 
                [value]="preferences?.eveningReflectionTime"
                (change)="updatePreference('eveningReflectionTime', $event)"
              />
              <button class="btn-test" (click)="testNotification('evening-reflection')">Test</button>
            </div>
          </div>
        </section>

        <!-- Weekly Summary -->
        <section class="preference-section" [class.disabled]="!preferences?.pushEnabled">
          <div class="section-header">
            <h2>📊 Weekly Summary</h2>
            <p>Review your weekly streak progress</p>
          </div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span class="label-text">Weekly summary</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                [checked]="preferences?.weeklySummaryEnabled"
                [disabled]="!preferences?.pushEnabled"
                (change)="updatePreference('weeklySummaryEnabled', $event)"
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="preference-item" *ngIf="preferences?.weeklySummaryEnabled && preferences?.pushEnabled">
            <div class="day-time-selector">
              <div class="day-select">
                <label class="item-label">Day:</label>
                <select 
                  [value]="preferences?.weeklySummaryDay"
                  (change)="updatePreference('weeklySummaryDay', $event)"
                >
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
              <div class="time-select">
                <label class="item-label">Time:</label>
                <input 
                  type="time" 
                  [value]="preferences?.weeklySummaryTime"
                  (change)="updatePreference('weeklySummaryTime', $event)"
                />
              </div>
              <button class="btn-test" (click)="testNotification('weekly-summary')">Test</button>
            </div>
          </div>
        </section>

        <!-- Do Not Disturb -->
        <section class="preference-section">
          <div class="section-header">
            <h2>🔇 Do Not Disturb</h2>
            <p>Mute notifications during quiet hours</p>
          </div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span class="label-text">Enable quiet hours</span>
              <span class="label-description">Notifications won't ring during these hours</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                [checked]="preferences?.quietHoursEnabled"
                (change)="updatePreference('quietHoursEnabled', $event)"
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="preference-item" *ngIf="preferences?.quietHoursEnabled">
            <div class="quiet-hours-selector">
              <div class="time-input">
                <label class="item-label">From:</label>
                <input 
                  type="time" 
                  [value]="preferences?.quietHoursStart"
                  (change)="updatePreference('quietHoursStart', $event)"
                />
              </div>
              <div class="separator">to</div>
              <div class="time-input">
                <label class="item-label">To:</label>
                <input 
                  type="time" 
                  [value]="preferences?.quietHoursEnd"
                  (change)="updatePreference('quietHoursEnd', $event)"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <section class="actions-section">
          <button class="btn-reset" (click)="resetToDefaults()">
            ↺ Reset to Defaults
          </button>
        </section>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .notifications-page {
      min-height: 100vh;
      background: var(--bg-root, #f5f5f5);
    }

    /* Header */
    .notifications-header {
      background: linear-gradient(135deg, var(--gold, #d4af37) 0%, #c9a142 100%);
      color: #1a1a1a;
      padding: 24px 0;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a1a1a;
    }

    .back-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .back-btn svg {
      width: 20px;
      height: 20px;
    }

    .header-text h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
    }

    .header-text p {
      margin: 4px 0 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    /* Content */
    .notifications-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Sections */
    .preference-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      border: 1px solid #e0e0e0;
      transition: opacity 0.3s;
    }

    .preference-section.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .section-header {
      margin-bottom: 16px;
    }

    .section-header h2 {
      margin: 0 0 4px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .section-header p {
      margin: 0;
      font-size: 0.85rem;
      color: #666;
    }

    /* Toggle Items */
    .toggle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .toggle-item:last-child {
      border-bottom: none;
    }

    .toggle-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .label-text {
      font-weight: 500;
      color: #1a1a1a;
    }

    .label-description {
      font-size: 0.85rem;
      color: #999;
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      width: 50px;
      height: 28px;
      display: inline-block;
      cursor: pointer;
      margin-left: 16px;
    }

    .toggle-switch input {
      display: none;
    }

    .slider {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ccc;
      border-radius: 14px;
      transition: 0.3s;
    }

    .slider::before {
      content: '';
      position: absolute;
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }

    input:checked + .slider {
      background: var(--gold, #d4af37);
    }

    input:checked + .slider::before {
      transform: translateX(22px);
    }

    input:disabled + .slider {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Preference Items */
    .preference-item {
      padding: 12px 0;
      border-top: 1px solid #f0f0f0;
    }

    .item-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #1a1a1a;
      font-size: 0.95rem;
    }

    /* Time Selector */
    .time-selector {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    select, input[type="time"] {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: inherit;
      background: white;
    }

    select:focus, input[type="time"]:focus {
      outline: none;
      border-color: var(--gold, #d4af37);
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
    }

    .btn-test {
      padding: 8px 16px;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      color: #666;
      transition: all 0.2s;
    }

    .btn-test:hover {
      background: var(--gold, #d4af37);
      border-color: var(--gold, #d4af37);
      color: #1a1a1a;
    }

    /* Day/Time Selector */
    .day-time-selector {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .day-select, .time-select {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quiet-hours-selector {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .time-input {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .separator {
      padding: 0 8px;
      color: #999;
      font-weight: 500;
      margin-top: 20px;
    }

    /* Actions */
    .actions-section {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .btn-reset {
      flex: 1;
      padding: 12px 20px;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #666;
      transition: all 0.2s;
    }

    .btn-reset:hover {
      background: #e0e0e0;
      border-color: #999;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f0f0;
      border-top-color: var(--gold, #d4af37);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Dark Mode */
    :host-context(html.dark) .preference-section {
      background: var(--bg-card, #1e1e1e);
      border-color: var(--border-color, #333);
    }

    :host-context(html.dark) .section-header h2,
    :host-context(html.dark) .label-text,
    :host-context(html.dark) .item-label {
      color: var(--text-primary, #fff);
    }

    :host-context(html.dark) .section-header p,
    :host-context(html.dark) .label-description {
      color: var(--text-secondary, #999);
    }

    :host-context(html.dark) .toggle-item {
      border-bottom-color: var(--border-color, #333);
    }

    :host-context(html.dark) select,
    :host-context(html.dark) input[type="time"] {
      background: var(--bg-root, #0a0a0a);
      color: var(--text-primary, #fff);
      border-color: var(--border-color, #333);
    }

    :host-context(html.dark) .btn-test {
      background: var(--bg-root, #0a0a0a);
      border-color: var(--border-color, #333);
      color: var(--text-primary, #fff);
    }

    :host-context(html.dark) .btn-test:hover {
      background: var(--gold, #d4af37);
      color: #1a1a1a;
    }

    :host-context(html.dark) .btn-reset {
      background: var(--bg-root, #0a0a0a);
      border-color: var(--border-color, #333);
      color: var(--text-primary, #fff);
    }

    :host-context(html.dark) .btn-reset:hover {
      background: var(--border-color, #333);
    }

    @media (max-width: 600px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .day-time-selector {
        flex-direction: column;
      }

      .quiet-hours-selector {
        flex-direction: column;
      }

      .time-input, .day-select, .time-select {
        width: 100%;
      }

      .separator {
        display: none;
      }
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit {
  private preferencesService = inject(NotificationPreferencesService);
  private schedulerService = inject(NotificationSchedulerService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  preferences: NotificationPreferences | null = null;
  loading$ = this.preferencesService.getLoading();

  ngOnInit(): void {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    this.preferencesService.loadPreferences();
    this.preferencesService.getPreferences().subscribe(prefs => {
      this.preferences = prefs;
    });
  }

  togglePushEnabled(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.updatePreference('pushEnabled', { target: { value: checked } });
  }

  updatePreference(key: keyof NotificationPreferences, event: any): void {
    if (!this.preferences) return;

    let value: any = event.target?.value ?? event.target?.checked;
    
    // Handle time inputs
    if (event.target?.type === 'time') {
      value = event.target.value;
    }

    // Handle select dropdowns
    if (event.target?.tagName === 'SELECT') {
      value = event.target.value;
    }

    // Handle checkboxes
    if (event.target?.type === 'checkbox') {
      value = event.target.checked;
    }

    const updates: Partial<NotificationPreferences> = { [key]: value };

    this.preferencesService.updatePreferences(updates)
      .then(() => {
        this.notificationService.success('Notification preferences updated');
      })
      .catch(error => {
        this.notificationService.error('Failed to update preferences');
        console.error(error);
      });
  }

  async testNotification(type: 'prayer' | 'morning-checkin' | 'evening-reflection' | 'weekly-summary'): Promise<void> {
    try {
      await this.schedulerService.sendTestNotification(type);
    } catch (error) {
      this.notificationService.error('Failed to send test notification');
    }
  }

  async resetToDefaults(): Promise<void> {
    if (!confirm('Reset all notification settings to defaults?')) return;

    try {
      await this.preferencesService.resetToDefaults();
      this.notificationService.success('Settings reset to defaults');
    } catch (error) {
      this.notificationService.error('Failed to reset settings');
      console.error(error);
    }
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }
}
