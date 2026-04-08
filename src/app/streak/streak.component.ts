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

export type ActiveTab = 'habits' | 'analytics' | 'inspire' | 'add';

@Component({
  selector: 'app-streak',
  standalone: true,
  templateUrl: './streak.component.html',
  styleUrls: ['./streak.component.css'],
  imports: [FormsModule, CommonModule, StatsComponent, StatsDashboardComponent]
})
export class StreakComponent implements OnInit, OnDestroy {

  /* ─── Expose globals to template ─── */
  Math = Math;

  /* ─── Tab state ─── */
  activeTab: ActiveTab = 'habits';

  /* ─── Streaks ─── */
  streaks: Streak[] = [];
  newStreakName = '';
  newStreakDuration?: number;
  isIndefinite = false;

  /* ─── UI state ─── */
  hijriDate = 'Loading…';
  showGoalModal = false;
  selectedStreakIndex: number | null = null;
  isGoalAchievement = false;

  /* ─── Quotes ─── */
  showSavedQuotes = false;
  quoteOfTheDay = '';
  savedQuotes: string[] = [];

  readonly motivationalQuotes: string[] = [
    ...QuranQuotes,
    ...SahihBukhariQuotes,
    ...SahihMuslimQuotes,
  ];

  /* ─── Ayahs ─── */
  ayahOfDay: AyahOfDay | null = null;
  savedAyahs: AyahOfDay[] = [];
  showSavedAyahs = false;

  /* ─── Milestone badges ─── */
  readonly milestoneBadges = [
    { days: 7, badge: '🥉 Bronze Streak' },
    { days: 30, badge: '🥈 Silver Streak' },
    { days: 100, badge: '🥇 Gold Streak' },
    { days: 365, badge: '🏆 Legendary Streak' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private http: HttpClient,
  ) {
    this.quoteOfTheDay =
      this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
  }

  /* ════════════════════════════════
     Lifecycle
  ════════════════════════════════ */
  ngOnInit(): void {
    this.loadStreaks();
    this.updateHijriDate();
    this.loadSavedQuotes();
    this.loadAyahOfDay();
    this.loadSavedAyahs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.firestoreService.cleanup();
  }

  /* ════════════════════════════════
     Tab navigation
  ════════════════════════════════ */
  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
  }

  /* ════════════════════════════════
     Computed helpers
  ════════════════════════════════ */
  get totalStreaks(): number {
    return this.streaks.length;
  }

  get longestStreak(): number {
    return this.streaks.reduce((max, s) => Math.max(max, s.count ?? 0), 0);
  }

  get completionRate(): number {
    if (!this.streaks.length) return 0;
    const withGoal = this.streaks.filter(s => s.duration && !s.isIndefinite);
    if (!withGoal.length) return 0;
    const avg = withGoal.reduce((sum, s) => sum + ((s.count ?? 0) / s.duration!) * 100, 0);
    return Math.round(avg / withGoal.length);
  }

  /* ════════════════════════════════
     Streaks — CRUD
  ════════════════════════════════ */
  loadStreaks(): void {
    this.firestoreService
      .getStreaks()
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
      name: this.newStreakName.trim(),
      count: 0,
      duration: this.isIndefinite ? undefined : this.newStreakDuration,
      isIndefinite: this.isIndefinite,
      badge: undefined,
    };

    try {
      await this.firestoreService.addStreak(newStreak);
      this.notificationService.success(`✅ "${newStreak.name}" added!`);
      this.newStreakName = '';
      this.newStreakDuration = undefined;
      this.isIndefinite = false;
      this.setTab('habits');
    } catch {
      this.notificationService.error('❌ Failed to add streak. Please try again.');
    }
  }

  async incrementStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak?.id) { this.notificationService.error('❌ Streak not found'); return; }

    const newCount = (streak.count ?? 0) + 1;
    this.closeGoalModal();

    try {
      await this.firestoreService.updateStreak(streak.id, { count: newCount });
      this.notificationService.success(`🔥 ${streak.name}: ${newCount} day(s)!`);

      const milestone = this.milestoneBadges.find(m => m.days === newCount);
      if (milestone) this.notificationService.success(`🏅 ${milestone.badge} Unlocked!`);

      if (streak.duration && newCount >= streak.duration) {
        setTimeout(() => {
          this.selectedStreakIndex = index;
          this.isGoalAchievement = true;
          this.showGoalModal = true;
          this.notificationService.success(`🎊 Goal Achieved! ${streak.duration} days completed!`);
        }, 300);
      }
    } catch (err) {
      console.error('Error updating streak:', err);
      this.notificationService.error('❌ Failed to update streak.');
    }
  }

  async resetStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak?.id) return;
    if (!confirm(`Reset "${streak.name}" to 0 days?`)) return;
    this.closeGoalModal();

    try {
      await this.firestoreService.updateStreak(streak.id, { count: 0, badge: undefined });
      this.notificationService.warning(`⚠️ "${streak.name}" reset to 0 days.`);
    } catch (err) {
      console.error('Error resetting streak:', err);
      this.notificationService.error('❌ Failed to reset streak.');
    }
  }

  async deleteStreak(index: number): Promise<void> {
    const streak = this.streaks[index];
    if (!streak?.id) return;

    const wantsContinue = confirm(`Continue tracking "${streak.name}"?`);
    if (wantsContinue) {
      this.selectedStreakIndex = index;
      this.isGoalAchievement = false;
      this.showGoalModal = true;
      return;
    }

    if (!confirm(`⚠️ Permanently delete "${streak.name}"? This cannot be undone.`)) return;

    try {
      await this.firestoreService.deleteStreak(streak.id);
      this.notificationService.info(`🗑️ "${streak.name}" deleted.`);
    } catch (err) {
      console.error('Error deleting streak:', err);
      this.notificationService.error('❌ Failed to delete streak.');
    }
  }

  /* ════════════════════════════════
     Streaks — Badges
  ════════════════════════════════ */
  updateBadges(): void {
    this.streaks.forEach((_, i) => this.updateBadge(i));
  }

  updateBadge(index: number): void {
    const streak = this.streaks[index];
    const milestone = [...this.milestoneBadges]
      .reverse()
      .find(m => (streak.count ?? 0) >= m.days);

    if (milestone && streak.badge !== milestone.badge && streak.id) {
      this.firestoreService.updateStreak(streak.id, { badge: milestone.badge }).catch(console.error);
    }
  }

  /* ════════════════════════════════
     Goal modal
  ════════════════════════════════ */
  get selectedStreak(): Streak | undefined {
    return this.selectedStreakIndex !== null
      ? this.streaks[this.selectedStreakIndex]
      : undefined;
  }

  async extendStreak(): Promise<void> {
    if (this.selectedStreakIndex === null) {
      this.notificationService.error('❌ No streak selected'); return;
    }
    const streak = this.streaks[this.selectedStreakIndex];
    if (!streak?.id) { this.notificationService.error('❌ Streak ID not found'); return; }

    const input = prompt('How many days to continue? (Leave blank for indefinite):');
    if (input === null) { this.closeGoalModal(); return; }

    try {
      if (input.trim() === '') {
        await this.firestoreService.updateStreak(streak.id, {
          isIndefinite: true, duration: undefined, count: 0,
        });
        this.notificationService.success('✅ Streak set to indefinite!');
      } else {
        const extra = parseInt(input, 10);
        if (isNaN(extra) || extra <= 0) {
          this.notificationService.error('❌ Please enter a valid number'); return;
        }
        await this.firestoreService.updateStreak(streak.id, {
          duration: extra, isIndefinite: false, count: 0,
        });
        this.notificationService.success(`✅ Streak continued for ${extra} days!`);
      }
      this.closeGoalModal();
    } catch (err) {
      console.error('Error extending streak:', err);
      this.notificationService.error('❌ Failed to extend streak.');
    }
  }

  async stopStreak(): Promise<void> {
    if (this.selectedStreakIndex === null) {
      this.notificationService.error('❌ No streak selected'); return;
    }
    const streak = this.streaks[this.selectedStreakIndex];
    if (!streak?.id) { this.notificationService.error('❌ Streak ID not found'); return; }

    try {
      if (this.isGoalAchievement) {
        if (!confirm(`Mark "${streak.name}" as complete and archive it?`)) return;
        await this.firestoreService.deleteStreak(streak.id);
        this.notificationService.success(`✅ "${streak.name}" archived!`);
      } else {
        await this.firestoreService.deleteStreak(streak.id);
        this.notificationService.success(`✅ "${streak.name}" permanently deleted.`);
      }
      this.closeGoalModal();
    } catch (err) {
      console.error('Error stopping streak:', err);
      this.notificationService.error('❌ Failed to complete action.');
    }
  }

  closeGoalModal(): void {
    this.showGoalModal = false;
    this.selectedStreakIndex = null;
    this.isGoalAchievement = false;
  }

  /* ════════════════════════════════
     Hijri date
  ════════════════════════════════ */
  updateHijriDate(): void {
    this.http.get<any>('https://api.aladhan.com/v1/gToH').subscribe({
      next: res => {
        const h = res?.data?.hijri;
        this.hijriDate = h
          ? `${h.day} ${h.month.en} ${h.year} AH`
          : this.fallbackDate();
      },
      error: () => { this.hijriDate = this.fallbackDate(); },
    });
  }

  private fallbackDate(): string {
    const t = new Date();
    return `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`;
  }

  /* ════════════════════════════════
     Quotes
  ════════════════════════════════ */
  async saveQuote(): Promise<void> {
    if (this.savedQuotes.includes(this.quoteOfTheDay)) {
      this.notificationService.info('⭐ Already saved!'); return;
    }
    this.savedQuotes.push(this.quoteOfTheDay);
    try {
      await this.firestoreService.saveQuote(this.quoteOfTheDay);
      this.notificationService.success('⭐ Quote saved!');
    } catch {
      this.savedQuotes.pop();
      this.notificationService.error('❌ Could not save quote.');
    }
  }

  async loadSavedQuotes(): Promise<void> {
    try { this.savedQuotes = (await this.firestoreService.getSavedQuotes()) || []; }
    catch { this.savedQuotes = []; }
  }

  toggleSavedQuotes(): void { this.showSavedQuotes = !this.showSavedQuotes; }

  /* ════════════════════════════════
     Ayahs
  ════════════════════════════════ */
  loadAyahOfDay(): void {
    try { this.ayahOfDay = getAyahOfDay(); }
    catch (err) { console.error('Error loading Ayah:', err); this.ayahOfDay = null; }
  }

  async saveAyah(): Promise<void> {
    if (!this.ayahOfDay) return;
    const alreadySaved = this.savedAyahs.some(
      a => a.surah === this.ayahOfDay!.surah && a.ayah === this.ayahOfDay!.ayah,
    );
    if (alreadySaved) { this.notificationService.info('📖 Ayah already saved!'); return; }

    this.savedAyahs.push(this.ayahOfDay);
    try {
      await this.firestoreService.saveAyah(this.ayahOfDay);
      this.notificationService.success('⭐ Ayah saved!');
    } catch {
      this.savedAyahs.pop();
      this.notificationService.error('❌ Could not save Ayah.');
    }
  }

  async loadSavedAyahs(): Promise<void> {
    try { this.savedAyahs = (await this.firestoreService.getSavedAyahs()) || []; }
    catch { this.savedAyahs = []; }
  }

  async deleteAyah(index: number): Promise<void> {
    const ayah = this.savedAyahs[index];
    if (!confirm(`Delete this Ayah from ${ayah.surah}?`)) return;
    try {
      await this.firestoreService.deleteAyah(index);
      this.savedAyahs.splice(index, 1);
      this.notificationService.info('🗑️ Ayah removed.');
    } catch {
      this.notificationService.error('❌ Could not delete Ayah.');
    }
  }

  toggleSavedAyahs(): void { this.showSavedAyahs = !this.showSavedAyahs; }
}