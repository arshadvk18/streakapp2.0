import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  isLogin = true;
  email = '';
  password = '';
  displayName = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  // Password visibility toggles
  showPassword = false;
  showConfirm = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/streak']);
      }
    });
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.errorMessage = '';
    this.successMessage = '';
    this.showPassword = false;
    this.showConfirm = false;
    this.resetForm();
  }

  async handleSubmit(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required';
      return;
    }

    if (!this.isLogin) {
      if (!this.displayName.trim()) {
        this.errorMessage = 'Name is required';
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Passwords do not match';
        return;
      }
      if (this.password.length < 6) {
        this.errorMessage = 'Password must be at least 6 characters';
        return;
      }
    }

    this.loading = true;

    try {
      if (this.isLogin) {
        await this.authService.login(this.email, this.password);
        this.successMessage = 'Login successful!';
        this.router.navigate(['/streak']);
      } else {
        await this.authService.register(this.email, this.password, this.displayName);
        this.successMessage = 'Account created! Logging in…';
        await this.authService.login(this.email, this.password);
        this.router.navigate(['/streak']);
      }
    } catch (error: any) {
      this.errorMessage = error || 'An error occurred. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private resetForm(): void {
    this.email = '';
    this.password = '';
    this.displayName = '';
    this.confirmPassword = '';
  }
}