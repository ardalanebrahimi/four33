import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { RecordingStateService } from '../../services/recording-state.service';
import { WaveformComponent } from '../../components/waveform/waveform.component';
import { MovementBadgeComponent } from '../../components/movement-badge/movement-badge.component';

@Component({
  selector: 'app-playback',
  standalone: true,
  imports: [CommonModule, IonContent, WaveformComponent, MovementBadgeComponent],
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

        <div class="waveform-section">
          <app-waveform
            [data]="state.waveformData()"
            [progress]="playbackProgress"
            [height]="100"
            [barCount]="50"
          ></app-waveform>
        </div>

        <div class="playback-controls">
          <button class="play-button" (click)="togglePlayback()">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <span class="mic-indicator">🎙</span>
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
        margin: 40px 0;
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

      .mic-indicator {
        font-size: 20px;
        opacity: 0.3;
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
  private router = inject(Router);
  state = inject(RecordingStateService);

  private audioElement: HTMLAudioElement | null = null;
  isPlaying = false;
  playbackProgress = 0;

  togglePlayback(): void {
    if (!this.audioElement) {
      this.audioElement = new Audio(this.state.audioUrl());
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement) {
          this.playbackProgress =
            (this.audioElement.currentTime / this.audioElement.duration) * 100;
        }
      });
      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.playbackProgress = 0;
      });
    }

    if (this.isPlaying) {
      this.audioElement.pause();
    } else {
      this.audioElement.play();
    }
    this.isPlaying = !this.isPlaying;
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
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
