import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerData {
  timings: PrayerTimes;
  date: {
    gregorian: string;
    hijri: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PrayerTimesService {
  private http = inject(HttpClient);
  private prayerTimes$ = new BehaviorSubject<PrayerTimes | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);

  getPrayerTimes(): Observable<PrayerTimes | null> {
    return this.prayerTimes$.asObservable();
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  fetchPrayerTimes(latitude: number, longitude: number): void {
    this.loading$.next(true);

    // Using Al-Adhan Prayer Times API (free, no key required)
    const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;

    this.http.get<any>(url)
      .pipe(
        catchError(error => {
          console.error('Error fetching prayer times:', error);
          this.loading$.next(false);
          return of(null);
        })
      )
      .subscribe((data: any) => {
        if (data && data.data) {
          this.prayerTimes$.next(data.data.timings);
        }
        this.loading$.next(false);
      });
  }

  // Auto-refresh prayer times every hour
  startAutoRefresh(latitude: number, longitude: number): void {
    this.fetchPrayerTimes(latitude, longitude);
    
    // Refresh every hour
    timer(0, 3600000)
      .pipe(
        switchMap(() => {
          this.fetchPrayerTimes(latitude, longitude);
          return of(null);
        })
      )
      .subscribe();
  }

  // Get current or next prayer
  getNextPrayer(prayerTimes: PrayerTimes): string {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha }
    ];

    const nextPrayer = prayers.find(p => p.time > currentTime);
    return nextPrayer ? `⏰ Next: ${nextPrayer.name} at ${nextPrayer.time}` : '🌙 All prayers done today';
  }
}
