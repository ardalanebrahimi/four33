import { Component, inject, signal, OnInit, NgZone, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { InviteService } from '../../services/invite.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

declare const google: any;

type AuthMode = 'login' | 'request-access' | 'register-invite';

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
          <!-- Mode Tabs -->
          <div class="tabs">
            <button
              class="tab"
              [class.active]="mode() === 'login'"
              (click)="setMode('login')"
            >
              Sign In
            </button>
            <button
              class="tab"
              [class.active]="mode() === 'request-access'"
              (click)="setMode('request-access')"
            >
              Request Access
            </button>
          </div>

          <!-- Login Mode -->
          @if (mode() === 'login') {
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
              (keyup.enter)="submitLogin()"
            />

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            <button
              class="submit-button"
              [disabled]="!canLogin || auth.isLoading()"
              (click)="submitLogin()"
            >
              @if (auth.isLoading()) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                SIGN IN
              }
            </button>

            <div class="divider">
              <span>or</span>
            </div>

            <!-- Google Sign-In Button Container -->
            <div #googleButtonContainer class="google-button-container"></div>

            @if (showFallbackGoogleButton()) {
              <button
                class="google-button-fallback"
                [disabled]="auth.isLoading()"
                (click)="signInWithGoogleFallback()"
              >
                <svg class="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            }

            <p class="invite-link">
              Have an invite code?
              <button class="link-button" (click)="setMode('register-invite')">Register here</button>
            </p>
          }

          <!-- Request Access Mode -->
          @if (mode() === 'request-access') {
            @if (requestSubmitted()) {
              <div class="success-message">
                <div class="success-icon">&#10003;</div>
                <h3>Request Submitted!</h3>
                <p>We'll review your request and get back to you soon.</p>
                <p class="email-note">Check {{ requestEmail() }} for updates.</p>
                <button class="submit-button" (click)="checkStatus()">
                  Check Status
                </button>
              </div>
            } @else {
              <input
                type="text"
                class="input"
                placeholder="Username"
                [(ngModel)]="username"
                [maxlength]="50"
              />

              <input
                type="email"
                class="input"
                placeholder="Email"
                [(ngModel)]="email"
              />

              <input
                type="password"
                class="input"
                placeholder="Password (min 6 characters)"
                [(ngModel)]="password"
              />

              <textarea
                class="input textarea"
                placeholder="Why do you want to join 4'33&quot;? Tell us about your interest in ambient sound, music, or art..."
                [(ngModel)]="reason"
                [maxlength]="1000"
              ></textarea>
              <p class="char-count">{{ reason.length }}/1000</p>

              @if (error()) {
                <p class="error">{{ error() }}</p>
              }

              <button
                class="submit-button"
                [disabled]="!canRequestAccess || isSubmitting()"
                (click)="submitRequestAccess()"
              >
                @if (isSubmitting()) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  REQUEST ACCESS
                }
              </button>
            }
          }

          <!-- Register with Invite Mode -->
          @if (mode() === 'register-invite') {
            <input
              type="text"
              class="input"
              placeholder="Invite Code"
              [(ngModel)]="inviteCode"
              [maxlength]="20"
              style="text-transform: uppercase; letter-spacing: 2px;"
            />

            <input
              type="text"
              class="input"
              placeholder="Username"
              [(ngModel)]="username"
              [maxlength]="50"
            />

            <input
              type="email"
              class="input"
              placeholder="Email"
              [(ngModel)]="email"
            />

            <input
              type="password"
              class="input"
              placeholder="Password (min 6 characters)"
              [(ngModel)]="password"
              (keyup.enter)="submitRegisterWithInvite()"
            />

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            <button
              class="submit-button"
              [disabled]="!canRegisterWithInvite || isSubmitting()"
              (click)="submitRegisterWithInvite()"
            >
              @if (isSubmitting()) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                CREATE ACCOUNT
              }
            </button>

            <p class="invite-link">
              Don't have a code?
              <button class="link-button" (click)="setMode('request-access')">Request access</button>
            </p>
          }
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

    .textarea {
      height: 120px;
      resize: none;
      font-family: inherit;
    }

    .char-count {
      font-size: 12px;
      color: var(--color-text-tertiary);
      text-align: right;
      margin: -8px 0 12px;
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

    .google-button-container {
      width: 100%;
      display: flex;
      justify-content: center;
      min-height: 44px;
    }

    .google-button-fallback {
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

    .invite-link {
      text-align: center;
      margin-top: 20px;
      color: var(--color-text-tertiary);
      font-size: 14px;
    }

    .link-button {
      background: none;
      border: none;
      color: var(--color-text-primary);
      text-decoration: underline;
      cursor: pointer;
      font-size: 14px;
      padding: 0;
    }

    .success-message {
      text-align: center;
      padding: 24px 0;

      .success-icon {
        width: 64px;
        height: 64px;
        background: #40c057;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 32px;
        color: white;
      }

      h3 {
        margin: 0 0 12px;
        font-size: 20px;
      }

      p {
        color: var(--color-text-secondary);
        margin: 0 0 8px;
      }

      .email-note {
        font-size: 13px;
        color: var(--color-text-tertiary);
        margin-bottom: 24px;
      }
    }
  `]
})
export class AuthPage implements OnInit, AfterViewInit {
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private inviteService = inject(InviteService);
  auth = inject(AuthService);

  @ViewChild('googleButtonContainer') googleButtonContainer!: ElementRef;

  mode = signal<AuthMode>('login');
  username = '';
  email = '';
  password = '';
  reason = '';
  inviteCode = '';
  error = signal<string | null>(null);
  showFallbackGoogleButton = signal(false);
  isSubmitting = signal(false);
  requestSubmitted = signal(false);
  requestEmail = signal('');

  private googleClientId = environment.googleClientId;
  private googleInitialized = false;
  private googleLoadTimeout: any;

  get canLogin(): boolean {
    return this.email.length > 0 && this.password.length > 0;
  }

  get canRequestAccess(): boolean {
    return (
      this.username.length > 0 &&
      this.email.length > 0 &&
      this.password.length >= 6 &&
      this.reason.length >= 20
    );
  }

  get canRegisterWithInvite(): boolean {
    return (
      this.inviteCode.length > 0 &&
      this.username.length > 0 &&
      this.email.length > 0 &&
      this.password.length >= 6
    );
  }

  ngOnInit(): void {
    this.initializeGoogleSignIn();
  }

  ngAfterViewInit(): void {
    if (this.googleInitialized) {
      this.renderGoogleButton();
    }
  }

  setMode(newMode: AuthMode): void {
    this.mode.set(newMode);
    this.error.set(null);
    this.requestSubmitted.set(false);
  }

  private initializeGoogleSignIn(): void {
    this.googleLoadTimeout = setTimeout(() => {
      if (!this.googleInitialized) {
        console.warn('Google Sign-In library did not load, showing fallback button');
        this.showFallbackGoogleButton.set(true);
      }
    }, 3000);

    if (typeof google === 'undefined') {
      const checkGoogle = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(checkGoogle);
          clearTimeout(this.googleLoadTimeout);
          this.setupGoogleSignIn();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogle);
      }, 5000);
      return;
    }
    clearTimeout(this.googleLoadTimeout);
    this.setupGoogleSignIn();
  }

  private setupGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: any) => this.handleGoogleCallback(response),
      ux_mode: 'popup',
    });
    this.googleInitialized = true;

    if (this.googleButtonContainer) {
      this.renderGoogleButton();
    }
  }

  private renderGoogleButton(): void {
    if (!this.googleButtonContainer?.nativeElement) {
      this.showFallbackGoogleButton.set(true);
      return;
    }

    try {
      google.accounts.id.renderButton(
        this.googleButtonContainer.nativeElement,
        {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 280,
        }
      );
      this.showFallbackGoogleButton.set(false);
    } catch (err) {
      console.error('Failed to render Google button:', err);
      this.showFallbackGoogleButton.set(true);
    }
  }

  private handleGoogleCallback(response: any): void {
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

  async submitLogin(): Promise<void> {
    if (!this.canLogin || this.auth.isLoading()) return;

    this.error.set(null);

    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/record']);
    } catch (err: any) {
      const message = err?.error?.error || err?.message || 'Something went wrong';
      this.error.set(message);
    }
  }

  async submitRequestAccess(): Promise<void> {
    if (!this.canRequestAccess || this.isSubmitting()) return;

    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      await firstValueFrom(
        this.inviteService.submitJoinRequest({
          email: this.email,
          username: this.username,
          password: this.password,
          reason: this.reason,
        })
      );
      this.requestEmail.set(this.email);
      this.requestSubmitted.set(true);
    } catch (err: any) {
      const message = err?.error?.error || err?.message || 'Failed to submit request';
      this.error.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitRegisterWithInvite(): Promise<void> {
    if (!this.canRegisterWithInvite || this.isSubmitting()) return;

    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      const response = await firstValueFrom(
        this.inviteService.registerWithInvite({
          inviteCode: this.inviteCode.toUpperCase(),
          username: this.username,
          email: this.email,
          password: this.password,
        })
      );

      // Save auth data
      localStorage.setItem('four33_access_token', response.accessToken);
      localStorage.setItem('four33_refresh_token', response.refreshToken);
      localStorage.setItem('four33_user', JSON.stringify(response.user));

      // Force reload to pick up new auth state
      window.location.href = '/record';
    } catch (err: any) {
      const message = err?.error?.error || err?.message || 'Failed to register';
      this.error.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async checkStatus(): Promise<void> {
    try {
      const status = await firstValueFrom(
        this.inviteService.checkRequestStatus(this.requestEmail())
      );

      if (status.status === 'Approved' && status.inviteCode) {
        this.inviteCode = status.inviteCode;
        this.setMode('register-invite');
      } else if (status.status === 'Rejected') {
        this.error.set('Your request was not approved. You can submit a new request.');
        this.requestSubmitted.set(false);
      } else {
        this.error.set('Your request is still pending review.');
      }
    } catch (err: any) {
      const message = err?.error?.error || err?.message || 'Failed to check status';
      this.error.set(message);
    }
  }

  signInWithGoogleFallback(): void {
    if (typeof google !== 'undefined' && this.googleInitialized) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn('Google prompt not displayed:', notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
          this.error.set('Google Sign-In is not available. Please try email login.');
        }
      });
    } else {
      this.error.set('Google Sign-In is not available on this device. Please use email login.');
    }
  }
}
