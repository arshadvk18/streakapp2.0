import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  isDarkMode = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.getTheme().subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}