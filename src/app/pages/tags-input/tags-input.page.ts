import { Component, inject, signal } from '@angular/core';
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
import { RecordingsApiService } from '../../services/recordings-api.service';
import { AudioCompressionService } from '../../services/audio-compression.service';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { WaveformComponent } from '../../components/waveform/waveform.component';
import { MovementBadgeComponent } from '../../components/movement-badge/movement-badge.component';
import { firstValueFrom } from 'rxjs';

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

        <input
          type="text"
          class="title-input"
          placeholder="Title (optional)"
          [ngModel]="state.title()"
          (ngModelChange)="onTitleChange($event)"
          [maxlength]="100"
        />

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

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button
          class="upload-button"
          [class.disabled]="!canUpload"
          [disabled]="!canUpload"
          (click)="upload()"
        >
          {{ uploadButtonText }}
        </button>
      </div>

      <!-- Loading Overlay -->
      @if (isCompressing() || state.phase() === 'uploading') {
        <div class="loading-overlay">
          <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-text">{{ isCompressing() ? 'Compressing audio...' : 'Uploading...' }}</p>
            <p class="loading-subtext">{{ isCompressing() ? 'Optimizing file size' : 'Almost there' }}</p>
          </div>
        </div>
      }
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
        margin-bottom: 16px;
      }

      .title {
        font-size: 28px;
        font-weight: 600;
        margin: 0;
      }

      .title-input {
        width: 100%;
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--color-border);
        color: var(--color-text-primary);
        font-size: 18px;
        margin-bottom: 24px;

        &::placeholder {
          color: var(--color-text-tertiary);
        }

        &:focus {
          outline: none;
          border-bottom-color: var(--color-border-light);
        }
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

      .error {
        color: #ff6b6b;
        font-size: 14px;
        margin: 0 0 12px 0;
        text-align: center;
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

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-text-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-text {
        font-size: 18px;
        font-weight: 500;
        color: var(--color-text-primary);
        margin: 0;
      }

      .loading-subtext {
        font-size: 14px;
        color: var(--color-text-secondary);
        margin: 0;
      }
    `,
  ],
})
export class TagsInputPage {
  private router = inject(Router);
  state = inject(RecordingStateService);
  private recordingsApi = inject(RecordingsApiService);
  private compression = inject(AudioCompressionService);

  newTag = '';
  error = signal<string | null>(null);
  isCompressing = signal(false);

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
    return this.state.tags().length >= 3 && this.state.phase() !== 'uploading' && !this.isCompressing();
  }

  get uploadButtonText(): string {
    if (this.isCompressing()) return 'COMPRESSING...';
    if (this.state.phase() === 'uploading') return 'UPLOADING...';
    return 'UPLOAD';
  }

  get tagsNeeded(): string {
    const needed = 3 - this.state.tags().length;
    if (needed <= 0) return 'ready to upload';
    return `${needed} more required`;
  }

  onTitleChange(value: string): void {
    this.state.setTitle(value);
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

    this.error.set(null);

    const draft = this.state.getDraft();
    let audioBlob = draft.audioBlob!;

    // Compress WAV to M4A
    try {
      this.isCompressing.set(true);
      const originalSize = audioBlob.size;
      audioBlob = await this.compression.compressToM4A(audioBlob);
      const compressedSize = audioBlob.size;
      console.log(`Compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`);
    } catch (err) {
      console.error('Compression failed, uploading original:', err);
      // Fall back to original WAV if compression fails
    } finally {
      this.isCompressing.set(false);
    }

    // Upload
    this.state.startUpload();

    try {
      await firstValueFrom(
        this.recordingsApi.createRecording(
          audioBlob,
          draft.movement!,
          this.state.duration(),
          draft.tags,
          draft.waveformData,
          draft.title || undefined
        )
      );

      this.state.reset();
      this.router.navigate(['/explore']);
    } catch (err: any) {
      const message = err?.error?.error || err?.message || 'Upload failed';
      this.error.set(message);
      this.state.goToTagging(); // Reset phase back from uploading
    }
  }
}
