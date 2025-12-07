import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

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
  `]
})
export class AuthPage {
  private router = inject(Router);
  auth = inject(AuthService);

  mode = signal<AuthMode>('login');
  username = '';
  email = '';
  password = '';
  error = signal<string | null>(null);

  get canSubmit(): boolean {
    if (this.mode() === 'login') {
      return this.email.length > 0 && this.password.length > 0;
    }
    return this.username.length > 0 && this.email.length > 0 && this.password.length >= 6;
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
