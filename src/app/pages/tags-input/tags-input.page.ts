import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { RecordingStateService } from '../../services/recording-state.service';
import { MockDataService } from '../../services/mock-data.service';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { WaveformComponent } from '../../components/waveform/waveform.component';
import { MovementBadgeComponent } from '../../components/movement-badge/movement-badge.component';

@Component({
  selector: 'app-tags-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    TagChipComponent,
    WaveformComponent,
    MovementBadgeComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/record" text="Back"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="container">
        <div class="header">
          <h1 class="title">Interpret</h1>
          @if (state.selectedMovement()) {
            <app-movement-badge
              [movement]="state.selectedMovement()!"
              [small]="true"
            ></app-movement-badge>
          }
        </div>

        <p class="subtitle">Add 3–5 words. What did you hear?</p>

        <div class="tags-list">
          @for (tag of state.tags(); track tag) {
            <app-tag-chip
              [name]="tag"
              [removable]="true"
              (remove)="removeTag($event)"
            ></app-tag-chip>
          }
        </div>

        <div class="input-row">
          <input
            type="text"
            class="tag-input"
            placeholder="Winter"
            [(ngModel)]="newTag"
            (keyup.enter)="addTag()"
            [maxlength]="20"
          />
          <button
            class="add-button"
            (click)="addTag()"
            [disabled]="!canAddTag"
          >
            +
          </button>
        </div>

        <p class="counter">{{ state.tags().length }}/5 tags · {{ tagsNeeded }}</p>

        <div class="waveform-section">
          <app-waveform
            [data]="state.waveformData()"
            [progress]="0"
            [height]="50"
          ></app-waveform>
        </div>

        <button
          class="upload-button"
          [class.disabled]="!canUpload"
          [disabled]="!canUpload"
          (click)="upload()"
        >
          {{ state.phase() === 'uploading' ? 'UPLOADING...' : 'UPLOAD' }}
        </button>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .container {
        padding: 20px;
        min-height: 100%;
        display: flex;
        flex-direction: column;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .title {
        font-size: 28px;
        font-weight: 600;
        margin: 0;
      }

      .subtitle {
        color: var(--color-text-secondary);
        font-size: 14px;
        margin: 0 0 24px 0;
      }

      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 44px;
        margin-bottom: 16px;
      }

      .input-row {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
      }

      .tag-input {
        flex: 1;
        padding: 14px 16px;
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        color: var(--color-text-primary);
        font-size: 16px;

        &::placeholder {
          color: var(--color-text-tertiary);
        }

        &:focus {
          outline: none;
          border-color: var(--color-border-light);
        }
      }

      .add-button {
        width: 50px;
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        color: var(--color-text-primary);
        font-size: 24px;
        cursor: pointer;

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }

      .counter {
        font-size: 12px;
        color: var(--color-text-tertiary);
        margin: 0 0 32px 0;
      }

      .waveform-section {
        flex: 1;
        display: flex;
        align-items: center;
        margin-bottom: 24px;
      }

      .upload-button {
        width: 100%;
        padding: 16px;
        background: var(--color-text-primary);
        border: none;
        border-radius: 8px;
        color: var(--color-bg);
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
        transition: opacity 0.15s ease;

        &:hover:not(.disabled) {
          opacity: 0.9;
        }

        &.disabled {
          background: var(--color-surface-elevated);
          color: var(--color-text-tertiary);
          cursor: not-allowed;
        }
      }
    `,
  ],
})
export class TagsInputPage {
  private router = inject(Router);
  state = inject(RecordingStateService);
  private mockData = inject(MockDataService);

  newTag = '';

  get canAddTag(): boolean {
    const normalized = this.newTag.trim().toLowerCase();
    return (
      normalized.length > 0 &&
      normalized.length <= 20 &&
      this.state.tags().length < 5 &&
      !this.state.tags().includes(normalized)
    );
  }

  get canUpload(): boolean {
    return this.state.tags().length >= 3 && this.state.phase() !== 'uploading';
  }

  get tagsNeeded(): string {
    const needed = 3 - this.state.tags().length;
    if (needed <= 0) return 'ready to upload';
    return `${needed} more required`;
  }

  addTag(): void {
    if (this.canAddTag) {
      this.state.addTag(this.newTag);
      this.newTag = '';
    }
  }

  removeTag(tag: string): void {
    this.state.removeTag(tag);
  }

  async upload(): Promise<void> {
    if (!this.canUpload) return;

    this.state.startUpload();

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const draft = this.state.getDraft();
    this.mockData.addRecording({
      movement: draft.movement!,
      durationSeconds: this.state.duration(),
      audioUrl: this.state.audioUrl(),
      waveformData: draft.waveformData,
      tags: draft.tags.map((name) => ({ id: '', name, isOriginal: true })),
    });

    this.state.reset();
    this.router.navigate(['/explore']);
  }
}
