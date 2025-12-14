import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { AnalyticsApiService } from '../../services/analytics-api.service';
import { PlayerService } from '../../services/player.service';
import { RecordingsApiService } from '../../services/recordings-api.service';
import {
  Recording,
  PopularTag,
  PopularUser,
  OverviewStats,
  AnalyticsPeriod
} from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { MiniPlayerComponent } from '../../components/mini-player/mini-player.component';

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    RecordingCardComponent,
    TagChipComponent,
    LoadingComponent,
    MiniPlayerComponent,
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
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingText="Pull to refresh" refreshingSpinner="crescent"></ion-refresher-content>
      </ion-refresher>

      <div class="container">
        <h1 class="title">Trends</h1>

        <!-- Overview Stats -->
        @if (stats()) {
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">{{ formatNumber(stats()!.totalPlays) }}</span>
              <span class="stat-label">Total Plays</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ formatNumber(stats()!.playsThisWeek) }}</span>
              <span class="stat-label">This Week</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.totalRecordings }}</span>
              <span class="stat-label">Recordings</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats()!.totalUsers }}</span>
              <span class="stat-label">Users</span>
            </div>
          </div>
        }

        <!-- Period Selector -->
        <ion-segment [value]="selectedPeriod()" (ionChange)="onPeriodChange($event)">
          <ion-segment-button value="day">
            <ion-label>Today</ion-label>
          </ion-segment-button>
          <ion-segment-button value="week">
            <ion-label>Week</ion-label>
          </ion-segment-button>
          <ion-segment-button value="month">
            <ion-label>Month</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Popular Recordings -->
        <section class="section">
          <h2 class="section-title">Popular Recordings</h2>
          @if (isLoadingRecordings()) {
            <app-loading text="loading"></app-loading>
          } @else if (popularRecordings().length === 0) {
            <p class="empty-text">No plays yet</p>
          } @else {
            <div class="recordings-list">
              @for (recording of popularRecordings(); track recording.id; let i = $index) {
                <div class="ranked-item">
                  <span class="rank">{{ i + 1 }}</span>
                  <app-recording-card
                    [recording]="recording"
                    (cardClick)="openRecording($event)"
                    (userClick)="openUser($event)"
                    (tagClick)="openTag($event.name)"
                    (onLike)="toggleLike($event)"
                    (onPlay)="playRecording($event)"
                  ></app-recording-card>
                </div>
              }
            </div>
          }
        </section>

        <!-- Trending Tags -->
        <section class="section">
          <h2 class="section-title">Trending Tags</h2>
          @if (isLoadingTags()) {
            <app-loading text="loading"></app-loading>
          } @else if (popularTags().length === 0) {
            <p class="empty-text">No tags yet</p>
          } @else {
            <div class="tags-list">
              @for (tag of popularTags(); track tag.id; let i = $index) {
                <div class="tag-item" (click)="openTag(tag.name)">
                  <span class="rank">{{ i + 1 }}</span>
                  <div class="tag-info">
                    <app-tag-chip [name]="tag.name"></app-tag-chip>
                    <span class="tag-stats">{{ formatNumber(tag.playCount) }} plays · {{ tag.recordingCount }} recordings</span>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- Top Creators -->
        <section class="section">
          <h2 class="section-title">Top Creators</h2>
          @if (isLoadingUsers()) {
            <app-loading text="loading"></app-loading>
          } @else if (popularUsers().length === 0) {
            <p class="empty-text">No creators yet</p>
          } @else {
            <div class="users-list">
              @for (user of popularUsers(); track user.id; let i = $index) {
                <div class="user-item" (click)="openUser(user)">
                  <span class="rank">{{ i + 1 }}</span>
                  <div class="user-info">
                    <span class="username">{{ user.username }}</span>
                    <span class="user-stats">{{ formatNumber(user.totalPlays) }} plays · {{ user.recordingsCount }} recordings · {{ user.followersCount }} followers</span>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      </div>
    </ion-content>

    <div class="mini-player-wrapper">
      <app-mini-player></app-mini-player>
    </div>
  `,
  styles: [`
    .container {
      padding: 40px 20px 100px;
    }

    .title {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 24px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--color-surface, #0a0a0a);
      border: 1px solid var(--color-border, #222);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary, #fff);
    }

    .stat-label {
      font-size: 12px;
      color: var(--color-text-secondary, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    ion-segment {
      --background: var(--color-surface, #0a0a0a);
      margin-bottom: 24px;
    }

    ion-segment-button {
      --color: var(--color-text-secondary, #888);
      --color-checked: var(--color-text-primary, #fff);
      --indicator-color: var(--color-surface-elevated, #1a1a1a);
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: var(--color-text-primary, #fff);
    }

    .recordings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ranked-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .ranked-item app-recording-card {
      flex: 1;
    }

    .rank {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-secondary, #888);
      width: 24px;
      text-align: center;
      padding-top: 16px;
    }

    .tags-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tag-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--color-surface, #0a0a0a);
      border: 1px solid var(--color-border, #222);
      border-radius: 12px;
      cursor: pointer;
      transition: border-color 150ms ease;
    }

    .tag-item:hover {
      border-color: var(--color-border-light, #333);
    }

    .tag-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tag-stats {
      font-size: 12px;
      color: var(--color-text-secondary, #888);
    }

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--color-surface, #0a0a0a);
      border: 1px solid var(--color-border, #222);
      border-radius: 12px;
      cursor: pointer;
      transition: border-color 150ms ease;
    }

    .user-item:hover {
      border-color: var(--color-border-light, #333);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .username {
      font-weight: 500;
      color: var(--color-text-primary, #fff);
    }

    .user-stats {
      font-size: 12px;
      color: var(--color-text-secondary, #888);
    }

    .empty-text {
      color: var(--color-text-secondary, #888);
      text-align: center;
      padding: 20px;
    }

    .mini-player-wrapper ::ng-deep .mini-player {
      bottom: 0 !important;
    }
  `]
})
export class TrendsPage implements OnInit {
  private router = inject(Router);
  private analyticsApi = inject(AnalyticsApiService);
  private recordingsApi = inject(RecordingsApiService);
  private player = inject(PlayerService);

  selectedPeriod = signal<AnalyticsPeriod>('week');
  stats = signal<OverviewStats | null>(null);
  popularRecordings = signal<Recording[]>([]);
  popularTags = signal<PopularTag[]>([]);
  popularUsers = signal<PopularUser[]>([]);

  isLoadingRecordings = signal(false);
  isLoadingTags = signal(false);
  isLoadingUsers = signal(false);

  ngOnInit(): void {
    this.loadStats();
    this.loadAllData();
  }

  onPeriodChange(event: any): void {
    this.selectedPeriod.set(event.detail.value);
    this.loadAllData();
  }

  handleRefresh(event: any): void {
    this.loadStats();
    this.loadAllData();
    setTimeout(() => event.target.complete(), 1000);
  }

  private loadStats(): void {
    this.analyticsApi.getOverviewStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {}
    });
  }

  private loadAllData(): void {
    const period = this.selectedPeriod();

    this.isLoadingRecordings.set(true);
    this.analyticsApi.getPopularRecordings(period, 10).subscribe({
      next: (recordings) => {
        this.popularRecordings.set(recordings);
        this.isLoadingRecordings.set(false);
      },
      error: () => {
        this.popularRecordings.set([]);
        this.isLoadingRecordings.set(false);
      }
    });

    this.isLoadingTags.set(true);
    this.analyticsApi.getPopularTags(period, 10).subscribe({
      next: (tags) => {
        this.popularTags.set(tags);
        this.isLoadingTags.set(false);
      },
      error: () => {
        this.popularTags.set([]);
        this.isLoadingTags.set(false);
      }
    });

    this.isLoadingUsers.set(true);
    this.analyticsApi.getPopularUsers(period, 10).subscribe({
      next: (users) => {
        this.popularUsers.set(users);
        this.isLoadingUsers.set(false);
      },
      error: () => {
        this.popularUsers.set([]);
        this.isLoadingUsers.set(false);
      }
    });
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  openUser(user: any): void {
    this.router.navigate(['/user', user.id]);
  }

  openTag(tagName: string): void {
    this.router.navigate(['/tag', tagName]);
  }

  playRecording(recording: Recording): void {
    this.player.play(recording, this.popularRecordings(), 'trends');
  }

  toggleLike(recording: Recording): void {
    const action = recording.isLiked
      ? this.recordingsApi.unlikeRecording(recording.id)
      : this.recordingsApi.likeRecording(recording.id);

    action.subscribe({
      next: (result) => {
        this.popularRecordings.update(recordings =>
          recordings.map(r =>
            r.id === recording.id
              ? { ...r, isLiked: result.liked, likesCount: r.likesCount + (result.liked ? 1 : -1) }
              : r
          )
        );
      }
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }
}
