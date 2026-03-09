import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService, Streak } from '../services/firestore.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-wrap">

      <!-- Section label -->
      <div class="section-label">
        <span class="label-line"></span>
        <span class="label-text">Your Progress</span>
        <span class="label-line"></span>
      </div>

      <!-- Stat tiles -->
      <div class="stat-grid">
        <div class="stat-tile" style="--delay:0s">
          <div class="stat-icon-wrap" style="--color:#d4af37">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <div class="stat-num">{{ totalStreaks }}</div>
          <div class="stat-label">Total Habits</div>
        </div>

        <div class="stat-tile" style="--delay:0.08s">
          <div class="stat-icon-wrap" style="--color:#4ade80">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </div>
          <div class="stat-num">{{ activeStreaks }}</div>
          <div class="stat-label">Active</div>
        </div>

        <div class="stat-tile" style="--delay:0.16s">
          <div class="stat-icon-wrap" style="--color:#f97316">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03z"/></svg>
          </div>
          <div class="stat-num">{{ longestStreak }}</div>
          <div class="stat-label">Best Streak</div>
        </div>

        <div class="stat-tile" style="--delay:0.24s">
          <div class="stat-icon-wrap" style="--color:#a78bfa">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
          </div>
          <div class="stat-num">{{ totalDays }}</div>
          <div class="stat-label">Total Days</div>
        </div>
      </div>

      <!-- Streak breakdown -->
      <div class="breakdown" *ngIf="streaks.length > 0">
        <div class="breakdown-title">
          <span class="ornament-diamond">◆</span>
          Habit Breakdown
          <span class="ornament-diamond">◆</span>
        </div>
        <div class="breakdown-list">
          <div *ngFor="let streak of streaks" class="breakdown-row">
            <div class="breakdown-meta">
              <span class="breakdown-name">{{ streak.name }}</span>
              <span class="breakdown-count">{{ streak.count }} <span class="breakdown-days">days</span></span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar">
                <div class="breakdown-fill" [style.width.%]="getProgress(streak)"></div>
              </div>
              <span class="breakdown-hint">
                {{ streak.isIndefinite ? '♾ Ongoing' : streak.duration ? (streak.count + ' / ' + streak.duration) : 'No limit' }}
                <span *ngIf="streak.badge" class="badge-mini">{{ streak.badge }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    
    :host { display: block; width: 100%; max-width: 560px; }

    .stats-wrap {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Section label */
    .section-label {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Cinzel', serif;
      font-size: 0.62rem;
      letter-spacing: 0.2em;
      color: rgba(212,175,55,0.6);
      text-transform: uppercase;
    }
    .label-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(212,175,55,0.3));
    }
    .label-line:last-child { background: linear-gradient(to left, transparent, rgba(212,175,55,0.3)); }

    /* Stat grid */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    @media (max-width: 480px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }

    .stat-tile {
      background: #0d1424;
      border: 1px solid rgba(212,175,55,0.13);
      border-radius: 12px;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      animation: tileIn 0.5s ease both;
      animation-delay: var(--delay, 0s);
      transition: border-color 0.25s, transform 0.2s;
    }
    .stat-tile:hover {
      border-color: rgba(212,175,55,0.28);
      transform: translateY(-2px);
    }
    @keyframes tileIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .stat-icon-wrap {
      width: 34px; height: 34px;
      border-radius: 8px;
      background: rgba(var(--color), 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon-wrap svg { width: 16px; height: 16px; fill: var(--color); }

    .stat-num {
      font-family: 'Cinzel', serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #f5f0e8;
      line-height: 1;
    }
    .stat-label {
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      color: rgba(245,240,232,0.35);
      text-transform: uppercase;
      font-family: 'Cinzel', serif;
      text-align: center;
    }

    /* Breakdown */
    .breakdown {
      background: #0d1424;
      border: 1px solid rgba(212,175,55,0.13);
      border-radius: 14px;
      padding: 20px;
    }
    .breakdown-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      color: rgba(212,175,55,0.7);
      margin-bottom: 16px;
    }
    .ornament-diamond { font-size: 0.5rem; }

    .breakdown-list { display: flex; flex-direction: column; gap: 14px; }
    .breakdown-row {}
    .breakdown-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
    }
    .breakdown-name {
      font-family: 'Cinzel', serif;
      font-size: 0.78rem;
      color: rgba(245,240,232,0.8);
    }
    .breakdown-count {
      font-family: 'Cinzel', serif;
      font-size: 0.85rem;
      font-weight: 700;
      color: #d4af37;
    }
    .breakdown-days { font-size: 0.6rem; font-weight: 400; color: rgba(212,175,55,0.5); }

    .breakdown-bar-wrap {}
    .breakdown-bar {
      height: 3px;
      background: rgba(255,255,255,0.06);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .breakdown-fill {
      height: 100%;
      background: linear-gradient(90deg, #1a7a4a, #d4af37);
      border-radius: 999px;
      transition: width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .breakdown-hint {
      font-size: 0.6rem;
      color: rgba(245,240,232,0.28);
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-mini {
      padding: 1px 6px;
      background: rgba(212,175,55,0.12);
      border: 1px solid rgba(212,175,55,0.2);
      border-radius: 999px;
      color: rgba(212,175,55,0.7);
      font-size: 0.55rem;
    }
  `]
})
export class StatsComponent implements OnInit, OnDestroy {
  streaks: Streak[] = [];
  totalStreaks = 0;
  activeStreaks = 0;
  longestStreak = 0;
  totalDays = 0;

  private firestoreService = inject(FirestoreService);
  private destroy$ = new Subject<void>();

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

  getProgress(streak: Streak): number {
    const milestone = streak.duration || (streak.count >= 365 ? 365 : streak.count >= 100 ? 100 : streak.count >= 30 ? 30 : 7);
    return Math.min((streak.count / milestone) * 100, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}