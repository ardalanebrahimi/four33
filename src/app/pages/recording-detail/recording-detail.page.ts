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
import { play, pause, heart, heartOutline } from 'ionicons/icons';
import { MockDataService } from '../../services/mock-data.service';
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
      @if (recording()) {
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

          <div class="waveform-section">
            <app-waveform
              [data]="recording()!.waveformData"
              [progress]="playbackProgress()"
              [height]="80"
            ></app-waveform>
          </div>

          <div class="controls">
            <button class="play-btn" (click)="togglePlayback()">
              <ion-icon [name]="isPlaying() ? 'pause' : 'play'"></ion-icon>
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
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--color-border);
      }

      .controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
        margin-bottom: 32px;
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
    `,
  ],
})
export class RecordingDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockData = inject(MockDataService);

  recording = signal<Recording | null>(null);
  isPlaying = signal(false);
  playbackProgress = signal(0);
  newTag = '';

  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    addIcons({ play, pause, heart, heartOutline });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const rec = this.mockData.getRecording(id);
      if (rec) {
        this.recording.set(rec);
      }
    }
  }

  togglePlayback(): void {
    // For demo, we don't have actual audio, so just toggle state
    this.isPlaying.update((v) => !v);

    if (this.isPlaying()) {
      // Simulate playback progress
      const interval = setInterval(() => {
        this.playbackProgress.update((p) => {
          if (p >= 100) {
            clearInterval(interval);
            this.isPlaying.set(false);
            return 0;
          }
          return p + 2;
        });
      }, 100);
    }
  }

  toggleLike(): void {
    const rec = this.recording();
    if (rec) {
      this.mockData.toggleLike(rec.id);
      this.recording.set({ ...rec, isLiked: !rec.isLiked, likesCount: rec.likesCount + (rec.isLiked ? -1 : 1) });
    }
  }

  toggleFollow(): void {
    const rec = this.recording();
    if (rec) {
      this.mockData.toggleFollowUser(rec.user.id);
      this.recording.set({
        ...rec,
        user: { ...rec.user, isFollowing: !rec.user.isFollowing },
      });
    }
  }

  addTag(): void {
    const trimmed = this.newTag.trim().toLowerCase();
    if (!trimmed) return;

    const rec = this.recording();
    if (rec) {
      const newTagObj = { id: String(Date.now()), name: trimmed, isOriginal: false };
      this.recording.set({
        ...rec,
        tags: [...rec.tags, newTagObj],
      });
      this.newTag = '';
    }
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
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }
}
