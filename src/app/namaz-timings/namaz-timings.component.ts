import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrayerTimesService, PrayerTimes } from '../services/prayer-times.service';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-namaz-timings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full p-4 md:p-6">
      <div class="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 rounded-lg shadow-md p-4 md:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span class="text-2xl">🕌</span>
            Prayer Times
          </h2>
          <button 
            (click)="refreshTimes()" 
            [disabled]="isLoading"
            class="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ isLoading ? '⏳ Loading...' : '🔄 Refresh' }}
          </button>
        </div>

        <!-- Location Info -->
        <div class="mb-4 text-sm text-gray-600 dark:text-gray-300">
          📍 Using your current location
          <button 
            (click)="openLocationSettings()"
            class="ml-2 text-emerald-500 hover:text-emerald-600 underline"
          >
            Change
          </button>
        </div>

        <!-- Next Prayer -->
        <div *ngIf="prayerTimes" class="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-emerald-400 dark:border-emerald-500">
          <p class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {{ getNextPrayerDisplay() }}
          </p>
        </div>

        <!-- Prayer Times Grid -->
        <div *ngIf="prayerTimes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div *ngFor="let prayer of prayerList" 
               class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
            <p class="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">{{ prayer.name }}</p>
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ prayer.time }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span *ngIf="!isCompleted(prayer.name)" class="text-emerald-500">⏳ Upcoming</span>
              <span *ngIf="isCompleted(prayer.name)" class="text-green-500">✓ Completed</span>
            </p>
          </div>
        </div>

        <!-- No Data State -->
        <div *ngIf="!prayerTimes && !isLoading" class="text-center py-8">
          <p class="text-gray-600 dark:text-gray-400 mb-4">Enable location to see prayer times</p>
          <button 
            (click)="enableLocation()"
            class="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            📍 Enable Location
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NamazTimingsComponent implements OnInit, OnDestroy {
  private prayerTimesService = inject(PrayerTimesService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  prayerTimes: any = null;
  isLoading = false;
  prayerList: any[] = [];

  private readonly prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  ngOnInit(): void {
    this.prayerTimesService.getPrayerTimes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(times => {
        this.prayerTimes = times;
        if (times) {
          this.buildPrayerList();
        }
      });

    this.prayerTimesService.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);

    this.getLocationAndFetchPrayerTimes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getLocationAndFetchPrayerTimes(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.prayerTimesService.startAutoRefresh(lat, lng);
        },
        (error) => {
          console.log('Location access denied:', error);
          // Default to Mecca if location not available
          this.prayerTimesService.startAutoRefresh(21.4225, 39.8262);
        }
      );
    }
  }

  private buildPrayerList(): void {
    this.prayerList = [
      { name: 'Fajr', time: this.prayerTimes.Fajr },
      { name: 'Dhuhr', time: this.prayerTimes.Dhuhr },
      { name: 'Asr', time: this.prayerTimes.Asr },
      { name: 'Maghrib', time: this.prayerTimes.Maghrib },
      { name: 'Isha', time: this.prayerTimes.Isha }
    ];
  }

  getNextPrayerDisplay(): string {
    if (!this.prayerTimes) return '';
    return this.prayerTimesService.getNextPrayer(this.prayerTimes);
  }

  isCompleted(prayerName: string): boolean {
    // Simple check - in a real app, you'd track prayer completion
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return this.prayerTimes[prayerName] < currentTime;
  }

  refreshTimes(): void {
    this.getLocationAndFetchPrayerTimes();
    this.notificationService.success('Prayer times refreshed!');
  }

  enableLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.prayerTimesService.fetchPrayerTimes(lat, lng);
          this.notificationService.success('Location enabled!');
        },
        (error) => {
          console.error('Location error:', error);
          this.notificationService.error('Could not access location. Using default location.');
          // Use Mecca as default
          this.prayerTimesService.fetchPrayerTimes(21.4225, 39.8262);
        }
      );
    }
  }

  openLocationSettings(): void {
    this.enableLocation();
  }
}
