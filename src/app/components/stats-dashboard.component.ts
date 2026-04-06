import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService, StreakStats } from '../services/stats.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-dashboard.component.html',
  styleUrl: './stats-dashboard.component.css'
})
export class StatsDashboardComponent implements OnInit {
  stats$!: Observable<StreakStats>;
  
  statsService = inject(StatsService);

  ngOnInit(): void {
    this.stats$ = this.statsService.getStats();
  }

  /**
   * Get days in current month
   */
  getDaysInMonth(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  /**
   * Get days in last month
   */
  getDaysInLastMonth(): number {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return new Date(lastMonthYear, lastMonth + 1, 0).getDate();
  }

  /**
   * Determine trend arrow based on month comparison
   */
  getTrendArrow(changePercent: number): string {
    if (changePercent > 0) return '📈';
    if (changePercent < 0) return '📉';
    return '➡️';
  }

  /**
   * Determine trend color
   */
  getTrendColor(changePercent: number): string {
    if (changePercent > 0) return 'positive';
    if (changePercent < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Format percentage with + or - sign
   */
  formatTrendPercent(percent: number): string {
    if (percent > 0) return `+${percent}%`;
    return `${percent}%`;
  }

  /**
   * Get motivational message based on stats
   */
  getMotivationalMessage(stats: StreakStats): string {
    return this.statsService.getMotivationalMessage(stats);
  }
}
