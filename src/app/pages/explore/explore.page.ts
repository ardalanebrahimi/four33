import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { RecordingsApiService } from '../../services/recordings-api.service';
import { TagsApiService } from '../../services/tags-api.service';
import { Recording, Tag } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner, RecordingCardComponent, TagChipComponent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="container">
        <h1 class="title">Explore</h1>

        <div class="tags-filter">
          <app-tag-chip
            name="all"
            [selected]="!selectedTag()"
            (chipClick)="clearFilter()"
          ></app-tag-chip>
          @for (tag of tags(); track tag.id) {
            <app-tag-chip
              [name]="tag.name"
              [selected]="selectedTag() === tag.name"
              [addable]="true"
              (chipClick)="selectTag($event)"
            ></app-tag-chip>
          }
        </div>

        <div class="recordings-list">
          @if (isLoading()) {
            <div class="loading-state">
              <ion-spinner name="crescent"></ion-spinner>
            </div>
          } @else {
            @for (recording of recordings(); track recording.id; let i = $index) {
              <app-recording-card
                [recording]="recording"
                [style.animation-delay.ms]="i * 50"
                (cardClick)="openRecording($event)"
                (userClick)="openUser($event)"
                (tagClick)="selectTag($event.name)"
                (onLike)="toggleLike($event)"
                (onPlay)="openRecording($event)"
              ></app-recording-card>
            }

            @if (recordings().length === 0) {
              <div class="empty-state">
                <p>No recordings found</p>
              </div>
            }
          }
        </div>
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

  tags = signal<Tag[]>([]);
  selectedTag = signal<string | null>(null);
  recordings = signal<Recording[]>([]);
  isLoading = signal(false);

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

  loadRecordings(): void {
    this.isLoading.set(true);
    const tag = this.selectedTag();

    this.recordingsApi.getRecordings({ tag: tag || undefined, limit: 50 }).subscribe({
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

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  openUser(user: any): void {
    this.router.navigate(['/user', user.id]);
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
