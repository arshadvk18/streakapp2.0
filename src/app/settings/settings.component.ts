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
        <h1>⚙️ Settings</h1>
        <p>Customize your Islamic Streak experience</p>
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
      text-align: center;
      margin-bottom: 32px;
    }

    .settings-header h1 {
      font-size: 1.8rem;
      margin: 0 0 8px;
      color: var(--gold, #d4af37);
    }

    .settings-header p {
      font-size: 0.9rem;
      color: var(--text-secondary, rgba(245,240,232,0.65));
    }

    .settings-card {
      background: var(--bg-card, #0d1424);
      border: 1px solid var(--gold-border, rgba(212,175,55,0.25));
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .setting-section h3 {
      margin: 0 0 16px;
      font-size: 1rem;
      color: var(--gold, #d4af37);
      border-bottom: 1px solid var(--card-border, rgba(212,175,55,0.15));
      padding-bottom: 8px;
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

  confirmLogout(): void {
    if (confirm('Are you sure you want to logout? You will need to login again.')) {
      this.logout();
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.notificationService.success('👋 Logged out successfully!');
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Logout error:', error);
      this.notificationService.error('Failed to logout');
    }
  }
}
