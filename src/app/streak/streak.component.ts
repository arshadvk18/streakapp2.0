import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService, Streak } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { QuranQuotes, SahihBukhariQuotes, SahihMuslimQuotes } from '../quotes'; 
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-streak',
  templateUrl: './streak.component.html',
  styleUrls: ['./streak.component.css'],
  imports: [FormsModule, CommonModule]
})
export class StreakComponent implements OnInit, OnDestroy {
  streaks: Streak[] = [];
  newStreakName: string = '';
  newStreakDuration?: number;
  isIndefinite: boolean = false;
  hijriDate: string = 'Loading...';
  showGoalModal: boolean = false;
  selectedStreakIndex: number | null = null;
  showSavedQuotes: boolean = false;
  private destroy$ = new Subject<void>();

  milestoneBadges = [
    { days: 7, badge: '🥉 Bronze Streak' },
    { days: 30, badge: '🥈 Silver Streak' },
    { days: 100, badge: '🥇 Gold Streak' },
    { days: 365, badge: '🏆 Legendary Streak' }
  ];
  motivationalQuotes: string[] = [...QuranQuotes, ...SahihBukhariQuotes, ...SahihMuslimQuotes]; 
  
  quoteOfTheDay: string = '';
  savedQuotes: string[] = [];

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {
    this.quoteOfTheDay = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
  }

  ngOnInit() {
    this.loadStreaks();
    this.updateHijriDate();
    this.loadSavedQuotes();
  }

  // Load streaks from Firestore with real-time updates
  loadStreaks(): void {
    this.firestoreService.getStreaks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((streaks) => {
        this.streaks = streaks.map(streak => ({
          ...streak,
          isIndefinite: streak.isIndefinite ?? false
        }));
        this.updateBadges();
      });
    
    // Start listening to real-time Firestore updates
    this.firestoreService.loadStreaks();
  }

  // Add new streak to Firestore
  async addStreak(): Promise<void> {
    if (!this.newStreakName.trim()) return;

    const newStreak: Streak = {
      name: this.newStreakName,
      count: 0,
      duration: this.isIndefinite ? undefined : this.newStreakDuration,
      isIndefinite: this.isIndefinite,
      badge: undefined
    };
    
    try {
      await this.firestoreService.addStreak(newStreak);
      
      // Reset input fields
      this.newStreakName = '';
      this.newStreakDuration = undefined;
      this.isIndefinite = false;
      
      console.log('Streak added to Firestore');
    } catch (error) {
      console.error('Error adding streak:', error);
      alert('Failed to add streak. Please try again.');
    }
  }

  // Increment streak count
  async incrementStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    const newCount = (streak.count || 0) + 1;
    
    try {
      await this.firestoreService.updateStreak(streak.id, { count: newCount });
      
      // Check if user has completed the goal
      if (streak.duration && newCount >= streak.duration) {
        this.selectedStreakIndex = index;
        this.showGoalModal = true;
      }
    } catch (error) {
      console.error('Error incrementing streak:', error);
    }
  }

  // Reset streak count
  async resetStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    try {
      await this.firestoreService.updateStreak(streak.id, { 
        count: 0, 
        badge: undefined 
      });
    } catch (error) {
      console.error('Error resetting streak:', error);
    }
  }

  // Delete streak from Firestore
  async deleteStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    if (!confirm(`Delete "${streak.name}" streak?`)) return;

    try {
      await this.firestoreService.deleteStreak(streak.id);
    } catch (error) {
      console.error('Error deleting streak:', error);
      alert('Failed to delete streak. Please try again.');
    }
  }

  // Update badges for all streaks
  updateBadges(): void {
    this.streaks.forEach((_, index) => this.updateBadge(index));
  }

  // Update badge for a single streak
  updateBadge(index: number): void {
    const streak = this.streaks[index];
    const milestone = this.milestoneBadges
      .slice()
      .reverse()
      .find(m => (streak.count || 0) >= m.days);

    const newBadge = milestone ? milestone.badge : undefined;
    
    // Only update if badge changed to avoid unnecessary Firestore calls
    if (milestone && streak.badge !== newBadge && streak.id) {
      this.firestoreService.updateStreak(streak.id, { badge: newBadge }).catch(error => {
        console.error('Error updating badge:', error);
      });
    }
  }

  // Extend streak duration
  async extendStreak(): Promise<void> {
    if (this.selectedStreakIndex === null) return;

    const streak = this.streaks[this.selectedStreakIndex];
    if (!streak.id) return;

    const additionalDays = prompt('How many days do you want to extend? (Leave blank to make indefinite)');

    if (additionalDays === null) {
      this.closeGoalModal();
      return;
    }

    try {
      if (additionalDays === '') {
        await this.firestoreService.updateStreak(streak.id, { 
          isIndefinite: true, 
          duration: undefined 
        });
      } else {
        const extraDays = parseInt(additionalDays, 10);
        if (!isNaN(extraDays) && extraDays > 0) {
          const newDuration = (streak.duration || 0) + extraDays;
          await this.firestoreService.updateStreak(streak.id, { duration: newDuration });
        }
      }
      this.closeGoalModal();
    } catch (error) {
      console.error('Error extending streak:', error);
    }
  }

  // Stop streak permanently
  async stopStreak(): Promise<void> {
    if (this.selectedStreakIndex === null) return;

    const streak = this.streaks[this.selectedStreakIndex];
    if (!streak.id) return;

    try {
      await this.firestoreService.deleteStreak(streak.id);
      this.closeGoalModal();
    } catch (error) {
      console.error('Error stopping streak:', error);
    }
  }

  closeGoalModal(): void {
    this.showGoalModal = false;
    this.selectedStreakIndex = null;
  }

  get selectedStreak(): Streak | undefined {
    return this.selectedStreakIndex !== null ? this.streaks[this.selectedStreakIndex] : undefined;
  }

  // Update Hijri date
  updateHijriDate(): void {
    try {
      const today = new Date();
      // Simple Hijri date calculation (approximate)
      this.hijriDate = `1st Ramadan 1445 AH`;
    } catch (error) {
      this.hijriDate = 'Unable to load date';
    }
  }

  // Save quote to local storage
  saveQuote(): void {
    if (!this.savedQuotes.includes(this.quoteOfTheDay)) {
      this.savedQuotes.push(this.quoteOfTheDay);
      localStorage.setItem('savedQuotes', JSON.stringify(this.savedQuotes));
    }
  }
  
  // Load saved quotes from local storage
  loadSavedQuotes(): void {
    const storedQuotes = localStorage.getItem('savedQuotes');
    if (storedQuotes) {
      this.savedQuotes = JSON.parse(storedQuotes);
    }
  }

  // Toggle saved quotes view
  toggleSavedQuotes(): void {
    this.showSavedQuotes = !this.showSavedQuotes;
  }

  // Cleanup on component destroy
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.firestoreService.cleanup();
  }
}

