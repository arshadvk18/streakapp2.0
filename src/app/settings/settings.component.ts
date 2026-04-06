import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <button class="back-btn" (click)="goBack()" title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="header-content">
          <h1>⚙️ Settings</h1>
          <p>Customize your Islamic Streak experience</p>
        </div>
      </div>

      <div class="settings-card">
        <div class="setting-section">
          <h3>🌙 Appearance</h3>
          <label class="setting-item">
            <input type="checkbox" [checked]="isDarkMode" (change)="toggleDarkMode()" />
            <span>Dark Mode</span>
          </label>
        </div>
      </div>

      <div class="settings-card clickable" (click)="navigateToNotifications()">
        <div class="setting-section">
          <div class="setting-item-header">
            <h3>🔔 Notifications</h3>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5l7 7-7 7"/>
            </svg>
          </div>
          <p class="setting-description">Manage prayer times, streaks & reminders</p>
        </div>
      </div>

      <div class="settings-card">
        <div class="setting-section">
          <h3>👤 Account</h3>
          <div class="setting-item">
            <label>Email:</label>
            <p>{{ userEmail }}</p>
          </div>
          <button class="btn-danger" (click)="confirmLogout()">
            🚪 Logout from All Devices
          </button>
        </div>
      </div>

      <div class="settings-card">
        <div class="setting-section">
          <h3>📊 About</h3>
          <p>Islamic Streak Tracker v1.0.0</p>
          <p>Track your spiritual journey with beautiful streaks and badges.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 600px;
      margin: 80px auto 40px;
      padding: 20px;
      color: var(--text-primary, #f5f0e8);
    }

    .settings-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      background: var(--gold-border, rgba(212,175,55,0.15));
      border: 1px solid var(--gold-border, rgba(212,175,55,0.25));
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gold, #d4af37);
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: var(--gold-border, rgba(212,175,55,0.25));
    }

    .back-btn svg {
      width: 20px;
      height: 20px;
    }

    .header-content {
      flex: 1;
    }

    .settings-header h1 {
      font-size: 1.8rem;
      margin: 0 0 8px;
      color: var(--gold, #d4af37);
    }

    .settings-header p {
      font-size: 0.9rem;
      color: var(--text-secondary, rgba(245,240,232,0.65));
      margin: 0;
    }

    .settings-card {
      background: var(--bg-card, #0d1424);
      border: 1px solid var(--gold-border, rgba(212,175,55,0.25));
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      transition: all 0.2s;
    }

    .settings-card.clickable {
      cursor: pointer;
    }

    .settings-card.clickable:hover {
      background: var(--bg-card-hover, rgba(13,20,36,0.8));
      border-color: var(--gold, #d4af37);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212,175,55,0.15);
    }

    .setting-section h3 {
      margin: 0 0 16px;
      font-size: 1rem;
      color: var(--gold, #d4af37);
      border-bottom: 1px solid var(--card-border, rgba(212,175,55,0.15));
      padding-bottom: 8px;
    }

    .setting-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .setting-item-header h3 {
      margin: 0;
      border: none;
      padding: 0;
    }

    .arrow-icon {
      width: 20px;
      height: 20px;
      color: var(--gold, #d4af37);
      flex-shrink: 0;
    }

    .setting-description {
      font-size: 0.85rem;
      color: var(--text-secondary, rgba(245,240,232,0.65));
      margin: 0;
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      cursor: pointer;
    }

    .setting-item input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .setting-item p {
      margin: 8px 0;
      color: var(--text-secondary, rgba(245,240,232,0.65));
    }

    .btn-danger {
      width: 100%;
      padding: 12px 16px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 16px;
    }

    .btn-danger:hover {
      background: #b91c1c;
      transform: translateY(-1px);
    }

    label {
      cursor: pointer;
    }
  `]
})
export class SettingsComponent implements OnInit {
  isDarkMode = false;
  userEmail = '';

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  ngOnInit(): void {
    this.themeService.getTheme().subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    const user = this.authService.getCurrentUserValue();
    this.userEmail = user?.email || 'Not logged in';
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  navigateToNotifications(): void {
    this.router.navigate(['/settings/notifications']);
  }

  goBack(): void {
    this.router.navigate(['/streak']);
  }

  confirmLogout(): void {
    if (confirm('Logout from all devices?')) {
      this.authService.logout();
      this.router.navigate(['/auth']);
      this.notificationService.success('Logged out successfully');
    }
  }
}
