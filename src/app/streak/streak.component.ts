import { Component, OnInit } from '@angular/core';
import { StreakService } from '../streak.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { QuranQuotes, SahihBukhariQuotes, SahihMuslimQuotes } from '../quotes'; 

interface Streak {
  name: string;
  count: number;
  duration?: number;
  isIndefinite: boolean;
  badge?: string;
}

@Component({
  selector: 'app-streak',
  templateUrl: './streak.component.html',
  styleUrls: ['./streak.component.css'],
  imports: [FormsModule, CommonModule]
})
export class StreakComponent implements OnInit {
  streaks: Streak[] = [];
  newStreakName: string = '';
  newStreakDuration?: number;
  isIndefinite: boolean = false;
  hijriDate: string = 'Loading...';
  showGoalModal: boolean = false;
  selectedStreakIndex: number | null = null;
  showSavedQuotes: boolean = false; // Controls visibility of saved quotes


  milestoneBadges = [
    { days: 7, badge: '🥉 Bronze Streak' },
    { days: 30, badge: '🥈 Silver Streak' },
    { days: 100, badge: '🥇 Gold Streak' },
    { days: 365, badge: '🏆 Legendary Streak' }
  ];
  motivationalQuotes: string[] = [...QuranQuotes, ...SahihBukhariQuotes, ...SahihMuslimQuotes]; 
  
  quoteOfTheDay: string = '';
  savedQuotes: string[] = [];

  constructor(private streakService: StreakService) {}

  ngOnInit() {
    this.streaks = this.streakService.loadStreaks().map(streak => ({
      ...streak,
      isIndefinite: streak.isIndefinite ?? false // Ensure isIndefinite is never undefined
    }));
    this.updateBadges();
    this.getHijriDate();
    this.getRandomQuote();
    this.loadSavedQuotes(); 
  }
  getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
    this.quoteOfTheDay = this.motivationalQuotes[randomIndex];
  }
  getHijriDate() {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      this.streakService.getHijriDate(lat, lon).subscribe((response: any) => {
        this.hijriDate = `${response.data.hijri.day} ${response.data.hijri.month.en} ${response.data.hijri.year} AH`;
      });
    });
  }

  addStreak() {
    if (this.newStreakName.trim()) {
      const newStreak: Streak = {
        name: this.newStreakName,
        count: 1,
        duration: this.isIndefinite ? undefined : this.newStreakDuration,
        isIndefinite: this.isIndefinite,
        badge: undefined
      };
      
      this.streaks.push(newStreak);
      this.updateBadge(this.streaks.length - 1);
      
      // Reset input fields
      this.newStreakName = '';
      this.newStreakDuration = undefined;
      this.isIndefinite = false;

      this.saveStreaks();
    }
  }

  incrementStreak(index: number) {
    this.streaks[index].count++;
    this.updateBadge(index);
    this.saveStreaks();

    // Check if user has completed the goal for fixed-duration streaks
    if (this.streaks[index].duration && this.streaks[index].count >= this.streaks[index].duration) {
      this.selectedStreakIndex = index;
      this.showGoalModal = true;
    }
  }

  resetStreak(index: number) {
    this.streaks[index].count = 1;
    this.streaks[index].badge = undefined;
    this.saveStreaks();
  }

  deleteStreak(index: number) {
    this.streaks.splice(index, 1);
    this.saveStreaks();
  }

  updateBadges() {
    this.streaks.forEach((_, index) => this.updateBadge(index));
  }

  updateBadge(index: number) {
    const streak = this.streaks[index];

    // Find the highest milestone the user has reached
    const milestone = this.milestoneBadges
      .slice() // Copy array
      .reverse() // Reverse it to check the highest first
      .find(m => streak.count >= m.days);

    streak.badge = milestone ? milestone.badge : undefined;
  }

  saveStreaks() {
    this.streakService.saveStreaks(this.streaks);
  }

  // Handle Goal Completion
  extendStreak() {
    if (this.selectedStreakIndex !== null) {
      const selectedStreak = this.streaks[this.selectedStreakIndex]; // ✅ FIX: Access selected streak correctly

      // Ask user for additional days or make it indefinite
      const additionalDays = prompt('How many days do you want to extend? (Leave blank to make indefinite)');

      if (additionalDays === '') {
        selectedStreak.isIndefinite = true;
        selectedStreak.duration = undefined;
      } else {
        const extraDays = parseInt(additionalDays || '0', 10);
        if (!isNaN(extraDays) && extraDays > 0) {
          selectedStreak.duration = (selectedStreak.duration || 0) + extraDays;
        }
      }

      this.saveStreaks();
      this.closeGoalModal();
    }
  }

  stopStreak() {
    if (this.selectedStreakIndex !== null) {
      this.streaks.splice(this.selectedStreakIndex, 1);
      this.saveStreaks();
      this.closeGoalModal();
    }
  }

  closeGoalModal() {
    this.showGoalModal = false;
    this.selectedStreakIndex = null;
  }
  get selectedStreak(): Streak | null {
    return this.selectedStreakIndex !== null ? this.streaks[this.selectedStreakIndex] : null;
  }
  saveQuote() {
    if (!this.savedQuotes.includes(this.quoteOfTheDay)) {
      this.savedQuotes.push(this.quoteOfTheDay);
      localStorage.setItem('savedQuotes', JSON.stringify(this.savedQuotes));
    }
  }
  
  loadSavedQuotes() {
    const storedQuotes = localStorage.getItem('savedQuotes');
    if (storedQuotes) {
      this.savedQuotes = JSON.parse(storedQuotes);
    }
  }
  toggleSavedQuotes() {
    this.showSavedQuotes = !this.showSavedQuotes;
  }
}
