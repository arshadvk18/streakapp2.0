import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

@Component({
  selector: 'app-namaz-timings',
  templateUrl: './namaz-timings.component.html',
  styleUrls: ['./namaz-timings.component.css'],
  imports: [CommonModule]
})
export class NamazTimingsComponent implements OnInit {
  prayerTimes: PrayerTimes | null = null;
  hijriDate: string = '';
  loading: boolean = false;
  upcomingPrayer: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getUserLocation();
    setInterval(() => this.highlightUpcomingPrayer(), 60 * 1000); // Update every minute
  }

  getUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.fetchPrayerTimes(lat, lon);
        },
        () => {
          alert('Location access denied! Please enable location.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  fetchPrayerTimes(lat: number, lon: number): void {
    this.loading = true;
    this.http.get<any>(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`)
      .subscribe(response => {
        this.prayerTimes = response.data.timings;
        this.hijriDate = `${response.data.date.hijri.day} ${response.data.date.hijri.month.en} ${response.data.date.hijri.year}`;
        this.loading = false;

        this.highlightUpcomingPrayer(); // Highlight as soon as timings load
      }, error => {
        console.error('Error fetching prayer times:', error);
        this.loading = false;
      });
  }

  highlightUpcomingPrayer(): void {
    if (!this.prayerTimes) return;

    const now = new Date();
    const currentTime = this.formatTime(now);

    const timings = {
      Fajr: this.prayerTimes.Fajr,
      Dhuhr: this.prayerTimes.Dhuhr,
      Asr: this.prayerTimes.Asr,
      Maghrib: this.prayerTimes.Maghrib,
      Isha: this.prayerTimes.Isha
    };

    const sortedTimings = Object.entries(timings).sort(([_, time1], [__, time2]) => 
      this.convertToMinutes(time1) - this.convertToMinutes(time2)
    );

    for (const [prayer, time] of sortedTimings) {
      if (currentTime < this.convertToMinutes(time)) {
        this.upcomingPrayer = prayer;
        return;
      }
    }

    this.upcomingPrayer = 'Fajr (Next Day)'; // Handle post-Isha scenario
  }

  formatTime(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  convertToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
