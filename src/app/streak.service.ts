import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  loadStreaks(): any[] {
    if (this.isBrowser) {
      const data = localStorage.getItem('streaks');
      return data ? JSON.parse(data) : [];
    }
    return [];
  }

  saveStreaks(streaks: any[]) {
    if (this.isBrowser) {
      localStorage.setItem('streaks', JSON.stringify(streaks));
    }
  }
}
