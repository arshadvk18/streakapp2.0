import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService, Streak } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { StatsComponent } from '../components/stats.component';
import { QuranQuotes, SahihBukhariQuotes, SahihMuslimQuotes } from '../quotes'; 
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-streak',
  templateUrl: './streak.component.html',
  styleUrls: ['./streak.component.css'],
  imports: [FormsModule, CommonModule, StatsComponent]
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

  private firestoreService = new FirestoreService();
  private authService = new AuthService();
  private notificationService = new NotificationService();

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
    firestoreService: FirestoreService,
    authService: AuthService,
    notificationService: NotificationService,
    private http: HttpClient
  ) {
    this.firestoreService = firestoreService;
    this.authService = authService;
    this.notificationService = notificationService;
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
      
      // Show notification
      this.notificationService.success(`✅ Streak "${this.newStreakName}" added!`);
      
      // Reset input fields
      this.newStreakName = '';
      this.newStreakDuration = undefined;
      this.isIndefinite = false;
      
      console.log('Streak added to Firestore');
    } catch (error) {
      console.error('Error adding streak:', error);
      this.notificationService.error('❌ Failed to add streak. Please try again.');
    }
  }

  // Increment streak count
  async incrementStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    const newCount = (streak.count || 0) + 1;
    
    try {
      await this.firestoreService.updateStreak(streak.id, { count: newCount });
      
      // Show notification
      this.notificationService.success(`🎉 ${streak.name}: ${newCount} day(s)!`);
      
      // Check for milestone badge
      const milestones = this.milestoneBadges.filter(m => m.days === newCount);
      if (milestones.length > 0) {
        this.notificationService.success(`🏅 ${milestones[0].badge} Unlocked!`);
      }
      
      // Check if user has completed the goal
      if (streak.duration && newCount >= streak.duration) {
        this.selectedStreakIndex = index;
        this.showGoalModal = true;
        this.notificationService.success(`🎊 Goal Achieved! You completed ${streak.duration} days!`);
      }
    } catch (error) {
      console.error('Error incrementing streak:', error);
      this.notificationService.error('❌ Failed to update streak.');
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
      this.notificationService.warning(`⚠️ ${streak.name} has been reset.`);
    } catch (error) {
      console.error('Error resetting streak:', error);
      this.notificationService.error('❌ Failed to reset streak.');
    }
  }

  // Delete streak from Firestore
  async deleteStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    if (!confirm(`Delete "${streak.name}" streak?`)) return;

    try {
      await this.firestoreService.deleteStreak(streak.id);
      this.notificationService.info(`🗑️ "${streak.name}" deleted.`);
    } catch (error) {
      console.error('Error deleting streak:', error);
      this.notificationService.error('❌ Failed to delete streak. Please try again.');
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
      // Fetch Hijri date from Aladhan API
      this.http.get<any>('https://api.aladhan.com/v1/gToH')
        .subscribe(
          (response: any) => {
            if (response && response.data && response.data.hijri) {
              const hijri = response.data.hijri;
              const day = hijri.day;
              const month = hijri.month.en;
              const year = hijri.year;
              this.hijriDate = `${day} ${month} ${year} AH`;
            }
          },
          (error: any) => {
            console.error('Error fetching Hijri date:', error);
            // Fallback to today's date in Gregorian if API fails
            const today = new Date();
            this.hijriDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
          }
        );
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

