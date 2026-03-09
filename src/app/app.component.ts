import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { NotificationsComponent } from './components/notifications.component';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, NotificationsComponent, RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true
})
export class AppComponent implements OnInit {
  title = 'islamicstreak';
  isLoggedIn$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.isLoggedIn$ = this.authService.getIsLoggedIn();
  }

  ngOnInit() {
    // Initialize theme on app startup
    this.themeService.initTheme();
  }
}
