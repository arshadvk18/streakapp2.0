import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService, Streak } from '../services/firestore.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-br from-purple-100 to-purple-300 rounded-2xl p-6 shadow-lg">
      <h2 class="text-2xl font-bold text-purple-900 mb-6">📊 Your Statistics</h2>
      
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <!-- Total Streaks -->
        <div class="bg-white rounded-lg p-4 shadow-md transform hover:scale-105 transition">
          <div class="text-3xl font-bold text-blue-600">{{ totalStreaks }}</div>
          <div class="text-sm text-gray-600 mt-2">Total Streaks</div>
        </div>

        <!-- Active Streaks -->
        <div class="bg-white rounded-lg p-4 shadow-md transform hover:scale-105 transition">
          <div class="text-3xl font-bold text-green-600">{{ activeStreaks }}</div>
          <div class="text-sm text-gray-600 mt-2">Active</div>
        </div>

        <!-- Longest Streak -->
        <div class="bg-white rounded-lg p-4 shadow-md transform hover:scale-105 transition">
          <div class="text-3xl font-bold text-orange-600">{{ longestStreak }}</div>
          <div class="text-sm text-gray-600 mt-2">Longest Days</div>
        </div>

        <!-- Total Days -->
        <div class="bg-white rounded-lg p-4 shadow-md transform hover:scale-105 transition">
          <div class="text-3xl font-bold text-pink-600">{{ totalDays }}</div>
          <div class="text-sm text-gray-600 mt-2">Total Days</div>
        </div>
      </div>

      <!-- Streak Breakdown -->
      <div class="mt-8">
        <h3 class="text-lg font-bold text-purple-900 mb-4">🎯 Streak Breakdown</h3>
        <div class="space-y-3">
          <div 
            *ngFor="let streak of streaks"
            class="bg-white rounded-lg p-4 shadow-md"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-semibold text-gray-800">{{ streak.name }}</span>
              <span class="text-sm font-bold text-blue-600">{{ streak.count }} days</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                [style.width.%]="(streak.count / getMilestone(streak)) * 100"
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ streak.isIndefinite ? '♾️ Indefinite' : streak.duration ? (streak.count + '/' + streak.duration + ' days') : 'No limit' }}
              <span *ngIf="streak.badge" class="ml-2">{{ streak.badge }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StatsComponent implements OnInit, OnDestroy {
  streaks: Streak[] = [];
  totalStreaks = 0;
  activeStreaks = 0;
  longestStreak = 0;
  totalDays = 0;
  private destroy$ = new Subject<void>();

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.firestoreService.getStreaks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(streaks => {
        this.streaks = streaks;
        this.calculateStats();
      });
  }

  private calculateStats(): void {
    this.totalStreaks = this.streaks.length;
    this.activeStreaks = this.streaks.filter(s => (s.count || 0) > 0).length;
    this.longestStreak = Math.max(...this.streaks.map(s => s.count || 0), 0);
    this.totalDays = this.streaks.reduce((sum, s) => sum + (s.count || 0), 0);
  }

  getMilestone(streak: Streak): number {
    if (streak.duration) return streak.duration;
    if ((streak.count || 0) >= 365) return 365;
    if ((streak.count || 0) >= 100) return 100;
    if ((streak.count || 0) >= 30) return 30;
    return 7;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
