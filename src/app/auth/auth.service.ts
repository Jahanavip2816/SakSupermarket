import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {

  api = 'https://localhost:5001/api/users';
  auth: any;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(data: any) {
    return this.http.post<any>(`${this.api}/login`, data);
  }

  saveSession(res: any) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('role', res.role);
      localStorage.setItem('email', res.email);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('role');
    }
    return null;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }


canActivate(): boolean {
  if (!isPlatformBrowser(this.platformId)) {
    return false; // block during prerender
  }

  return this.auth.isAdmin();
}

}
