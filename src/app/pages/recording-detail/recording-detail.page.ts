import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
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
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, pause, heart, heartOutline, playSkipBack, playSkipForward } from 'ionicons/icons';
import { RecordingsApiService } from '../../services/recordings-api.service';
import { UsersApiService } from '../../services/users-api.service';
import { PlayerService } from '../../services/player.service';
import { Recording } from '../../models';
import { WaveformComponent } from '../../components/waveform/waveform.component';
import { MovementBadgeComponent } from '../../components/movement-badge/movement-badge.component';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';

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
    IonSpinner,
    WaveformComponent,
    MovementBadgeComponent,
    TagChipComponent,
    UserAvatarComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/explore" text="Explore"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (isLoading()) {
        <div class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
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
          </div>
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
    `,
  ],
})
export class RecordingDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recordingsApi = inject(RecordingsApiService);
  private usersApi = inject(UsersApiService);
  player = inject(PlayerService);

  recording = signal<Recording | null>(null);
  isLoading = signal(false);
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
    addIcons({ play, pause, heart, heartOutline, playSkipBack, playSkipForward });
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
}
