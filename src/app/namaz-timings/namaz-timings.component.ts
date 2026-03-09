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

  ngOnInit(): void {
    this.prayerTimesService.getPrayerTimes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(times => {
        this.prayerTimes = times;
        if (times) {
          this.upcomingPrayer = this.prayerTimesService.getNextPrayer(times)
            .replace('Next prayer: ', '')
            .split(' at ')[0]
            .trim();
        }
      });

    this.prayerTimesService.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.loading = l);

    this.loadHijriDate();
    this.getLocationAndFetch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getLocationAndFetch(): void {
    if (!('geolocation' in navigator)) {
      this.prayerTimesService.startAutoRefresh(21.4225, 39.8262);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => this.prayerTimesService.startAutoRefresh(pos.coords.latitude, pos.coords.longitude),
      ()  => this.prayerTimesService.startAutoRefresh(21.4225, 39.8262)
    );
  }

  private loadHijriDate(): void {
    fetch('https://api.aladhan.com/v1/gToH')
      .then(r => r.json())
      .then(data => {
        if (data?.data?.hijri) {
          const h = data.data.hijri;
          this.hijriDate = `${h.day} ${h.month.en} ${h.year} AH`;
        }
      })
      .catch(() => {
        const t = new Date();
        this.hijriDate = `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`;
      });
  }

  refreshTimes(): void {
    this.getLocationAndFetch();
    this.notificationService.success('Prayer times refreshed!');
  }
}