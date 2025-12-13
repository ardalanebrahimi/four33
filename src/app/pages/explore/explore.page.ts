import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { RecordingsApiService } from '../../services/recordings-api.service';
import { TagsApiService } from '../../services/tags-api.service';
import { PlayerService } from '../../services/player.service';
import { Recording, Tag } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    RecordingCardComponent,
    TagChipComponent,
    LoadingComponent,
  ],
  template: `
    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingText="Pull to refresh" refreshingSpinner="crescent"></ion-refresher-content>
      </ion-refresher>

      <div class="container">
        <h1 class="title">Explore</h1>

        <div class="tags-filter">
          <app-tag-chip
            name="all"
            [selected]="!selectedTag()"
            (chipClick)="clearFilter()"
          ></app-tag-chip>
          @for (tag of displayedTags(); track tag.id) {
            <app-tag-chip
              [name]="tag.name"
              [selected]="selectedTag() === tag.name"
              [addable]="true"
              (chipClick)="selectTag($event)"
            ></app-tag-chip>
          }
          @if (hasMoreTags()) {
            <button class="more-tags-btn" (click)="toggleTagsExpanded()">
              {{ tagsExpanded() ? 'Show less' : '+' + hiddenTagsCount() + ' more' }}
            </button>
          }
        </div>

        <div class="recordings-list">
          @if (isLoading() && recordings().length === 0) {
            <app-loading text="listening"></app-loading>
          } @else {
            @for (recording of recordings(); track recording.id; let i = $index) {
              <app-recording-card
                [recording]="recording"
                [style.animation-delay.ms]="i < pageSize ? i * 50 : 0"
                (cardClick)="openRecording($event)"
                (userClick)="openUser($event)"
                (tagClick)="selectTag($event.name)"
                (onLike)="toggleLike($event)"
                (onPlay)="playRecording($event)"
              ></app-recording-card>
            }

            @if (recordings().length === 0 && !isLoading()) {
              <div class="empty-state">
                <p>No recordings found</p>
              </div>
            }
          }
        </div>

        <ion-infinite-scroll
          [disabled]="!hasMore()"
          (ionInfinite)="loadMore($event)"
        >
          <ion-infinite-scroll-content
            loadingSpinner="crescent"
            loadingText="Loading more..."
          ></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .container {
        padding: 40px 20px 100px;
      }

      .title {
        font-size: 28px;
        font-weight: 600;
        margin: 0 0 24px 0;
      }

      .tags-filter {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 24px;
      }

      .more-tags-btn {
        padding: 6px 12px;
        background: var(--color-surface-elevated, #1a1a1a);
        border: 1px solid var(--color-border, #222);
        border-radius: 16px;
        color: var(--color-text-secondary, #888);
        font-size: 13px;
        cursor: pointer;
        transition: all 150ms ease;

        &:hover {
          border-color: var(--color-border-light, #333);
          color: var(--color-text-primary, #fff);
        }
      }

      .recordings-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      app-recording-card {
        animation: fadeSlideUp 0.3s ease-out both;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--color-text-tertiary);
      }

      .loading-state {
        display: flex;
        justify-content: center;
        padding: 60px 20px;
      }

      @keyframes fadeSlideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ExplorePage implements OnInit {
  private router = inject(Router);
  private recordingsApi = inject(RecordingsApiService);
  private tagsApi = inject(TagsApiService);
  private player = inject(PlayerService);

  private readonly MAX_VISIBLE_TAGS = 5;
  readonly pageSize = 15;

  tags = signal<Tag[]>([]);
  selectedTag = signal<string | null>(null);
  recordings = signal<Recording[]>([]);
  isLoading = signal(false);
  tagsExpanded = signal(false);
  hasMore = signal(true);
  private currentOffset = 0;

  // Computed signals for tags display
  displayedTags = computed(() => {
    const allTags = this.tags();
    if (this.tagsExpanded()) {
      return allTags;
    }
    return allTags.slice(0, this.MAX_VISIBLE_TAGS);
  });

  hasMoreTags = computed(() => this.tags().length > this.MAX_VISIBLE_TAGS);

  hiddenTagsCount = computed(() => Math.max(0, this.tags().length - this.MAX_VISIBLE_TAGS));

  ngOnInit(): void {
    this.loadTags();
    this.loadRecordings();
  }

  private loadTags(): void {
    this.tagsApi.getTags(10).subscribe({
      next: (tags) => this.tags.set(tags),
      error: () => {} // Silently fail for tags
    });
  }

  loadRecordings(reset = true): void {
    if (reset) {
      this.currentOffset = 0;
      this.recordings.set([]);
      this.hasMore.set(true);
    }

    this.isLoading.set(true);
    const tag = this.selectedTag();

    this.recordingsApi.getRecordings({
      tag: tag || undefined,
      limit: this.pageSize,
      offset: this.currentOffset
    }).subscribe({
      next: (result) => {
        if (reset) {
          this.recordings.set(result.items);
        } else {
          this.recordings.update(current => [...current, ...result.items]);
        }
        this.hasMore.set(result.hasMore);
        this.currentOffset += result.items.length;
        this.isLoading.set(false);
      },
      error: () => {
        if (reset) {
          this.recordings.set([]);
        }
        this.hasMore.set(false);
        this.isLoading.set(false);
      }
    });
  }

  loadMore(event: any): void {
    if (!this.hasMore() || this.isLoading()) {
      event.target.complete();
      return;
    }

    const tag = this.selectedTag();

    this.recordingsApi.getRecordings({
      tag: tag || undefined,
      limit: this.pageSize,
      offset: this.currentOffset
    }).subscribe({
      next: (result) => {
        this.recordings.update(current => [...current, ...result.items]);
        this.hasMore.set(result.hasMore);
        this.currentOffset += result.items.length;
        event.target.complete();
      },
      error: () => {
        this.hasMore.set(false);
        event.target.complete();
      }
    });
  }

  selectTag(tagName: string): void {
    if (this.selectedTag() === tagName) {
      this.clearFilter();
    } else {
      this.selectedTag.set(tagName);
      this.loadRecordings();
    }
  }

  clearFilter(): void {
    this.selectedTag.set(null);
    this.loadRecordings();
  }

  handleRefresh(event: any): void {
    this.loadTags();
    this.currentOffset = 0;
    this.hasMore.set(true);
    const tag = this.selectedTag();

    this.recordingsApi.getRecordings({
      tag: tag || undefined,
      limit: this.pageSize,
      offset: 0
    }).subscribe({
      next: (result) => {
        this.recordings.set(result.items);
        this.hasMore.set(result.hasMore);
        this.currentOffset = result.items.length;
        event.target.complete();
      },
      error: () => {
        this.recordings.set([]);
        this.hasMore.set(false);
        event.target.complete();
      }
    });
  }

  toggleTagsExpanded(): void {
    this.tagsExpanded.update(v => !v);
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  openUser(user: any): void {
    this.router.navigate(['/user', user.id]);
  }

  playRecording(recording: Recording): void {
    // Play the recording and set the current playlist
    this.player.play(recording, this.recordings());
  }

  toggleLike(recording: Recording): void {
    const action = recording.isLiked
      ? this.recordingsApi.unlikeRecording(recording.id)
      : this.recordingsApi.likeRecording(recording.id);

    action.subscribe({
      next: (result) => {
        // Update the recording in the list
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
