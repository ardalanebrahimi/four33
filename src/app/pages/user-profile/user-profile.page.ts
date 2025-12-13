import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { UsersApiService } from '../../services/users-api.service';
import { RecordingsApiService } from '../../services/recordings-api.service';
import { PlayerService } from '../../services/player.service';
import { Recording, User } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    RecordingCardComponent,
    UserAvatarComponent,
    LoadingComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/explore" text="Back"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (isLoading()) {
        <app-loading text="loading"></app-loading>
      } @else if (user()) {
        <div class="container">
          <div class="profile-header">
            <app-user-avatar [username]="user()!.username" [size]="80"></app-user-avatar>
            <h1 class="username">{{ user()!.username }}</h1>
            <div class="stats">
              <div class="stat">
                <span class="stat-value">{{ user()!.recordingsCount }}</span>
                <span class="stat-label">sounds</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ user()!.followersCount }}</span>
                <span class="stat-label">followers</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ user()!.followingCount }}</span>
                <span class="stat-label">following</span>
              </div>
            </div>
          </div>

          <button
            class="follow-btn"
            [class.following]="user()!.isFollowing"
            (click)="toggleFollow()"
          >
            {{ user()!.isFollowing ? 'FOLLOWING' : 'FOLLOW' }}
          </button>

          <div class="recordings-section">
            <p class="section-label">SOUNDS</p>
            @if (recordings().length > 0) {
              <div class="recordings-list">
                @for (recording of recordings(); track recording.id) {
                  <app-recording-card
                    [recording]="recording"
                    (cardClick)="openRecording($event)"
                    (onLike)="toggleLike($event)"
                    (onPlay)="playRecording($event)"
                  ></app-recording-card>
                }
              </div>
            } @else {
              <div class="empty-state">
                <p>No sounds yet</p>
              </div>
            }
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

      .profile-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
      }

      .username {
        font-size: 24px;
        font-weight: 500;
        margin: 16px 0 12px 0;
      }

      .stats {
        display: flex;
        gap: 32px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 500;
      }

      .stat-label {
        font-size: 12px;
        color: var(--color-text-tertiary);
      }

      .follow-btn {
        display: block;
        width: 100%;
        padding: 14px;
        background: var(--color-text-primary);
        border: none;
        border-radius: 8px;
        color: var(--color-bg);
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
        margin-bottom: 24px;
      }

      .follow-btn.following {
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        color: var(--color-text-secondary);
      }

      .section-label {
        font-size: 11px;
        color: var(--color-text-tertiary);
        letter-spacing: 1px;
        margin: 0 0 16px 0;
      }

      .recordings-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--color-text-tertiary);
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
export class UserProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersApi = inject(UsersApiService);
  private recordingsApi = inject(RecordingsApiService);
  private player = inject(PlayerService);

  user = signal<User | null>(null);
  recordings = signal<Recording[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    }
  }

  private loadUser(id: string): void {
    this.isLoading.set(true);
    this.usersApi.getUser(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loadRecordings(id);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private loadRecordings(userId: string): void {
    this.recordingsApi.getRecordings({ userId }).subscribe({
      next: (result) => {
        this.recordings.set(result.items);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  toggleFollow(): void {
    const u = this.user();
    if (!u) return;

    const action = u.isFollowing
      ? this.usersApi.unfollowUser(u.id)
      : this.usersApi.followUser(u.id);

    action.subscribe({
      next: (result) => {
        this.user.set({
          ...u,
          isFollowing: result.following,
          followersCount: u.followersCount + (result.following ? 1 : -1),
        });
      }
    });
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  playRecording(recording: Recording): void {
    this.player.play(recording, this.recordings());
  }

  toggleLike(recording: Recording): void {
    const action = recording.isLiked
      ? this.recordingsApi.unlikeRecording(recording.id)
      : this.recordingsApi.likeRecording(recording.id);

    action.subscribe({
      next: (result) => {
        this.recordings.update(recs =>
          recs.map(r =>
            r.id === recording.id
              ? { ...r, isLiked: result.liked, likesCount: r.likesCount + (result.liked ? 1 : -1) }
              : r
          )
        );
      }
    });
  }
}
