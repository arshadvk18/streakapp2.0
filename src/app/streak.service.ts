import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
interface Streak {
  name: string;
  count: number;
  duration?: number; // Number of days for goal streak (optional)
  badge?: string;
  isIndefinite?: boolean; // Track indefinite streaks
}

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  private isBrowser: boolean;

  private milestoneBadges = [
    { days: 7, badge: '🥉 Bronze Streak' },
    { days: 30, badge: '🥈 Silver Streak' },
    { days: 100, badge: '🥇 Gold Streak' },
    { days: 365, badge: '🏆 Legendary Streak' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object,
  private http: HttpClient) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
  }

  loadStreaks(): Streak[] {
    if (this.isBrowser) {
      const data = localStorage.getItem('streaks');
      let streaks: Streak[] = data ? JSON.parse(data) : [];

      // Ensure badges are properly assigned or upgraded
      streaks = streaks.map(streak => ({
        ...streak,
        badge: this.getBadge(streak.count) // Always check and assign the correct badge
      }));

      return streaks;
    }
    return [];
  }

  saveStreaks(streaks: Streak[]): void {
    if (this.isBrowser) {
      // Assign or upgrade badges before saving
      const updatedStreaks = streaks.map(streak => ({
        ...streak,
        badge: this.getBadge(streak.count) // Ensure badges upgrade properly
      }));

      localStorage.setItem('streaks', JSON.stringify(updatedStreaks));
    }
  }

  getBadge(count: number): string | undefined {
    // Find the highest milestone reached
    return this.milestoneBadges.find(m => count >= m.days)?.badge;
  }

  checkAndPromptStreakCompletion(streak: Streak, index: number, streaks: Streak[], saveCallback: () => void): void {
    if (!streak.isIndefinite && streak.duration && streak.count >= streak.duration) {
      setTimeout(() => {
        const extend = confirm(`🎉 You completed your goal of ${streak.duration} days! Do you want to extend the streak?`);
        if (extend) {
          const newDays = prompt('Enter additional days (or type "indefinite" to continue indefinitely):');
          if (newDays?.toLowerCase() === 'indefinite') {
            streaks[index].isIndefinite = true;
            streaks[index].duration = undefined;
          } else {
            const extraDays = Number(newDays);
            if (!isNaN(extraDays) && extraDays > 0) {
              streaks[index].duration! += extraDays;
            }
          }
        }
        saveCallback();
      }, 500);
    }
  }
  getHijriDate(lat: number, lon: number) {
    const apiKey = 'YOUR_API_KEY';  // Replace with your actual API key
    return this.http.get(
      `https://api.aladhan.com/v1/gToH?latitude=${lat}&longitude=${lon}&key=${apiKey}`
    );
  }
}
