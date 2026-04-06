import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService, Streak } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StatsComponent } from '../components/stats.component';
import { StatsDashboardComponent } from '../components/stats-dashboard.component';
import { QuranQuotes, SahihBukhariQuotes, SahihMuslimQuotes } from '../quotes';
import { getAyahOfDay, AyahOfDay } from '../verses';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-streak',
  standalone: true,
  templateUrl: './streak.component.html',
  styleUrls: ['./streak.component.css'],
  imports: [FormsModule, CommonModule, StatsComponent, StatsDashboardComponent]
})
export class StreakComponent implements OnInit, OnDestroy {
  streaks: Streak[] = [];
  newStreakName: string = '';
  newStreakDuration?: number;
  isIndefinite: boolean = false;
  hijriDate: string = 'Loading...';
  showGoalModal: boolean = false;
  selectedStreakIndex: number | null = null;
  isGoalAchievement: boolean = false;  // Track if modal is for goal or continuation
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
  ayahOfDay: AyahOfDay | null = null;
  savedAyahs: AyahOfDay[] = [];
  showSavedAyahs: boolean = false;
  showAyahTab: boolean = false;

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
    this.loadAyahOfDay();
    this.loadSavedAyahs();
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
    if (!streak.id) {
      this.notificationService.error('❌ Streak not found');
      return;
    }

    const newCount = (streak.count || 0) + 1;

    // Close goal modal if open to prevent state confusion
    this.closeGoalModal();

    try {
      await this.firestoreService.updateStreak(streak.id, { count: newCount });
      this.notificationService.success(`🔥 ${streak.name}: ${newCount} day(s)!`);

      const milestone = this.milestoneBadges.find(m => m.days === newCount);
      if (milestone) {
        this.notificationService.success(`🏅 ${milestone.badge} Unlocked!`);
      }

      if (streak.duration && newCount >= streak.duration) {
        // Delay showing the modal to allow state to update
        setTimeout(() => {
          this.selectedStreakIndex = index;
          this.isGoalAchievement = true;  // Mark as goal achievement
          this.showGoalModal = true;
          this.notificationService.success(`🎊 Goal Achieved! ${streak.duration} days completed!`);
        }, 300);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
      this.notificationService.error('❌ Failed to update streak.');
    }
  }

  async resetStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;

    const confirmed = confirm(`Reset "${streak.name}" to 0 days? You'll need to start over.`);
    if (!confirmed) return;

    // Close any open modals first
    this.closeGoalModal();

    try {
      await this.firestoreService.updateStreak(streak.id, { count: 0, badge: undefined });
      this.notificationService.warning(`⚠️ ${streak.name} has been reset to 0 days.`);
    } catch (error) {
      console.error('Error resetting streak:', error);
      this.notificationService.error('❌ Failed to reset streak.');
    }
  }

  async deleteStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak.id) return;
    
    const confirmed = confirm(`Do you want to continue "${streak.name}" habit tracking?`);
    
    if (confirmed) {
      // User wants to continue - show goal continuation modal
      this.selectedStreakIndex = index;
      this.isGoalAchievement = false;  // Mark as continuation, not achievement
      this.showGoalModal = true;
    } else {
      // User wants to actually delete it
      const finalConfirm = confirm(`⚠️ This will permanently delete "${streak.name}". Are you sure?`);
      if (!finalConfirm) return;

      try {
        await this.firestoreService.deleteStreak(streak.id);
        this.notificationService.info(`🗑️ "${streak.name}" permanently deleted.`);
      } catch (error) {
        console.error('Error deleting streak:', error);
        this.notificationService.error('❌ Failed to delete streak.');
      }
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
    if (this.selectedStreakIndex === null) {
      this.notificationService.error('❌ No streak selected');
      return;
    }
    const streak = this.streaks[this.selectedStreakIndex];
    if (!streak.id) {
      this.notificationService.error('❌ Streak ID not found');
      return;
    }

    const additionalDays = prompt('How many days to continue? (Leave blank for indefinite):');
    if (additionalDays === null) {
      this.closeGoalModal();
      return;
    }

    try {
      if (additionalDays.trim() === '') {
        // Set to indefinite
        await this.firestoreService.updateStreak(streak.id, { 
          isIndefinite: true, 
          duration: undefined,
          count: 0  // Reset count for new tracking period
        });
        this.notificationService.success('✅ Streak set to indefinite! Starting fresh at 0 days.');
      } else {
        const extra = parseInt(additionalDays, 10);
        if (isNaN(extra) || extra <= 0) {
          this.notificationService.error('❌ Please enter a valid number');
          return;
        }
        // Set new duration
        await this.firestoreService.updateStreak(streak.id, { 
          duration: extra,
          isIndefinite: false,
          count: 0  // Reset count for new tracking period
        });
        this.notificationService.success(`✅ Streak continued for ${extra} days! Starting fresh at 0 days.`);
      }
      this.closeGoalModal();
    } catch (error) {
      console.error('Error extending streak:', error);
      this.notificationService.error('❌ Failed to continue streak');
    }
  }

  async stopStreak(): Promise<void> {
    if (this.selectedStreakIndex === null) {
      this.notificationService.error('❌ No streak selected');
      return;
    }
    const streak = this.streaks[this.selectedStreakIndex];
    if (!streak.id) {
      this.notificationService.error('❌ Streak ID not found');
      return;
    }

    try {
      if (this.isGoalAchievement) {
        // Goal achievement - delete the streak after completion
        const confirmed = confirm(`Mark "${streak.name}" as complete and close it?`);
        if (!confirmed) {
          return;
        }
        await this.firestoreService.deleteStreak(streak.id);
        this.notificationService.success(`✅ "${streak.name}" marked complete and archived!`);
      } else {
        // Continuation scenario - just delete it without confirmation
        await this.firestoreService.deleteStreak(streak.id);
        this.notificationService.success(`✅ "${streak.name}" permanently deleted.`);
      }
      this.closeGoalModal();
    } catch (error) {
      console.error('Error stopping streak:', error);
      this.notificationService.error('❌ Failed to complete action.');
    }
  }

  closeGoalModal(): void {
    this.showGoalModal = false;
    this.selectedStreakIndex = null;
    this.isGoalAchievement = false;
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

  /**
   * ============= AYAH OF THE DAY METHODS =============
   */
  loadAyahOfDay(): void {
    try {
      this.ayahOfDay = getAyahOfDay();
    } catch (error) {
      console.error('Error loading Ayah of the Day:', error);
      this.ayahOfDay = null;
    }
  }

  async saveAyah(): Promise<void> {
    if (!this.ayahOfDay) return;
    
    // Check if already saved
    const alreadySaved = this.savedAyahs.some(
      a => a.surah === this.ayahOfDay!.surah && a.ayah === this.ayahOfDay!.ayah
    );
    
    if (alreadySaved) {
      this.notificationService.info('📖 This Ayah is already saved!');
      return;
    }

    this.savedAyahs.push(this.ayahOfDay);
    try {
      await this.firestoreService.saveAyah(this.ayahOfDay);
      this.notificationService.success('⭐ Ayah saved!');
    } catch (error) {
      this.notificationService.error('❌ Could not save Ayah.');
      // Remove from local array if save fails
      this.savedAyahs.pop();
    }
  }

  async loadSavedAyahs(): Promise<void> {
    try {
      this.savedAyahs = (await this.firestoreService.getSavedAyahs()) || [];
    } catch {
      this.savedAyahs = [];
    }
  }

  async deleteAyah(index: number): Promise<void> {
    const ayah = this.savedAyahs[index];
    if (!confirm(`Delete this Ayah from ${ayah.surah}?`)) return;

    try {
      await this.firestoreService.deleteAyah(index);
      this.savedAyahs.splice(index, 1);
      this.notificationService.info('🗑️ Ayah removed.');
    } catch (error) {
      this.notificationService.error('❌ Could not delete Ayah.');
    }
  }

  toggleSavedAyahs(): void {
    this.showSavedAyahs = !this.showSavedAyahs;
  }

  toggleAyahTab(): void {
    this.showAyahTab = !this.showAyahTab;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.firestoreService.cleanup();
  }
}