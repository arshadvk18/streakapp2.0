import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StreakComponent } from './streak/streak.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,StreakComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'islamicstreak';
}
