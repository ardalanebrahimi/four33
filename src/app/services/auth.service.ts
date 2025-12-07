import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  followersCount: number;
  followingCount: number;
  recordingsCount: number;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

const TOKEN_KEY = 'four33_access_token';
const REFRESH_TOKEN_KEY = 'four33_refresh_token';
const USER_KEY = 'four33_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<AuthUser | null>(this.loadUserFromStorage());
  private _isLoading = signal(false);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor() {
    // Check if token is expired on init
    this.checkTokenExpiry();
  }

  private loadUserFromStorage(): AuthUser | null {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this._user.set(response.user);
  }

  private clearAuthData(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private checkTokenExpiry(): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      if (Date.now() > expiry) {
        this.refreshToken();
      }
    } catch {
      this.clearAuthData();
    }
  }

  async register(username: string, email: string, password: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('auth/register', { username, email, password } as RegisterRequest)
      );
      this.saveAuthData(response);
    } finally {
      this._isLoading.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('auth/login', { email, password } as LoginRequest)
      );
      this.saveAuthData(response);
    } finally {
      this._isLoading.set(false);
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuthData();
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('auth/refresh', { refreshToken })
      );
      this.saveAuthData(response);
      return true;
    } catch {
      this.clearAuthData();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.post('auth/logout'));
    } catch {
      // Ignore errors on logout
    }
    this.clearAuthData();
    this.router.navigate(['/']);
  }

  async updateProfile(): Promise<void> {
    try {
      const user = await firstValueFrom(this.api.get<AuthUser>('users/me'));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this._user.set(user);
    } catch {
      // Ignore errors
    }
  }
}
