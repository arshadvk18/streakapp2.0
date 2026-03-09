import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <div 
        *ngFor="let notification of notifications"
        [ngClass]="{
          'bg-green-500': notification.type === 'success',
          'bg-red-500': notification.type === 'error',
          'bg-yellow-500': notification.type === 'warning',
          'bg-blue-500': notification.type === 'info'
        }"
        class="text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in flex justify-between items-center"
      >
        <span>{{ notification.message }}</span>
        <button 
          (click)="notificationService.remove(notification.id)"
          class="ml-4 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    :global(.animate-fade-in) {
      animation: fadeIn 0.3s ease-in;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
    });
  }
}
