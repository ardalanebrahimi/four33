import { Component, inject, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonRange } from '@ionic/angular/standalone';
import { RecordingStateService } from '../../services/recording-state.service';
import { WaveformComponent } from '../../components/waveform/waveform.component';
import { MovementBadgeComponent } from '../../components/movement-badge/movement-badge.component';

@Component({
  selector: 'app-playback',
  standalone: true,
  imports: [CommonModule, IonContent, IonRange, WaveformComponent, MovementBadgeComponent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="container">
        <p class="recorded-label">RECORDED</p>
        <h1 class="duration-display">{{ state.movement()?.label }}</h1>

        @if (state.selectedMovement()) {
          <app-movement-badge
            [movement]="state.selectedMovement()!"
            [small]="true"
          ></app-movement-badge>
        }

        <div class="waveform-section" (click)="onWaveformClick($event)" #waveformContainer>
          <app-waveform
            [data]="state.waveformData()"
            [progress]="playbackProgress"
            [height]="100"
            [barCount]="50"
          ></app-waveform>
        </div>

        <div class="seek-bar">
          <span class="time-label">{{ formatTime(currentTime) }}</span>
          <ion-range
            [min]="0"
            [max]="duration"
            [value]="currentTime"
            (ionInput)="onSeek($event)"
            [pin]="false"
          ></ion-range>
          <span class="time-label">{{ formatTime(duration) }}</span>
        </div>

        <div class="playback-controls">
          <button class="play-button" (click)="togglePlayback()">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
        </div>

        <div class="action-buttons">
          <button class="btn-secondary" (click)="startOver()">START OVER</button>
          <button class="btn-primary" (click)="goToTags()">ADD TAGS →</button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .container {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 20px 40px;
      }

      .recorded-label {
        color: var(--color-text-secondary);
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin: 0 0 8px 0;
      }

      .duration-display {
        font-size: 56px;
        font-weight: 300;
        margin: 0 0 16px 0;
      }

      .waveform-section {
        width: 100%;
        flex: 1;
        display: flex;
        align-items: center;
        margin: 40px 0 20px;
        cursor: pointer;
      }

      .seek-bar {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;

        ion-range {
          flex: 1;
          --bar-height: 4px;
          --bar-background: var(--color-border);
          --bar-background-active: var(--color-text-primary);
          --knob-size: 16px;
          --knob-background: var(--color-text-primary);
          --pin-background: var(--color-text-primary);
          padding: 0;
        }
      }

      .time-label {
        font-size: 12px;
        color: var(--color-text-secondary);
        min-width: 40px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }

      .playback-controls {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 40px;
      }

      .play-button {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--color-text-primary);
        border: none;
        color: var(--color-bg);
        font-size: 24px;
        cursor: pointer;

        &:hover {
          opacity: 0.9;
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        width: 100%;
      }

      .btn-secondary,
      .btn-primary {
        flex: 1;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 12px;
        letter-spacing: 1px;
        cursor: pointer;
      }

      .btn-secondary {
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        color: var(--color-text-primary);
      }

      .btn-primary {
        background: var(--color-text-primary);
        border: none;
        color: var(--color-bg);
      }
    `,
  ],
})
export class PlaybackPage implements OnDestroy {
  @ViewChild('waveformContainer') waveformContainer!: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  state = inject(RecordingStateService);

  private audioElement: HTMLAudioElement | null = null;
  isPlaying = false;
  playbackProgress = 0;
  currentTime = 0;
  duration = 0;

  private initAudio(): void {
    if (!this.audioElement) {
      this.audioElement = new Audio(this.state.audioUrl());

      this.audioElement.addEventListener('loadedmetadata', () => {
        if (this.audioElement) {
          this.duration = this.audioElement.duration;
        }
      });

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement) {
          this.currentTime = this.audioElement.currentTime;
          this.playbackProgress =
            (this.audioElement.currentTime / this.audioElement.duration) * 100;
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.playbackProgress = 0;
        this.currentTime = 0;
      });

      // Load to get duration
      this.audioElement.load();
    }
  }

  togglePlayback(): void {
    this.initAudio();

    if (this.isPlaying) {
      this.audioElement!.pause();
    } else {
      this.audioElement!.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  onSeek(event: any): void {
    this.initAudio();
    const value = event.detail.value;
    if (this.audioElement && typeof value === 'number') {
      this.audioElement.currentTime = value;
      this.currentTime = value;
      this.playbackProgress = (value / this.duration) * 100;
    }
  }

  onWaveformClick(event: MouseEvent): void {
    this.initAudio();
    if (!this.audioElement || !this.waveformContainer) return;

    const container = this.waveformContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * this.duration;

    this.audioElement.currentTime = newTime;
    this.currentTime = newTime;
    this.playbackProgress = percentage * 100;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  startOver(): void {
    this.cleanup();
    this.state.reset();
    this.router.navigate(['/record']);
  }

  goToTags(): void {
    this.cleanup();
    this.state.goToTagging();
    this.router.navigate(['/tags-input']);
  }

  private cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.isPlaying = false;
    this.playbackProgress = 0;
    this.currentTime = 0;
    this.duration = 0;
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
