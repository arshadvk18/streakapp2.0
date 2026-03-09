import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  imports:[CommonModule,RouterLink],
  standalone:true
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

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleDarkMode() {
    this.themeService.toggleTheme();
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
