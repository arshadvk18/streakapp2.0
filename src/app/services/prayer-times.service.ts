import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, interval } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
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

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrayerTimesService {
  private http = inject(HttpClient);
  private prayerTimes$ = new BehaviorSubject<PrayerTimes | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private currentLocation$ = new BehaviorSubject<LocationData | null>(null);

  // Default coordinates: Mecca (as fallback only)
  private readonly DEFAULT_LAT = 21.4225;
  private readonly DEFAULT_LON = 39.8262;
  private readonly GEOLOCATION_TIMEOUT = 10000; // 10 seconds timeout

  // Prayer calculation methods for different regions:
  // 1: Karachi, 2: ISNA (North America), 3: MWL (Egypt), 4: Makkah, 5: Egyptian (General), 6: Gulf, 7: Kuwait
  private readonly PRAYER_METHODS: { [key: string]: number } = {
    'US': 2,    // North America
    'CA': 2,
    'GB': 2,
    'SA': 4,    // Saudi Arabia (Makkah method - most accurate)
    'AE': 6,    // UAE (Gulf method)
    'KW': 7,    // Kuwait
    'EG': 5,    // Egypt
    'PK': 1,    // Pakistan
    'IN': 1,    // India
    'BD': 1,    // Bangladesh
  };

  getPrayerTimes(): Observable<PrayerTimes | null> {
    return this.prayerTimes$.asObservable();
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  getCurrentLocation(): Observable<LocationData | null> {
    return this.currentLocation$.asObservable();
  }

  /**
   * Validate latitude and longitude coordinates
   */
  private isValidCoordinate(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && !isNaN(lat) && !isNaN(lon);
  }

  /**
   * Determine optimal prayer calculation method based on coordinates
   */
  private selectMethodByLocation(latitude: number, longitude: number): number {
    // Approximate country codes by region
    if (latitude > 46 && longitude < -60) return 2;  // North America
    if (latitude > 50 && latitude < 60 && longitude > -10 && longitude < 2) return 2;  // UK area
    if (latitude > 24 && latitude < 26 && longitude > 39 && longitude < 40) return 4;  // Makkah/Saudi
    if (latitude > 23 && latitude < 25 && longitude > 54 && longitude < 56) return 6;  // UAE area
    if (latitude > 24 && latitude < 30 && longitude > 29 && longitude < 35) return 5;  // Egypt area
    if (latitude > 23 && latitude < 35 && longitude > 61 && longitude < 77) return 1;  // Pakistan/India area
    
    // Default method (ISNA)
    return 2;
  }

  /**
   * Fetch prayer times with robust error handling
   */
  fetchPrayerTimes(latitude: number, longitude: number): void {
    // Validate coordinates
    if (!this.isValidCoordinate(latitude, longitude)) {
      console.warn('Invalid coordinates provided, using default location');
      latitude = this.DEFAULT_LAT;
      longitude = this.DEFAULT_LON;
    }

    this.loading$.next(true);
    this.error$.next(null);

    // Select optimal method based on location
    const method = this.selectMethodByLocation(latitude, longitude);
    
    // Format date for today
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

    // Using Al-Adhan Prayer Times API with timezone support
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&method=${method}`;

    this.http.get<any>(url)
      .pipe(
        tap((data: any) => {
          if (data?.data?.timings) {
            this.prayerTimes$.next(data.data.timings);
            this.error$.next(null);
            console.log('✓ Prayer times fetched successfully', { lat: latitude, lon: longitude, method });
          } else {
            throw new Error('Invalid prayer times response structure');
          }
        }),
        catchError(error => {
          console.error('Error fetching prayer times:', error);
          const errorMsg = `Failed to fetch prayer times: ${error?.status === 0 ? 'Network error' : 'Server error'}`;
          this.error$.next(errorMsg);
          this.loading$.next(false);
          return of(null);
        })
      )
      .subscribe((data: any) => {
        this.loading$.next(false);
      });
  }

  /**
   * Auto-refresh prayer times: hourly + at midnight for date changes
   */
  startAutoRefresh(latitude: number, longitude: number): void {
    // Initial fetch
    this.fetchPrayerTimes(latitude, longitude);

    // Calculate time until midnight for daily refresh
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - Date.now();

    // Refresh at midnight daily
    timer(msUntilMidnight, 24 * 60 * 60 * 1000)
      .subscribe(() => {
        this.fetchPrayerTimes(latitude, longitude);
      });

    // Also refresh hourly as backup
    interval(60 * 60 * 1000)
      .subscribe(() => {
        this.fetchPrayerTimes(latitude, longitude);
      });
  }

  /**
   * Time comparison helper - converts "HH:MM" to minutes since midnight
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get current or next prayer with accurate time calculation
   */
  getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: string } | null {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Include all prayer times in order
    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Sunrise', time: prayerTimes.Sunrise },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Sunset', time: prayerTimes.Sunset },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha }
    ];

    // Find next prayer by comparing in minutes (more robust than string comparison)
    for (const prayer of prayers) {
      const prayerMinutes = this.timeToMinutes(prayer.time);
      if (prayerMinutes > currentMinutes) {
        return { name: prayer.name, time: prayer.time };
      }
    }

    // All prayers passed, next is Fajr tomorrow
    return { name: 'Fajr (Tomorrow)', time: prayerTimes.Fajr };
  }

  /**
   * Get prayer times for a specific date
   */
  fetchPrayerTimesForDate(latitude: number, longitude: number, date: Date): Observable<PrayerTimes | null> {
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const method = this.selectMethodByLocation(latitude, longitude);
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&method=${method}`;

    return this.http.get<any>(url)
      .pipe(
        tap((data: any) => {
          if (!data?.data?.timings) throw new Error('Invalid response');
        }),
        switchMap(data => of(data.data.timings)),
        catchError(error => {
          console.error('Error fetching prayer times for date:', error);
          return of(null);
        })
      );
  }
}
