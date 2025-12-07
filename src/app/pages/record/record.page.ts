import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { MovementId, MOVEMENTS } from '../../models';
import { RecordingStateService } from '../../services/recording-state.service';
import { AudioRecorderService } from '../../services/audio-recorder.service';
import { WaveformComponent } from '../../components/waveform/waveform.component';
import { ProgressRingComponent } from '../../components/progress-ring/progress-ring.component';

@Component({
  selector: 'app-record',
  standalone: true,
  imports: [CommonModule, IonContent, WaveformComponent, ProgressRingComponent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="container">
        <!-- Movement Selection Phase -->
        @if (state.phase() === 'selecting') {
          <div class="selection-view">
            <h1 class="title">4'33"</h1>
            <p class="subtitle">Record the complete work</p>

            <div class="main-action">
              <button class="record-main-button" (click)="selectMovement('FULL')">
                <span class="mic-icon">🎙</span>
                <span class="main-duration">4'33"</span>
                <span class="main-label">TAP TO BEGIN</span>
              </button>
            </div>

            @if (!showAllMovements) {
              <button class="show-more-btn" (click)="showAllMovements = true">
                or choose a shorter movement ▾
              </button>
            } @else {
              <div class="movements">
                <p class="movements-label">SHORTER MOVEMENTS</p>
                @for (mov of movements; track mov.id) {
                  @if (mov.id !== 'FULL') {
                    <button class="movement-item" (click)="selectMovement(mov.id)">
                      <div class="movement-icon">
                        <span class="numeral">{{ mov.id }}</span>
                      </div>
                      <div class="movement-info">
                        <span class="movement-name">Movement {{ mov.id }}</span>
                        <span class="movement-desc">{{ mov.description }}</span>
                      </div>
                      <span class="movement-duration">{{ mov.label }}</span>
                    </button>
                  }
                }
              </div>
              <button class="show-more-btn" (click)="showAllMovements = false">
                hide ▴
              </button>
            }

            <p class="footer-text">
              Each movement is a window into silence.
            </p>
          </div>
        }

        <!-- Ready State -->
        @if (state.phase() === 'ready') {
          <div class="ready-view">
            <h1 class="title">4'33"</h1>
            <p class="movement-label">MOVEMENT {{ state.selectedMovement() }}</p>

            <div class="record-button-container">
              <button class="record-button" (click)="startRecording()">
                <span class="mic-icon">🎙</span>
                <span class="duration">{{ state.movement()?.label }}</span>
              </button>
            </div>

            <div class="waveform-placeholder">
              <app-waveform [data]="[]" [height]="40" [barCount]="30"></app-waveform>
            </div>

            <button class="change-button" (click)="goBack()">
              ← CHANGE
            </button>
          </div>
        }

        <!-- Recording State -->
        @if (state.phase() === 'recording') {
          <div class="recording-view">
            <h1 class="title">4'33"</h1>
            <p class="status-label">LISTENING...</p>

            <app-progress-ring [progress]="state.progress()" [size]="220" [strokeWidth]="4">
              <div class="ring-content">
                <span class="remaining-time">{{ formatTime(state.remaining()) }}</span>
                <span class="remaining-label">remaining</span>
              </div>
            </app-progress-ring>

            <div class="live-waveform">
              <app-waveform
                [data]="state.waveformData()"
                [progress]="100"
                [height]="80"
                [barCount]="40"
                [live]="true"
              ></app-waveform>
            </div>

            <button class="cancel-button" (click)="cancelRecording()">
              CANCEL
            </button>
          </div>
        }

        <!-- Recorded State (Preview) -->
        @if (state.phase() === 'recorded') {
          <div class="recorded-view">
            <p class="recorded-label">RECORDED</p>
            <h1 class="duration-display">{{ state.movement()?.label }}</h1>

            <div class="movement-badge">
              <span>○ {{ state.movement()?.label }}</span>
            </div>

            <div class="waveform-preview">
              <app-waveform
                [data]="state.waveformData()"
                [progress]="playbackProgress"
                [height]="100"
                [barCount]="50"
              ></app-waveform>
              <div class="playback-line" [style.left.%]="playbackProgress"></div>
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
        }
      </div>
    </ion-content>
  `,
  styleUrl: './record.page.scss',
})
export class RecordPage implements OnDestroy {
  private router = inject(Router);
  state = inject(RecordingStateService);
  private audioService = inject(AudioRecorderService);

  movements = Object.values(MOVEMENTS);
  showAllMovements = false;
  private recordingInterval: any;
  private recordingStartTime: number = 0;
  private audioElement: HTMLAudioElement | null = null;
  isPlaying = false;
  playbackProgress = 0;

  selectMovement(movement: MovementId): void {
    this.state.selectMovement(movement);
  }

  async startRecording(): Promise<void> {
    try {
      await this.audioService.startRecording();
      this.state.startRecording();

      this.recordingStartTime = Date.now();
      const duration = this.state.duration();

      this.recordingInterval = setInterval(() => {
        // Use actual time elapsed instead of incrementing counter
        // This ensures accurate timing even when tab is in background
        const elapsed = (Date.now() - this.recordingStartTime) / 1000;
        const amplitude = this.audioService.getAmplitude();
        this.state.updateProgress(elapsed, amplitude);

        if (elapsed >= duration) {
          this.finishRecording();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  private async finishRecording(): Promise<void> {
    clearInterval(this.recordingInterval);
    try {
      const { blob, waveform } = await this.audioService.stopRecording();
      this.state.finishRecording(blob, waveform);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }

  cancelRecording(): void {
    clearInterval(this.recordingInterval);
    this.audioService.cancelRecording();
    this.state.reset();
  }

  goBack(): void {
    this.state.goBackToSelection();
  }

  startOver(): void {
    this.stopPlayback();
    this.state.reset();
  }

  goToTags(): void {
    this.stopPlayback();
    this.router.navigate(['/tags-input']);
  }

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

  private stopPlayback(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.isPlaying = false;
    this.playbackProgress = 0;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    clearInterval(this.recordingInterval);
    this.stopPlayback();
  }
}
