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
import { Recording, Tag } from '../../models';
import { RecordingCardComponent } from '../../components/recording-card/recording-card.component';

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
      @if (tag()) {
        <div class="container">
          <div class="header">
            <h1 class="tag-name">#{{ tag()!.name }}</h1>
            <p class="recording-count">{{ recordings().length }} recordings</p>
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
                (onLike)="toggleLike($event)"
              ></app-recording-card>
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
    `,
  ],
})
export class TagDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockData = inject(MockDataService);

  tag = signal<Tag | null>(null);
  recordings = signal<Recording[]>([]);

  ngOnInit(): void {
    const name = this.route.snapshot.paramMap.get('name');
    if (name) {
      const tags = this.mockData.getTags();
      const foundTag = tags.find((t) => t.name === name);
      if (foundTag) {
        this.tag.set(foundTag);
        this.recordings.set(this.mockData.getRecordings({ tag: name }));
      }
    }
  }

  toggleFollow(): void {
    const t = this.tag();
    if (t) {
      this.mockData.toggleFollowTag(t.name);
      this.tag.set({ ...t, isFollowing: !t.isFollowing });
    }
  }

  openRecording(recording: Recording): void {
    this.router.navigate(['/recording', recording.id]);
  }

  openUser(user: any): void {
    this.router.navigate(['/user', user.id]);
  }

  toggleLike(recording: Recording): void {
    this.mockData.toggleLike(recording.id);
    const tagName = this.tag()?.name;
    if (tagName) {
      this.recordings.set(this.mockData.getRecordings({ tag: tagName }));
    }
  }
}
