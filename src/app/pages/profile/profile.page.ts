import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heart, personAdd } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { UsersApiService } from '../../services/users-api.service';
import { RecordingsApiService } from '../../services/recordings-api.service';
import { TagsApiService } from '../../services/tags-api.service';
import { PlayerService } from '../../services/player.service';
import { Recording, User, Tag, Activity } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { LoadingComponent } from '../../components/loading/loading.component';

type ProfileTab = 'sounds' | 'following' | 'followers' | 'activity';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    RecordingCardComponent,
    UserAvatarComponent,
    TagChipComponent,
    LoadingComponent,
  ],
  template: `
    <ion-content [fullscreen]="true">
      @if (!auth.isAuthenticated()) {
        <div class="login-prompt">
          <h2>Sign in to view your profile</h2>
          <button class="login-btn" (click)="goToLogin()">SIGN IN</button>
        </div>
      } @else if (isLoading()) {
        <app-loading text="loading"></app-loading>
      } @else {
        <div class="container">
          <div class="profile-header">
            <app-user-avatar [username]="currentUser()?.username || ''" [size]="80"></app-user-avatar>
            <h1 class="username">{{ currentUser()?.username }}</h1>
            <div class="stats">
              <div class="stat">
                <span class="stat-value">{{ currentUser()?.recordingsCount || 0 }}</span>
                <span class="stat-label">sounds</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ currentUser()?.followersCount || 0 }}</span>
                <span class="stat-label">followers</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ currentUser()?.followingCount || 0 }}</span>
                <span class="stat-label">following</span>
              </div>
            </div>
          </div>

          <div class="tabs">
            <button
              class="tab"
              [class.active]="activeTab() === 'sounds'"
              (click)="selectTab('sounds')"
            >
              SOUNDS
            </button>
            <button
              class="tab"
              [class.active]="activeTab() === 'following'"
              (click)="selectTab('following')"
            >
              FOLLOWING
            </button>
            <button
              class="tab"
              [class.active]="activeTab() === 'followers'"
              (click)="selectTab('followers')"
            >
              FOLLOWERS
            </button>
            <button
              class="tab"
              [class.active]="activeTab() === 'activity'"
              (click)="selectTab('activity')"
            >
              ACTIVITY
            </button>
          </div>

          <div class="tab-content">
            @switch (activeTab()) {
              @case ('sounds') {
                @if (userRecordings().length > 0) {
                  <div class="recordings-list">
                    @for (recording of userRecordings(); track recording.id) {
                      <app-recording-card
                        [recording]="recording"
                        (cardClick)="openRecording($event)"
                        (onPlay)="playRecording($event)"
                      ></app-recording-card>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <p>Record your first sound</p>
                  </div>
                }
              }

              @case ('following') {
                @if (followedTags().length > 0) {
                  <div class="section">
                    <p class="section-label">TAGS</p>
                    <div class="tags-list">
                      @for (tag of followedTags(); track tag.id) {
                        <app-tag-chip
                          [name]="tag.name"
                          [selected]="true"
                          (chipClick)="openTag($event)"
                        ></app-tag-chip>
                      }
                    </div>
                  </div>
                }

                @if (following().length > 0) {
                  <div class="section">
                    <p class="section-label">PEOPLE</p>
                    <div class="users-list">
                      @for (user of following(); track user.id) {
                        <div class="user-row" (click)="openUser(user)">
                          <app-user-avatar [username]="user.username" [size]="40"></app-user-avatar>
                          <span class="user-name">{{ user.username }}</span>
                          <button
                            class="follow-btn following"
                            (click)="toggleFollowUser(user, $event)"
                          >
                            FOLLOWING
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }

                @if (followedTags().length === 0 && following().length === 0) {
                  <div class="empty-state">
                    <p>Not following anyone yet</p>
                  </div>
                }
              }

              @case ('followers') {
                @if (followers().length > 0) {
                  <div class="users-list">
                    @for (user of followers(); track user.id) {
                      <div class="user-row" (click)="openUser(user)">
                        <app-user-avatar [username]="user.username" [size]="40"></app-user-avatar>
                        <span class="user-name">{{ user.username }}</span>
                        <button
                          class="follow-btn"
                          [class.following]="user.isFollowing"
                          (click)="toggleFollowUser(user, $event)"
                        >
                          {{ user.isFollowing ? 'FOLLOWING' : 'FOLLOW' }}
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <p>No followers yet</p>
                  </div>
                }
              }

              @case ('activity') {
                @if (activities().length > 0) {
                  <div class="activity-list">
                    @for (activity of activities(); track activity.id) {
                      <div class="activity-item">
                        <div class="activity-icon">
                          @if (activity.type === 'like') {
                            <ion-icon name="heart"></ion-icon>
                          } @else {
                            <ion-icon name="person-add"></ion-icon>
                          }
                        </div>
                        <div class="activity-content">
                          <p class="activity-text">
                            <strong (click)="openUser(activity.user)">{{ activity.user.username }}</strong>
                            @if (activity.type === 'like') {
                              liked your recording
                            } @else {
                              started following you
                            }
                          </p>
                          <span class="activity-time">{{ activity.timeAgo }}</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <p>No activity yet</p>
                  </div>
                }
              }
            }
          </div>

          <button class="logout-btn" (click)="logout()">SIGN OUT</button>
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      .container {
        padding: 40px 20px 100px;
      }

      .profile-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 24px;
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

      .tabs {
        display: flex;
        border-bottom: 1px solid var(--color-border);
        margin-bottom: 20px;
        overflow-x: auto;
      }

      .tab {
        flex: 1;
        padding: 12px 8px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--color-text-tertiary);
        font-size: 11px;
        letter-spacing: 1px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
      }

      .tab.active {
        color: var(--color-text-primary);
        border-bottom-color: var(--color-text-primary);
      }

      .tab-content {
        min-height: 200px;
      }

      .section {
        margin-bottom: 24px;
      }

      .section-label {
        font-size: 11px;
        color: var(--color-text-tertiary);
        letter-spacing: 1px;
        margin: 0 0 12px 0;
      }

      .recordings-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .users-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .user-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        cursor: pointer;
      }

      .user-name {
        flex: 1;
        font-weight: 500;
      }

      .follow-btn {
        padding: 8px 16px;
        background: transparent;
        border: 1px solid var(--color-text-primary);
        border-radius: 4px;
        color: var(--color-text-primary);
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
      }

      .follow-btn.following {
        background: var(--color-surface-elevated);
        border-color: var(--color-border);
        color: var(--color-text-secondary);
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .activity-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--color-surface-elevated);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        ion-icon {
          font-size: 18px;
          color: var(--color-text-secondary);
        }
      }

      .activity-content {
        flex: 1;
      }

      .activity-text {
        margin: 0 0 4px 0;
        line-height: 1.4;

        strong {
          cursor: pointer;
        }
      }

      .activity-time {
        font-size: 12px;
        color: var(--color-text-tertiary);
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--color-text-tertiary);
      }

      .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50vh;
      }

      .login-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 50vh;
        gap: 24px;
        padding: 20px;
        text-align: center;

        h2 {
          font-size: 18px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin: 0;
        }
      }

      .login-btn {
        padding: 14px 32px;
        background: var(--color-text-primary);
        border: none;
        border-radius: 8px;
        color: var(--color-bg);
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
      }

      .logout-btn {
        display: block;
        width: 100%;
        padding: 14px;
        background: transparent;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        color: var(--color-text-secondary);
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
        margin-top: 32px;
      }
    `,
  ],
})
export class ProfilePage implements OnInit {
  private router = inject(Router);
  auth = inject(AuthService);
  private usersApi = inject(UsersApiService);
  private recordingsApi = inject(RecordingsApiService);
  private tagsApi = inject(TagsApiService);
  private player = inject(PlayerService);

  activeTab = signal<ProfileTab>('sounds');
  isLoading = signal(false);

  currentUser = signal<User | null>(null);
  userRecordings = signal<Recording[]>([]);
  followers = signal<User[]>([]);
  following = signal<User[]>([]);
  followedTags = signal<Tag[]>([]);
  activities = signal<Activity[]>([]);

  constructor() {
    addIcons({ heart, personAdd });
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.loadProfile();
    }
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.usersApi.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loadTabData('sounds');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  selectTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    this.loadTabData(tab);
  }

  private loadTabData(tab: ProfileTab): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    switch (tab) {
      case 'sounds':
        this.recordingsApi.getRecordings({ userId }).subscribe({
          next: (result) => this.userRecordings.set(result.items)
        });
        break;
      case 'followers':
        this.usersApi.getFollowers(userId).subscribe({
          next: (result) => this.followers.set(result.items)
        });
        break;
      case 'following':
        this.usersApi.getFollowing(userId).subscribe({
          next: (result) => this.following.set(result.items)
        });
        this.tagsApi.getFollowedTags().subscribe({
          next: (tags) => this.followedTags.set(tags)
        });
        break;
      case 'activity':
        this.usersApi.getActivity().subscribe({
          next: (activities) => this.activities.set(activities)
        });
        break;
    }
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  playRecording(recording: Recording): void {
    this.player.play(recording, this.userRecordings());
  }

  openUser(user: User): void {
    this.router.navigate(['/user', user.id]);
  }

  openTag(tagName: string): void {
    this.router.navigate(['/tag', tagName]);
  }

  toggleFollowUser(user: User, event: Event): void {
    event.stopPropagation();

    const action = user.isFollowing
      ? this.usersApi.unfollowUser(user.id)
      : this.usersApi.followUser(user.id);

    action.subscribe({
      next: (result) => {
        // Update in followers list
        this.followers.update(users =>
          users.map(u =>
            u.id === user.id ? { ...u, isFollowing: result.following } : u
          )
        );
        // Update in following list
        if (!result.following) {
          this.following.update(users => users.filter(u => u.id !== user.id));
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
