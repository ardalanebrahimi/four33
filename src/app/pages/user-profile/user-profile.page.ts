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
import { MockDataService } from '../../services/mock-data.service';
import { Recording, User } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';

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
      @if (user()) {
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
    `,
  ],
})
export class UserProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockData = inject(MockDataService);

  user = signal<User | null>(null);
  recordings = signal<Recording[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const foundUser = this.mockData.getUser(id);
      if (foundUser) {
        this.user.set(foundUser);
        this.recordings.set(this.mockData.getRecordings({ userId: id }));
      }
    }
  }

  toggleFollow(): void {
    const u = this.user();
    if (u) {
      this.mockData.toggleFollowUser(u.id);
      this.user.set({
        ...u,
        isFollowing: !u.isFollowing,
        followersCount: u.followersCount + (u.isFollowing ? -1 : 1),
      });
    }
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  toggleLike(recording: Recording): void {
    this.mockData.toggleLike(recording.id);
    const userId = this.user()?.id;
    if (userId) {
      this.recordings.set(this.mockData.getRecordings({ userId }));
    }
  }
}
