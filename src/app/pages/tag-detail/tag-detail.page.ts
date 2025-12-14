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
import { TagsApiService } from '../../services/tags-api.service';
import { RecordingsApiService } from '../../services/recordings-api.service';
import { PlayerService } from '../../services/player.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Recording, Tag } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { MiniPlayerComponent } from '../../components/mini-player/mini-player.component';

@Component({
  selector: 'app-tag-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    RecordingCardComponent,
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
      @if (isLoading()) {
        <app-loading text="loading"></app-loading>
      } @else if (tag()) {
        <div class="container">
          <div class="header">
            <h1 class="tag-name">#{{ tag()!.name }}</h1>
            <p class="recording-count">{{ tag()!.recordingCount || 0 }} recordings</p>
          </div>

          <button
            class="follow-btn"
            [class.following]="tag()!.isFollowing"
            (click)="toggleFollow()"
          >
            {{ tag()!.isFollowing ? 'FOLLOWING' : 'FOLLOW TAG' }}
          </button>

          <div class="recordings-list">
            @for (recording of recordings(); track recording.id) {
              <app-recording-card
                [recording]="recording"
                (cardClick)="openRecording($event)"
                (userClick)="openUser($event)"
                (tagClick)="openTag($event)"
                (onLike)="toggleLike($event)"
                (onPlay)="playRecording($event)"
              ></app-recording-card>
            }

            @if (recordings().length === 0) {
              <div class="empty-state">
                <p>No recordings with this tag yet</p>
              </div>
            }
          </div>
        </div>
      }
    </ion-content>

    <div class="mini-player-wrapper">
      <app-mini-player></app-mini-player>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 20px;
        padding-bottom: 100px;
      }

      .header {
        text-align: center;
        margin-bottom: 20px;
      }

      .tag-name {
        font-size: 32px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }

      .recording-count {
        font-size: 14px;
        color: var(--color-text-secondary);
        margin: 0;
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

      .recordings-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50vh;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--color-text-tertiary);
      }

      .mini-player-wrapper ::ng-deep .mini-player {
        bottom: 0 !important;
      }
    `,
  ],
})
export class TagDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tagsApi = inject(TagsApiService);
  private recordingsApi = inject(RecordingsApiService);
  private player = inject(PlayerService);
  private analytics = inject(AnalyticsService);

  tag = signal<Tag | null>(null);
  recordings = signal<Recording[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    const name = this.route.snapshot.paramMap.get('name');
    if (name) {
      this.loadTag(name);
      this.analytics.trackView('tag', name);
    }
  }

  private loadTag(name: string): void {
    this.isLoading.set(true);

    this.tagsApi.getTag(name).subscribe({
      next: (tag) => {
        this.tag.set(tag);
        this.loadRecordings(name);
      },
      error: () => {
        // Tag might not exist yet, create a placeholder
        this.tag.set({
          id: '',
          name: name,
          recordingCount: 0,
          isFollowing: false
        });
        this.loadRecordings(name);
      }
    });
  }

  private loadRecordings(tagName: string): void {
    this.tagsApi.getTagRecordings(tagName).subscribe({
      next: (result) => {
        this.recordings.set(result.items);
        this.isLoading.set(false);
      },
      error: () => {
        this.recordings.set([]);
        this.isLoading.set(false);
      }
    });
  }

  toggleFollow(): void {
    const t = this.tag();
    if (!t) return;

    const action = t.isFollowing
      ? this.tagsApi.unfollowTag(t.name)
      : this.tagsApi.followTag(t.name);

    action.subscribe({
      next: (result) => {
        this.tag.set({ ...t, isFollowing: result.following });
      }
    });
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  openUser(user: any): void {
    this.router.navigate(['/user', user.id]);
  }

  openTag(event: { name: string }): void {
    if (event.name !== this.tag()?.name) {
      this.router.navigate(['/tag', event.name]);
    }
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
        this.recordings.update(recordings =>
          recordings.map(r =>
            r.id === recording.id
              ? { ...r, isLiked: result.liked, likesCount: r.likesCount + (result.liked ? 1 : -1) }
              : r
          )
        );
      }
    });
  }
}
