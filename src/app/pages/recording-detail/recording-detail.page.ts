import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, pause, heart, heartOutline, playSkipBack, playSkipForward, shareSocial, close } from 'ionicons/icons';
import { RecordingsApiService } from '../../services/recordings-api.service';
import { UsersApiService } from '../../services/users-api.service';
import { PlayerService } from '../../services/player.service';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Recording } from '../../models';
import { WaveformComponent } from '../../components/waveform/waveform.component';
import { MovementBadgeComponent } from '../../components/movement-badge/movement-badge.component';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { MiniPlayerComponent } from '../../components/mini-player/mini-player.component';

@Component({
  selector: 'app-recording-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    WaveformComponent,
    MovementBadgeComponent,
    TagChipComponent,
    UserAvatarComponent,
    LoadingComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/explore" text="Explore"></ion-back-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <button class="share-btn" (click)="shareRecording()">
            <ion-icon name="share-social"></ion-icon>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (isLoading()) {
        <app-loading text="loading"></app-loading>
      } @else if (recording()) {
        <div class="container">
          <div class="user-section">
            <app-user-avatar
              [username]="recording()!.user.username"
              [size]="44"
            ></app-user-avatar>
            <div class="user-info">
              <span class="username" (click)="openUser()">
                {{ recording()!.user.username }}
              </span>
              <span class="time">{{ recording()!.timeAgo }}</span>
            </div>
            <button
              class="follow-btn"
              [class.following]="recording()!.user.isFollowing"
              (click)="toggleFollow()"
            >
              {{ recording()!.user.isFollowing ? 'FOLLOWING' : 'FOLLOW' }}
            </button>
          </div>

          <div class="badge-row">
            <app-movement-badge [movement]="recording()!.movement"></app-movement-badge>
          </div>

          <div class="waveform-section" (click)="onWaveformClick($event)">
            <app-waveform
              [data]="recording()!.waveformData"
              [progress]="playbackProgress()"
              [height]="80"
            ></app-waveform>
          </div>

          <div class="time-display">
            <span>{{ player.formatTime(player.currentTime()) }}</span>
            <div class="seek-bar">
              <input
                type="range"
                min="0"
                max="100"
                [value]="playbackProgress()"
                (input)="onSeek($event)"
              />
            </div>
            <span>{{ player.formatTime(player.duration()) }}</span>
          </div>

          <div class="controls">
            <button
              class="skip-btn"
              [class.disabled]="!player.hasPrevious()"
              (click)="onPrevious()"
            >
              <ion-icon name="play-skip-back"></ion-icon>
            </button>
            <button class="play-btn" (click)="togglePlayback()">
              <ion-icon [name]="isPlaying() ? 'pause' : 'play'"></ion-icon>
            </button>
            <button
              class="skip-btn"
              [class.disabled]="!player.hasNext()"
              (click)="onNext()"
            >
              <ion-icon name="play-skip-forward"></ion-icon>
            </button>
            <button
              class="like-btn"
              [class.liked]="recording()!.isLiked"
              (click)="toggleLike()"
            >
              <ion-icon [name]="recording()!.isLiked ? 'heart' : 'heart-outline'"></ion-icon>
            </button>
          </div>

          <div class="tags-section">
            <p class="section-label">INTERPRETATIONS</p>
            <div class="tags-list">
              @for (tag of recording()!.tags; track tag.id) {
                <app-tag-chip
                  [name]="tag.name"
                  [selected]="tag.isOriginal === true"
                  [addable]="tag.isOriginal !== true"
                  (chipClick)="openTag($event)"
                ></app-tag-chip>
              }
            </div>
          </div>

          <div class="add-tag-section">
            <p class="section-label">Add your interpretation</p>
            @if (auth.isAuthenticated()) {
              <div class="input-row">
                <input
                  type="text"
                  class="tag-input"
                  placeholder="What did you hear?"
                  [(ngModel)]="newTag"
                  (keyup.enter)="addTag()"
                />
                <button class="add-btn" (click)="addTag()" [disabled]="!newTag.trim()">
                  +
                </button>
              </div>
            } @else {
              <button class="login-to-add-btn" (click)="showLoginPrompt()">
                Sign in to add your interpretation
              </button>
            }
          </div>
        </div>
      }

      <!-- Login Prompt Modal -->
      @if (showLoginModal()) {
        <div class="modal-overlay" (click)="hideLoginPrompt()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="hideLoginPrompt()">
              <ion-icon name="close"></ion-icon>
            </button>
            <h2>Sign in to continue</h2>
            <p>Create an account or sign in to like recordings, follow users, and add your interpretations.</p>
            <button class="modal-btn primary" (click)="goToLogin()">SIGN IN</button>
            <button class="modal-btn secondary" (click)="hideLoginPrompt()">CONTINUE LISTENING</button>
          </div>
        </div>
      }

      <!-- Share Toast -->
      @if (showShareToast()) {
        <div class="share-toast">
          {{ shareToastMessage() }}
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      .container {
        padding: 20px;
        padding-bottom: 100px;
      }

      .user-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .username {
        font-weight: 500;
        cursor: pointer;
      }

      .time {
        font-size: 12px;
        color: var(--color-text-tertiary);
      }

      .follow-btn {
        padding: 8px 16px;
        background: transparent;
        border: 1px solid var(--color-text-primary);
        border-radius: 4px;
        color: var(--color-text-primary);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
      }

      .follow-btn.following {
        background: var(--color-surface-elevated);
        border-color: var(--color-border);
        color: var(--color-text-secondary);
      }

      .badge-row {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      }

      .waveform-section {
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--color-border);
        cursor: pointer;
      }

      .time-display {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        font-size: 12px;
        color: var(--color-text-secondary);
      }

      .seek-bar {
        flex: 1;
        position: relative;
        height: 4px;
        background: var(--color-border);
        border-radius: 2px;

        input[type="range"] {
          position: absolute;
          width: 100%;
          height: 20px;
          top: -8px;
          left: 0;
          opacity: 0;
          cursor: pointer;
          margin: 0;
        }

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--color-text-primary);
          border-radius: 2px;
          width: var(--progress, 0%);
          pointer-events: none;
        }
      }

      .controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
      }

      .skip-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        ion-icon {
          font-size: 22px;
        }

        &:hover:not(.disabled) {
          color: var(--color-text-primary);
        }

        &.disabled {
          opacity: 0.3;
          cursor: default;
        }
      }

      .play-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--color-text-primary);
        border: none;
        color: var(--color-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        ion-icon {
          font-size: 24px;
        }
      }

      .like-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        ion-icon {
          font-size: 22px;
        }
      }

      .like-btn.liked {
        color: var(--color-text-primary);
        border-color: var(--color-text-primary);
      }

      .section-label {
        font-size: 11px;
        color: var(--color-text-tertiary);
        letter-spacing: 1px;
        margin: 0 0 12px 0;
      }

      .tags-section {
        margin-bottom: 32px;
      }

      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .add-tag-section {
        margin-bottom: 24px;
      }

      .input-row {
        display: flex;
        gap: 12px;
      }

      .tag-input {
        flex: 1;
        padding: 14px 16px;
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        color: var(--color-text-primary);
        font-size: 14px;

        &::placeholder {
          color: var(--color-text-tertiary);
        }

        &:focus {
          outline: none;
          border-color: var(--color-border-light);
        }
      }

      .add-btn {
        width: 50px;
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        color: var(--color-text-primary);
        font-size: 20px;
        cursor: pointer;

        &:disabled {
          opacity: 0.3;
        }
      }

      .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50vh;
      }

      .share-btn {
        width: 40px;
        height: 40px;
        background: transparent;
        border: none;
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        ion-icon {
          font-size: 22px;
        }
      }

      .login-to-add-btn {
        width: 100%;
        padding: 14px 16px;
        background: var(--color-surface-elevated);
        border: 1px dashed var(--color-border);
        border-radius: 8px;
        color: var(--color-text-secondary);
        font-size: 14px;
        cursor: pointer;
        transition: all 150ms ease;

        &:hover {
          border-color: var(--color-text-secondary);
          color: var(--color-text-primary);
        }
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal-content {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 32px 24px;
        max-width: 320px;
        width: 100%;
        text-align: center;
        position: relative;
        animation: slideUp 0.2s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .modal-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        color: var(--color-text-tertiary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        ion-icon {
          font-size: 20px;
        }

        &:hover {
          color: var(--color-text-primary);
        }
      }

      .modal-content h2 {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 12px 0;
      }

      .modal-content p {
        font-size: 14px;
        color: var(--color-text-secondary);
        line-height: 1.5;
        margin: 0 0 24px 0;
      }

      .modal-btn {
        width: 100%;
        padding: 14px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .modal-btn.primary {
        background: var(--color-text-primary);
        border: none;
        color: var(--color-bg);
      }

      .modal-btn.secondary {
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text-secondary);
      }

      .share-toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 14px;
        color: var(--color-text-primary);
        z-index: 9998;
        animation: toastIn 0.3s ease;
      }

      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `,
  ],
})
export class RecordingDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recordingsApi = inject(RecordingsApiService);
  private usersApi = inject(UsersApiService);
  private analytics = inject(AnalyticsService);
  player = inject(PlayerService);
  auth = inject(AuthService);

  recording = signal<Recording | null>(null);
  isLoading = signal(false);
  showLoginModal = signal(false);
  showShareToast = signal(false);
  shareToastMessage = signal('');
  newTag = '';

  // Computed values from player service
  isPlaying = () => {
    const currentRec = this.player.currentRecording();
    const rec = this.recording();
    return currentRec?.id === rec?.id && this.player.isPlaying();
  };

  playbackProgress = () => {
    const currentRec = this.player.currentRecording();
    const rec = this.recording();
    if (currentRec?.id === rec?.id) {
      return this.player.progress();
    }
    return 0;
  };

  constructor() {
    addIcons({ play, pause, heart, heartOutline, playSkipBack, playSkipForward, shareSocial, close });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRecording(id);
    }
  }

  private loadRecording(id: string): void {
    this.isLoading.set(true);
    this.recordingsApi.getRecording(id).subscribe({
      next: (rec) => {
        this.recording.set(rec);
        this.isLoading.set(false);
        // Track page view
        this.analytics.trackView('recording', id);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  togglePlayback(): void {
    const rec = this.recording();
    if (!rec) return;

    const currentRec = this.player.currentRecording();
    if (currentRec?.id === rec.id) {
      // Toggle current recording
      this.player.togglePlayPause();
    } else {
      // Play this recording
      this.player.play(rec);
    }
  }

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const percent = parseFloat(input.value);
    this.player.seekToPercent(percent);
  }

  onWaveformClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width) * 100;

    const rec = this.recording();
    if (rec) {
      // If this recording isn't playing, start it first
      if (this.player.currentRecording()?.id !== rec.id) {
        this.player.play(rec);
      }
      this.player.seekToPercent(percent);
    }
  }

  onPrevious(): void {
    this.player.previous();
    // Navigate to the new recording if it changed
    const currentRec = this.player.currentRecording();
    if (currentRec && currentRec.id !== this.recording()?.id) {
      this.router.navigate(['/recording', currentRec.id]);
    }
  }

  onNext(): void {
    this.player.next();
    // Navigate to the new recording if it changed
    const currentRec = this.player.currentRecording();
    if (currentRec && currentRec.id !== this.recording()?.id) {
      this.router.navigate(['/recording', currentRec.id]);
    }
  }

  toggleLike(): void {
    if (!this.auth.isAuthenticated()) {
      this.showLoginPrompt();
      return;
    }

    const rec = this.recording();
    if (!rec) return;

    const action = rec.isLiked
      ? this.recordingsApi.unlikeRecording(rec.id)
      : this.recordingsApi.likeRecording(rec.id);

    action.subscribe({
      next: (result) => {
        this.recording.set({
          ...rec,
          isLiked: result.liked,
          likesCount: rec.likesCount + (result.liked ? 1 : -1)
        });
      }
    });
  }

  toggleFollow(): void {
    if (!this.auth.isAuthenticated()) {
      this.showLoginPrompt();
      return;
    }

    const rec = this.recording();
    if (!rec) return;

    const action = rec.user.isFollowing
      ? this.usersApi.unfollowUser(rec.user.id)
      : this.usersApi.followUser(rec.user.id);

    action.subscribe({
      next: (result) => {
        this.recording.set({
          ...rec,
          user: { ...rec.user, isFollowing: result.following }
        });
      }
    });
  }

  addTag(): void {
    const trimmed = this.newTag.trim().toLowerCase();
    if (!trimmed) return;

    const rec = this.recording();
    if (!rec) return;

    this.recordingsApi.addTag(rec.id, trimmed).subscribe({
      next: (tag) => {
        this.recording.set({
          ...rec,
          tags: [...rec.tags, { id: tag.id, name: tag.name, isOriginal: false }]
        });
        this.newTag = '';
      }
    });
  }

  openTag(tagName: string): void {
    this.router.navigate(['/tag', tagName]);
  }

  openUser(): void {
    const rec = this.recording();
    if (rec) {
      this.router.navigate(['/user', rec.user.id]);
    }
  }

  ngOnDestroy(): void {
    // Player service handles cleanup - playback continues when navigating away
  }

  async shareRecording(): Promise<void> {
    const rec = this.recording();
    if (!rec) return;

    const shareUrl = `${window.location.origin}/recording/${rec.id}`;
    const tags = rec.tags.slice(0, 3).map(t => `#${t.name}`).join(' ');
    const title = rec.title || `Sound by ${rec.user.username}`;
    const shareText = `${title}\n\n${tags}\n\nListen on 4'33" - an audio-only social platform for ambient sounds`;
    const clipboardText = `${title}\n${tags}\n\n${shareUrl}`;

    const shareData = {
      title: `4'33" - ${title}`,
      text: shareText,
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard with full text
        await navigator.clipboard.writeText(clipboardText);
        this.shareToastMessage.set('Link copied to clipboard');
        this.showShareToast.set(true);
        setTimeout(() => this.showShareToast.set(false), 3000);
      }
    } catch (err) {
      // User cancelled or error - try clipboard fallback
      if ((err as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(clipboardText);
          this.shareToastMessage.set('Link copied to clipboard');
          this.showShareToast.set(true);
          setTimeout(() => this.showShareToast.set(false), 3000);
        } catch {
          this.shareToastMessage.set('Could not share');
          this.showShareToast.set(true);
          setTimeout(() => this.showShareToast.set(false), 3000);
        }
      }
    }
  }

  showLoginPrompt(): void {
    this.showLoginModal.set(true);
  }

  hideLoginPrompt(): void {
    this.showLoginModal.set(false);
  }

  goToLogin(): void {
    this.hideLoginPrompt();
    this.router.navigate(['/auth']);
  }
}
