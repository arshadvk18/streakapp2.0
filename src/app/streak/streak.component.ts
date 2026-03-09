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
  standalone: true,
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

  milestoneBadges = [
    { days: 7,   badge: '🥉 Bronze Streak'    },
    { days: 30,  badge: '🥈 Silver Streak'    },
    { days: 100, badge: '🥇 Gold Streak'      },
    { days: 365, badge: '🏆 Legendary Streak' }
  ];

  motivationalQuotes: string[] = [
    ...QuranQuotes,
    ...SahihBukhariQuotes,
    ...SahihMuslimQuotes
  ];

  quoteOfTheDay: string = '';
  savedQuotes: string[] = [];

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {
    this.quoteOfTheDay = this.motivationalQuotes[
      Math.floor(Math.random() * this.motivationalQuotes.length)
    ];
  }

  ngOnInit(): void {
    this.loadStreaks();
    this.updateHijriDate();
    this.loadSavedQuotes();
  }

  loadStreaks(): void {
    this.firestoreService.getStreaks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(streaks => {
        this.streaks = streaks.map(s => ({ ...s, isIndefinite: s.isIndefinite ?? false }));
        this.updateBadges();
      });
    this.firestoreService.loadStreaks();
  }

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
      this.notificationService.success(`✅ Streak "${this.newStreakName}" added!`);
      this.newStreakName = '';
      this.newStreakDuration = undefined;
      this.isIndefinite = false;
    } catch (error) {
      this.notificationService.error('❌ Failed to add streak. Please try again.');
    }
  }

  async incrementStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    const newCount = (streak.count || 0) + 1;

    try {
      await this.firestoreService.updateStreak(streak.id, { count: newCount });
      this.notificationService.success(`🔥 ${streak.name}: ${newCount} day(s)!`);

      const milestone = this.milestoneBadges.find(m => m.days === newCount);
      if (milestone) {
        this.notificationService.success(`🏅 ${milestone.badge} Unlocked!`);
      }

      if (streak.duration && newCount >= streak.duration) {
        this.selectedStreakIndex = index;
        this.showGoalModal = true;
        this.notificationService.success(`🎊 Goal Achieved! ${streak.duration} days completed!`);
      }
    } catch (error) {
      this.notificationService.error('❌ Failed to update streak.');
    }
  }

  async resetStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    try {
      await this.firestoreService.updateStreak(streak.id, { count: 0, badge: undefined });
      this.notificationService.warning(`⚠️ ${streak.name} has been reset.`);
    } catch (error) {
      this.notificationService.error('❌ Failed to reset streak.');
    }
  }

  async deleteStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;
    if (!confirm(`Delete "${streak.name}" streak?`)) return;

    try {
      await this.firestoreService.deleteStreak(streak.id);
      this.notificationService.info(`🗑️ "${streak.name}" deleted.`);
    } catch (error) {
      this.notificationService.error('❌ Failed to delete streak.');
    }
  }

  updateBadges(): void {
    this.streaks.forEach((_, i) => this.updateBadge(i));
  }

  updateBadge(index: number): void {
    const streak = this.streaks[index];
    const milestone = this.milestoneBadges
      .slice().reverse()
      .find(m => (streak.count || 0) >= m.days);

    const newBadge = milestone?.badge;
    if (milestone && streak.badge !== newBadge && streak.id) {
      this.firestoreService.updateStreak(streak.id, { badge: newBadge }).catch(console.error);
    }
  }

  async extendStreak(): Promise<void> {
    if (this.selectedStreakIndex === null) return;
    const streak = this.streaks[this.selectedStreakIndex];
    if (!streak.id) return;

    const additionalDays = prompt('How many days to extend? (Leave blank for indefinite)');
    if (additionalDays === null) { this.closeGoalModal(); return; }

    try {
      if (additionalDays === '') {
        await this.firestoreService.updateStreak(streak.id, { isIndefinite: true, duration: undefined });
      } else {
        const extra = parseInt(additionalDays, 10);
        if (!isNaN(extra) && extra > 0) {
          await this.firestoreService.updateStreak(streak.id, { duration: (streak.duration || 0) + extra });
        }
      }
      this.closeGoalModal();
    } catch (error) {
      console.error('Error extending streak:', error);
    }
  }

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

  updateHijriDate(): void {
    this.http.get<any>('https://api.aladhan.com/v1/gToH').subscribe({
      next: (response) => {
        if (response?.data?.hijri) {
          const h = response.data.hijri;
          this.hijriDate = `${h.day} ${h.month.en} ${h.year} AH`;
        }
      },
      error: () => {
        const t = new Date();
        this.hijriDate = `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`;
      }
    });
  }

  async saveQuote(): Promise<void> {
    if (this.savedQuotes.includes(this.quoteOfTheDay)) return;
    this.savedQuotes.push(this.quoteOfTheDay);
    try {
      await this.firestoreService.saveQuote(this.quoteOfTheDay);
      this.notificationService.success('⭐ Quote saved!');
    } catch (error) {
      this.notificationService.error('❌ Could not save quote.');
    }
  }

  async loadSavedQuotes(): Promise<void> {
    try {
      this.savedQuotes = (await this.firestoreService.getSavedQuotes()) || [];
    } catch {
      this.savedQuotes = [];
    }
  }

  toggleSavedQuotes(): void {
    this.showSavedQuotes = !this.showSavedQuotes;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.firestoreService.cleanup();
  }
}