import { Injectable, inject } from '@angular/core';
import { FirestoreService, Streak } from './firestore.service';
import { Observable, map } from 'rxjs';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalStreaks: number;
  completionPercentageThisMonth: number;
  completionPercentageLastMonth: number;
  monthComparison: {
    thisMonth: number;
    lastMonth: number;
    change: number;
    changePercent: number;
  };
  averageStreak: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private firestoreService = inject(FirestoreService);

  /**
   * Get comprehensive stats about streaks
   */
  getStats(): Observable<StreakStats> {
    return this.firestoreService.getStreaks().pipe(
      map(streaks => this.calculateStats(streaks))
    );
  }

  /**
   * Calculate all statistics from streaks
   */
  private calculateStats(streaks: Streak[]): StreakStats {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get counts (assuming count represents days tracked this month)
    const streaksThisMonth = streaks.reduce((sum, streak) => {
      const updatedDate = streak.updatedAt || new Date();
      const isThisMonth = 
        updatedDate.getMonth() === currentMonth && 
        updatedDate.getFullYear() === currentYear;
      return isThisMonth ? sum + streak.count : sum;
    }, 0);

    const streaksLastMonth = streaks.reduce((sum, streak) => {
      const updatedDate = streak.updatedAt || new Date();
      const isLastMonth = 
        updatedDate.getMonth() === lastMonth && 
        updatedDate.getFullYear() === lastMonthYear;
      return isLastMonth ? sum + streak.count : sum;
    }, 0);

    // Calculate current streak (sum of all active streaks)
    const currentStreak = streaks.reduce((sum, streak) => sum + streak.count, 0);

    // Calculate longest streak ever
    const longestStreak = streaks.length > 0
      ? Math.max(...streaks.map(s => s.count || 0))
      : 0;

    // Days in current month
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInLastMonth = new Date(lastMonthYear, lastMonth + 1, 0).getDate();

    // Completion percentages
    const completionPercentageThisMonth = daysInCurrentMonth > 0
      ? Math.min(100, Math.round((streaksThisMonth / daysInCurrentMonth) * 100))
      : 0;

    const completionPercentageLastMonth = daysInLastMonth > 0
      ? Math.min(100, Math.round((streaksLastMonth / daysInLastMonth) * 100))
      : 0;

    // Month comparison
    const change = streaksThisMonth - streaksLastMonth;
    const changePercent = streaksLastMonth > 0
      ? Math.round(((change / streaksLastMonth) * 100) * 10) / 10
      : 0;

    // Average streak
    const averageStreak = streaks.length > 0
      ? Math.round((streaks.reduce((sum, s) => sum + (s.count || 0), 0) / streaks.length) * 10) / 10
      : 0;

    return {
      currentStreak,
      longestStreak,
      totalStreaks: streaks.length,
      completionPercentageThisMonth,
      completionPercentageLastMonth,
      monthComparison: {
        thisMonth: streaksThisMonth,
        lastMonth: streaksLastMonth,
        change,
        changePercent
      },
      averageStreak
    };
  }

  /**
   * Get individual streak stats
   */
  getStreakStats(streakId: string): Observable<any> {
    return this.firestoreService.getStreaks().pipe(
      map(streaks => {
        const streak = streaks.find(s => s.id === streakId);
        if (!streak) return null;

        return {
          name: streak.name,
          currentCount: streak.count,
          createdAt: streak.createdAt,
          updatedAt: streak.updatedAt,
          daysSinceCreated: streak.createdAt
            ? Math.floor((new Date().getTime() - new Date(streak.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          badge: streak.badge
        };
      })
    );
  }

  /**
   * Calculate percentage of goal reached
   */
  getGoalProgress(streak: Streak): number {
    if (!streak.duration || streak.duration === 0) return 0;
    return Math.min(100, Math.round((streak.count / streak.duration) * 100));
  }

  /**
   * Determine streak status (on track, at risk, broken)
   */
  getStreakStatus(streak: Streak): 'active' | 'risk' | 'broken' {
    if (!streak.updatedAt) return 'active';

    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(streak.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate === 0) return 'active';    // Updated today
    if (daysSinceUpdate === 1) return 'risk';      // Last updated yesterday
    return 'broken';                               // Not updated for 2+ days
  }

  /**
   * Format streak count with proper grammar
   */
  formatStreakText(count: number): string {
    return count === 1 ? `${count} day` : `${count} days`;
  }

  /**
   * Get streak color based on status
   */
  getStatusColor(status: 'active' | 'risk' | 'broken'): string {
    switch (status) {
      case 'active':
        return '#10b981'; // Green
      case 'risk':
        return '#f59e0b'; // Amber
      case 'broken':
        return '#ef4444'; // Red
    }
  }

  /**
   * Get motivational message based on stats
   */
  getMotivationalMessage(stats: StreakStats): string {
    if (stats.currentStreak === 0) {
      return '🌟 Start your first streak today!';
    }

    if (stats.longestStreak > 100) {
      return '🏆 You are a legend! Keep it up!';
    }

    if (stats.longestStreak > 50) {
      return '⭐ Amazing dedication! You\'re unstoppable!';
    }

    if (stats.longestStreak > 30) {
      return '🌙 Great progress! Building strong habits!';
    }

    if (stats.monthComparison.changePercent > 20) {
      return '📈 Fantastic improvement this month!';
    }

    if (stats.monthComparison.changePercent < -20) {
      return '💪 Let\'s get back on track this month!';
    }

    return '✨ Keep pushing towards your goals!';
  }
}
