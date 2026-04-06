import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrayerTimesService } from '../services/prayer-times.service';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-namaz-timings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './namaz-timings.component.html',
  styleUrls: ['./namaz-timings.component.css']
})
export class NamazTimingsComponent implements OnInit, OnDestroy {
  private prayerTimesService = inject(PrayerTimesService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  prayerTimes: any = null;
  loading = false;
  hijriDate: string = 'Loading...';
  upcomingPrayer: string = '';
  error: string | null = null;
  userLocation: string = '';

  ngOnInit(): void {
    // Subscribe to prayer times updates
    this.prayerTimesService.getPrayerTimes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(times => {
        this.prayerTimes = times;
        if (times) {
          const nextPrayer = this.prayerTimesService.getNextPrayer(times);
          if (nextPrayer) {
            this.upcomingPrayer = nextPrayer.name;
          }
        }
      });

    // Subscribe to loading state
    this.prayerTimesService.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.loading = l);

    // Subscribe to error state
    this.prayerTimesService.getError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(err => this.error = err);

    // Subscribe to location updates
    this.prayerTimesService.getCurrentLocation()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loc => {
        if (loc) {
          this.userLocation = `📍 ${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}° (±${loc.accuracy.toFixed(0)}m)`;
        }
      });

    this.loadHijriDate();
    this.getLocationAndFetch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get user location with robust error handling and timeouts
   */
  private getLocationAndFetch(): void {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported, using default location (Mecca)');
      this.notificationService.warning('Location not supported on this device');
      this.prayerTimesService.startAutoRefresh(21.4225, 39.8262);
      return;
    }

    // Show that we're attempting to get location
    this.loading = true;

    // Request user's current position with timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Store location data in the service
        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now()
        };

        console.log('✓ Location obtained:', locationData);
        this.notificationService.success(`Location found (±${accuracy.toFixed(0)}m)`);
        
        // Start fetching prayer times for user's location
        this.prayerTimesService.startAutoRefresh(latitude, longitude);
      },
      (error) => {
        // Handle various geolocation errors
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Using default location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Using default location.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Using default location.';
            break;
        }

        console.warn('Geolocation error:', errorMessage);
        this.notificationService.warning(errorMessage);

        // Fallback to Mecca (default Islamic reference point)
        this.prayerTimesService.startAutoRefresh(21.4225, 39.8262);
      },
      {
        enableHighAccuracy: false, // Faster location (not ultra high precision needed)
        timeout: 10000, // 10 second timeout
        maximumAge: 5 * 60 * 1000 // Cache location for 5 minutes
      }
    );
  }

  /**
   * Load Hijri date for today with proper API parameters
   */
  private loadHijriDate(): void {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

    // Use proper Gregorian to Hijri conversion with date parameter
    fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data?.data?.hijri) {
          const h = data.data.hijri;
          // Full Hijri date: 15 Rajab 1445 AH
          this.hijriDate = `${h.day} ${h.month.en} ${h.year} AH`;
        } else {
          throw new Error('Invalid Hijri conversion response');
        }
      })
      .catch(err => {
        console.error('Error fetching Hijri date:', err);
        // Fallback: Show Gregorian date
        const t = new Date();
        this.hijriDate = `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()} (Gregorian)`;
      });
  }

  /**
   * Manual refresh button - gets location and fetches fresh prayer times
   */
  refreshTimes(): void {
    this.error = null;
    this.getLocationAndFetch();
    this.notificationService.info('Refreshing prayer times...');
  }

  /**
   * Get formatted prayer time (HH:MM format)
   */
  formatPrayerTime(time: string): string {
    return time || '—';
  }
}