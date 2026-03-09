import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-host">
      <div
        *ngFor="let n of notifications; trackBy: trackById"
        class="notif-item"
        [class.success]="n.type === 'success'"
        [class.error]="n.type === 'error'"
        [class.warning]="n.type === 'warning'"
        [class.info]="n.type === 'info'"
      >
        <!-- Icon -->
        <div class="notif-icon">
          <svg *ngIf="n.type === 'success'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          <svg *ngIf="n.type === 'error'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          <svg *ngIf="n.type === 'warning'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          <svg *ngIf="n.type === 'info'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
        </div>

        <!-- Message -->
        <span class="notif-message">{{ n.message }}</span>

        <!-- Dismiss -->
        <button class="notif-close" (click)="notificationService.remove(n.id)" aria-label="Dismiss">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>

        <!-- Progress bar -->
        <div class="notif-progress"></div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Lato:wght@400;700&display=swap');

    :host { display: block; }

    .notif-host {
      position: fixed;
      top: 76px;
      right: 16px;
      z-index: 500;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
      width: calc(100vw - 32px);
      pointer-events: none;
    }

    .notif-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px 14px;
      border-radius: 12px;
      overflow: hidden;
      pointer-events: all;
      backdrop-filter: blur(16px);
      animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* Type variants */
    .notif-item.success {
      background: rgba(10, 28, 18, 0.92);
      border: 1px solid rgba(74, 222, 128, 0.25);
      --accent: #4ade80;
    }
    .notif-item.error {
      background: rgba(28, 10, 10, 0.92);
      border: 1px solid rgba(248, 113, 113, 0.25);
      --accent: #f87171;
    }
    .notif-item.warning {
      background: rgba(28, 22, 6, 0.92);
      border: 1px solid rgba(251, 191, 36, 0.25);
      --accent: #fbbf24;
    }
    .notif-item.info {
      background: rgba(8, 18, 30, 0.92);
      border: 1px solid rgba(212, 175, 55, 0.25);
      --accent: #d4af37;
    }

    /* Left accent line */
    .notif-item::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--accent);
      border-radius: 3px 0 0 3px;
    }

    .notif-icon {
      width: 28px; height: 28px;
      border-radius: 7px;
      background: rgba(255,255,255,0.05);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .notif-icon svg { width: 14px; height: 14px; fill: var(--accent); }

    .notif-message {
      flex: 1;
      font-family: 'Lato', sans-serif;
      font-size: 0.8rem;
      color: rgba(245,240,232,0.85);
      line-height: 1.4;
    }

    .notif-close {
      width: 24px; height: 24px;
      border-radius: 6px;
      border: none;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: rgba(245,240,232,0.3);
      flex-shrink: 0;
      transition: color 0.2s, background 0.2s;
      padding: 0;
    }
    .notif-close svg { width: 12px; height: 12px; fill: currentColor; }
    .notif-close:hover { color: rgba(245,240,232,0.7); background: rgba(255,255,255,0.06); }

    /* Animated progress bar at bottom */
    .notif-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 2px;
      background: var(--accent);
      border-radius: 0 0 0 12px;
      opacity: 0.4;
      animation: progress 4s linear forwards;
    }
    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe(n => {
      this.notifications = n;
    });
  }

  trackById(_: number, n: Notification): string {
    return n.id;
  }
}