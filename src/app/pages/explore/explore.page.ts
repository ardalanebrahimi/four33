import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { MockDataService } from '../../services/mock-data.service';
import { Recording, Tag } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, IonContent, RecordingCardComponent, TagChipComponent],
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
          @for (tag of tags; track tag.id) {
            <app-tag-chip
              [name]="tag.name"
              [selected]="selectedTag() === tag.name"
              [addable]="true"
              (chipClick)="selectTag($event)"
            ></app-tag-chip>
          }
        </div>

        <div class="recordings-list">
          @for (recording of filteredRecordings(); track recording.id; let i = $index) {
            <app-recording-card
              [recording]="recording"
              [style.animation-delay.ms]="i * 50"
              (cardClick)="openRecording($event)"
              (userClick)="openUser($event)"
              (tagClick)="selectTag($event.name)"
              (onLike)="toggleLike($event)"
            ></app-recording-card>
          }

          @if (filteredRecordings().length === 0) {
            <div class="empty-state">
              <p>No recordings found</p>
            </div>
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
export class ExplorePage {
  private router = inject(Router);
  private mockData = inject(MockDataService);

  tags = this.mockData.getTags().slice(0, 8);
  selectedTag = signal<string | null>(null);

  filteredRecordings = signal<Recording[]>(this.mockData.getRecordings());

  selectTag(tagName: string): void {
    if (this.selectedTag() === tagName) {
      this.clearFilter();
    } else {
      this.selectedTag.set(tagName);
      this.filteredRecordings.set(this.mockData.getRecordings({ tag: tagName }));
    }
  }

  clearFilter(): void {
    this.selectedTag.set(null);
    this.filteredRecordings.set(this.mockData.getRecordings());
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  openUser(user: any): void {
    this.router.navigate(['/user', user.id]);
  }

  toggleLike(recording: Recording): void {
    this.mockData.toggleLike(recording.id);
    // Refresh the list to reflect the change
    const tag = this.selectedTag();
    this.filteredRecordings.set(
      tag ? this.mockData.getRecordings({ tag }) : this.mockData.getRecordings()
    );
  }
}
