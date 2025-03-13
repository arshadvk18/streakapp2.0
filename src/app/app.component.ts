import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { StreakComponent } from './streak/streak.component';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'islamicstreak';
}
