import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recording } from '../../models';
import { MovementBadgeComponent } from '../movement-badge/movement-badge.component';
import { TagChipComponent } from '../tag-chip/tag-chip.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, heart, heartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-recording-card',
  standalone: true,
  imports: [
    CommonModule,
    MovementBadgeComponent,
    TagChipComponent,
    IonIcon,
  ],
  template: `
    <div class="card" (click)="onCardClick($event)">
      <div class="header">
        <button class="play-btn" (click)="playClick($event)">
          <ion-icon name="play"></ion-icon>
        </button>
        <div class="user-info" (click)="onUserClick($event)">
          @if (recording.title) {
            <span class="title">{{ recording.title }}</span>
          }
          <span class="username">{{ recording.user.username }}</span>
          <span class="time">{{ recording.timeAgo }}</span>
        </div>
        <div class="meta">
          <app-movement-badge [movement]="recording.movement" [small]="true"></app-movement-badge>
          <button class="like-btn" [class.liked]="recording.isLiked" (click)="likeClick($event)">
            <ion-icon [name]="recording.isLiked ? 'heart' : 'heart-outline'"></ion-icon>
            <span>{{ recording.likesCount }}</span>
          </button>
        </div>
      </div>
      <div class="tags" (click)="$event.stopPropagation()">
        @for (tag of recording.tags.slice(0, 3); track tag.id) {
          <app-tag-chip
            [name]="tag.name"
            (chipClick)="onTagClick($event)"
          ></app-tag-chip>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: var(--color-surface, #0a0a0a);
        border: 1px solid var(--color-border, #222);
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: border-color var(--duration-fast, 150ms) ease;
      }

      .card:hover {
        border-color: var(--color-border-light, #333);
      }

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .play-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--color-surface-elevated, #1a1a1a);
        border: 1px solid var(--color-border, #222);
        color: var(--color-text-primary, #fff);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }

      .play-btn ion-icon {
        font-size: 18px;
        margin-left: 2px;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        cursor: pointer;
      }

      .title {
        font-weight: 600;
        font-size: 15px;
        color: var(--color-text-primary, #fff);
      }

      .username {
        font-weight: 500;
        color: var(--color-text-primary, #fff);
        font-size: 13px;
      }

      .title + .username {
        font-weight: 400;
        color: var(--color-text-secondary, #888);
      }

      .time {
        font-size: 12px;
        color: var(--color-text-tertiary, #555);
      }

      .meta {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .like-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: none;
        color: var(--color-text-secondary, #888);
        font-size: 14px;
        cursor: pointer;
        padding: 4px;
      }

      .like-btn.liked {
        color: var(--color-text-primary, #fff);
      }

      .like-btn ion-icon {
        font-size: 18px;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    `,
  ],
})
export class RecordingCardComponent {
  @Input() recording!: Recording;
  @Output() cardClick = new EventEmitter<Recording>();
  @Output() userClick = new EventEmitter<any>();
  @Output() tagClick = new EventEmitter<any>();
  @Output() onLike = new EventEmitter<Recording>();
  @Output() onPlay = new EventEmitter<Recording>();

  constructor() {
    addIcons({ play, heart, heartOutline });
  }

  onCardClick(event: Event): void {
    // Only emit cardClick if no other handler caught it
    this.cardClick.emit(this.recording);
  }

  onUserClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.userClick.emit(this.recording.user);
  }

  onTagClick(tagName: string): void {
    this.tagClick.emit({ name: tagName });
  }

  playClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.onPlay.emit(this.recording);
  }

  likeClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.onLike.emit(this.recording);
  }
}
