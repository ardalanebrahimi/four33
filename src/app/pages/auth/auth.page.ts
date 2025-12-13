import { Component, inject, signal, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSpinner,
  ],
  template: `
    <ion-content [fullscreen]="true">
      <div class="container">
        <div class="header">
          <h1 class="logo">4'33"</h1>
          <p class="tagline">Listen to silence</p>
        </div>

        <div class="form-container">
          <div class="tabs">
            <button
              class="tab"
              [class.active]="mode() === 'login'"
              (click)="mode.set('login')"
            >
              Sign In
            </button>
            <button
              class="tab"
              [class.active]="mode() === 'register'"
              (click)="mode.set('register')"
            >
              Sign Up
            </button>
          </div>

          @if (mode() === 'register') {
            <input
              type="text"
              class="input"
              placeholder="Username"
              [(ngModel)]="username"
              [maxlength]="50"
            />
          }

          <input
            type="email"
            class="input"
            placeholder="Email"
            [(ngModel)]="email"
          />

          <input
            type="password"
            class="input"
            placeholder="Password"
            [(ngModel)]="password"
            (keyup.enter)="submit()"
          />

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }

          <button
            class="submit-button"
            [disabled]="!canSubmit || auth.isLoading()"
            (click)="submit()"
          >
            @if (auth.isLoading()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              {{ mode() === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT' }}
            }
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <button
            class="google-button"
            [disabled]="auth.isLoading()"
            (click)="signInWithGoogle()"
          >
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .container {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 24px;
    }

    .header {
      text-align: center;
      margin-bottom: 48px;
    }

    .logo {
      font-size: 48px;
      font-weight: 300;
      letter-spacing: 4px;
      margin: 0;
    }

    .tagline {
      color: var(--color-text-secondary);
      font-size: 14px;
      margin: 8px 0 0 0;
    }

    .form-container {
      max-width: 320px;
      margin: 0 auto;
      width: 100%;
    }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .tab {
      flex: 1;
      padding: 12px;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-secondary);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s ease;

      &.active {
        background: var(--color-surface-elevated);
        color: var(--color-text-primary);
        border-color: var(--color-border-light);
      }
    }

    .input {
      width: 100%;
      padding: 14px 16px;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-primary);
      font-size: 16px;
      margin-bottom: 12px;

      &::placeholder {
        color: var(--color-text-tertiary);
      }

      &:focus {
        outline: none;
        border-color: var(--color-border-light);
      }
    }

    .error {
      color: #ff6b6b;
      font-size: 14px;
      margin: 0 0 12px 0;
      text-align: center;
    }

    .submit-button {
      width: 100%;
      padding: 16px;
      background: var(--color-text-primary);
      border: none;
      border-radius: 8px;
      color: var(--color-bg);
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 1px;
      cursor: pointer;
      transition: opacity 0.15s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 52px;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        background: var(--color-surface-elevated);
        color: var(--color-text-tertiary);
        cursor: not-allowed;
      }

      ion-spinner {
        --color: var(--color-bg);
      }
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 20px 0;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--color-border);
      }

      span {
        padding: 0 16px;
        color: var(--color-text-tertiary);
        font-size: 13px;
      }
    }

    .google-button {
      width: 100%;
      padding: 14px 16px;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-primary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        border-color: var(--color-border-light);
        background: var(--color-surface);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .google-icon {
      width: 20px;
      height: 20px;
    }
  `]
})
export class AuthPage implements OnInit {
  private router = inject(Router);
  private ngZone = inject(NgZone);
  auth = inject(AuthService);

  mode = signal<AuthMode>('login');
  username = '';
  email = '';
  password = '';
  error = signal<string | null>(null);

  private googleClientId = environment.googleClientId;

  get canSubmit(): boolean {
    if (this.mode() === 'login') {
      return this.email.length > 0 && this.password.length > 0;
    }
    return this.username.length > 0 && this.email.length > 0 && this.password.length >= 6;
  }

  ngOnInit(): void {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn(): void {
    if (typeof google === 'undefined') {
      // Google script not loaded yet, wait for it
      const checkGoogle = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(checkGoogle);
          this.setupGoogleSignIn();
        }
      }, 100);
      return;
    }
    this.setupGoogleSignIn();
  }

  private setupGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: any) => this.handleGoogleCallback(response),
    });
  }

  private handleGoogleCallback(response: any): void {
    // Run inside Angular zone to trigger change detection
    this.ngZone.run(async () => {
      this.error.set(null);
      try {
        await this.auth.loginWithGoogle(response.credential);
        this.router.navigate(['/record']);
      } catch (err: any) {
        const message = err?.error?.error || err?.message || 'Google sign-in failed';
        this.error.set(message);
      }
    });
  }

  signInWithGoogle(): void {
    if (this.auth.isLoading()) return;

    // Trigger the Google One Tap / Sign-In prompt
    google.accounts.id.prompt();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit || this.auth.isLoading()) return;

    this.error.set(null);

    try {
      if (this.mode() === 'login') {
        await this.auth.login(this.email, this.password);
      } else {
        await this.auth.register(this.username, this.email, this.password);
      }
      this.router.navigate(['/record']);
    } catch (err: any) {
      const message = err?.error?.error || err?.message || 'Something went wrong';
      this.error.set(message);
    }
  }
}
