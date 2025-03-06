import { Component, OnInit } from '@angular/core';
import { StreakService } from '../streak.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-streak',
  templateUrl: './streak.component.html',
  styleUrls: ['./streak.component.css'],
  imports:[FormsModule,CommonModule]
})
export class StreakComponent implements OnInit {
  streaks: { name: string; count: number }[] = [];
  newStreakName: string = '';

  constructor(private streakService: StreakService) {}

  ngOnInit() {
    this.streaks = this.streakService.loadStreaks();
  }

  addStreak() {
    if (this.newStreakName.trim()) {
      this.streaks.push({ name: this.newStreakName, count: 1 });
      this.newStreakName = '';
      this.saveStreaks();
    }
  }

  incrementStreak(index: number) {
    this.streaks[index].count++;
    this.saveStreaks();
  }

  resetStreak(index: number) {
    this.streaks[index].count = 1;
    this.saveStreaks();
  }

  deleteStreak(index: number) {
    this.streaks.splice(index, 1);
    this.saveStreaks();
  }

  saveStreaks() {
    this.streakService.saveStreaks(this.streaks);
  }
}
