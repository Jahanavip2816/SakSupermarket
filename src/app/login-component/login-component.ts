import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-login-component',
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.css'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {

  // ===== Login =====
  email = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;

  // ===== Forgot password =====
  forgotEmail = '';
  securityQ1 = '';
  securityQ2 = '';
  answer1 = '';
  answer2 = '';
  isVerified = false;
  newPassword = '';
  confirmPassword = '';
  forgotError = '';
  forgotSuccess = '';

  // ===== UI states =====
  showForgot = false;
  showSignup = false;

  // ===== Signup =====
  signupEmail = '';
  signupPassword = '';
  signupRole = '';
  signupColor = '';
  signupSubject = '';
  signupError = '';
  signupSuccess = '';

  private readonly API = 'https://localhost:7155/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ==========================
  // Helpers
  // ==========================
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // ==========================
  // Login
  // ==========================
  login() {
    if (!this.isBrowser()) return;

    this.error = '';
    this.loading = true;

    const data = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>(`${this.API}/users/login`, data).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('email', res.email);
        localStorage.setItem('isLoggedIn', 'true');

        const role = res.role?.trim().toLowerCase();

        if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (role === 'inventory manager') {
          this.router.navigate(['/inventory-manager']);
        } else if (role === 'cashier') {
          this.router.navigate(['/cashier']);
        } else {
          this.router.navigate(['/login']);
        }

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.status === 401
            ? 'Invalid email or password'
            : 'Server error. Please try again.';
      }
    });
  }

 
  getSecurityQuestions() {
    if (!this.isBrowser()) return;

    this.forgotError = '';
    this.forgotSuccess = '';
    this.isVerified = false;

    this.http
      .get<any>(`${this.API}/Users/security-questions/${this.forgotEmail}`)
      .subscribe({
        next: (res) => {
          this.securityQ1 = res.question1;
          this.securityQ2 = res.question2;
        },
        error: () => {
          this.forgotError = 'Email not found';
        }
      });
  }

  verifySecurityAnswers() {
    if (!this.isBrowser()) return;

    this.forgotError = '';

    const data = {
      email: this.forgotEmail,
      answer1: this.answer1,
      answer2: this.answer2
    };

    this.http
      .post(`${this.API}/Users/verify-answers`, data)
      .subscribe({
        next: () => (this.isVerified = true),
        error: () =>
          (this.forgotError = 'Security answers are incorrect')
      });
  }

  resetPassword() {
    if (!this.isBrowser()) return;

    this.forgotError = '';
    this.forgotSuccess = '';

    if (this.newPassword !== this.confirmPassword) {
      this.forgotError = 'Passwords do not match';
      return;
    }

    const data = {
      email: this.forgotEmail,
      newPassword: this.newPassword
    };

    this.http
      .post(`${this.API}/Users/reset-password`, data)
      .subscribe({
        next: () => {
          this.forgotSuccess =
            'Password reset successful. Please login.';
          this.router.navigate(['/login']);
        },
        error: () =>
          (this.forgotError = 'Password reset failed')
      });
  }

  
  signup() {
    if (!this.isBrowser()) return;

    this.signupError = '';
    this.signupSuccess = '';

    const data = {
      email: this.signupEmail,
      password: this.signupPassword,
      role: this.signupRole,
      securityQuestion1: 'What is your favourite color?',
      securityAnswer1: this.signupColor,
      securityQuestion2: 'What is your favourite subject?',
      securityAnswer2: this.signupSubject
    };

    this.http
      .post(`${this.API}/users/signup`, data)
      .subscribe({
        next: () => {
          this.signupSuccess = 'Registration successful';
          this.backToLogin();
        },
        error: (err) => {
          this.signupError =
            err.status === 409
              ? 'Email already exists'
              : 'Registration failed';
        }
      });
  }

  
  openForgotPassword() {
    this.showForgot = true;
    this.showSignup = false;
  }

  openSignup() {
    this.showSignup = true;
    this.showForgot = false;
  }

  backToLogin() {
    this.showForgot = false;
    this.showSignup = false;
  }
}
