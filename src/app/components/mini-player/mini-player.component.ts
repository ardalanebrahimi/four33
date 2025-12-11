import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  play,
  pause,
  playSkipBack,
  playSkipForward,
  chevronUp,
} from 'ionicons/icons';
import { PlayerService } from '../../services/player.service';
import { WaveformComponent } from '../waveform/waveform.component';

@Component({
  selector: 'app-mini-player',
  standalone: true,
  imports: [CommonModule, IonIcon, WaveformComponent],
  template: `
    @if (player.isActive()) {
      <div class="mini-player">
        <div class="progress-bar">
          <div
            class="progress-fill"
            [style.width.%]="player.progress()"
          ></div>
          <input
            type="range"
            class="progress-input"
            min="0"
            max="100"
            [value]="player.progress()"
            (input)="onSeek($event)"
          />
        </div>

        <div class="content" (click)="openDetail()">
          <div class="info">
            <div class="waveform-mini">
              <app-waveform
                [data]="player.currentRecording()?.waveformData || []"
                [progress]="player.progress()"
                [height]="32"
                [barWidth]="2"
                [gap]="1"
                [barCount]="20"
              ></app-waveform>
            </div>
            <div class="text">
              @if (player.currentRecording()?.title) {
                <span class="title">{{ player.currentRecording()?.title }}</span>
              }
              <span class="username">{{ player.currentRecording()?.user?.username }}</span>
              <span class="time">
                {{ player.formatTime(player.currentTime()) }} / {{ player.formatTime(player.duration()) }}
              </span>
            </div>
          </div>

          <div class="controls" (click)="$event.stopPropagation()">
            <button
              class="control-btn"
              [class.disabled]="!player.hasPrevious()"
              (click)="onPrevious()"
            >
              <ion-icon name="play-skip-back"></ion-icon>
            </button>

            <button class="play-btn" (click)="onTogglePlay()">
              <ion-icon [name]="player.isPlaying() ? 'pause' : 'play'"></ion-icon>
            </button>

            <button
              class="control-btn"
              [class.disabled]="!player.hasNext()"
              (click)="onNext()"
            >
              <ion-icon name="play-skip-forward"></ion-icon>
            </button>
          </div>

          <button class="expand-btn" (click)="openDetail(); $event.stopPropagation()">
            <ion-icon name="chevron-up"></ion-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .mini-player {
        position: fixed;
        bottom: 56px; /* Above tab bar */
        left: 0;
        right: 0;
        background: var(--color-surface, #0a0a0a);
        border-top: 1px solid var(--color-border, #222);
        z-index: 999;
      }

      .progress-bar {
        position: relative;
        height: 3px;
        background: var(--color-border, #222);
      }

      .progress-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: var(--color-text-primary, #fff);
        transition: width 0.1s linear;
      }

      .progress-input {
        position: absolute;
        top: -6px;
        left: 0;
        width: 100%;
        height: 15px;
        opacity: 0;
        cursor: pointer;
        margin: 0;
      }

      .content {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        gap: 12px;
        cursor: pointer;
      }

      .info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .waveform-mini {
        flex-shrink: 0;
        width: 50px;
      }

      .text {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .title {
        font-weight: 500;
        font-size: 14px;
        color: var(--color-text-primary, #fff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .username {
        font-size: 13px;
        color: var(--color-text-secondary, #888);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .title + .username {
        font-size: 12px;
      }

      .time {
        font-size: 11px;
        color: var(--color-text-tertiary, #555);
      }

      .controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .control-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: transparent;
        border: none;
        color: var(--color-text-secondary, #888);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        ion-icon {
          font-size: 18px;
        }

        &:hover:not(.disabled) {
          color: var(--color-text-primary, #fff);
        }

        &.disabled {
          opacity: 0.3;
          cursor: default;
        }
      }

      .play-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--color-text-primary, #fff);
        border: none;
        color: var(--color-bg, #000);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        ion-icon {
          font-size: 20px;
        }
      }

      .expand-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: transparent;
        border: none;
        color: var(--color-text-secondary, #888);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        ion-icon {
          font-size: 20px;
        }

        &:hover {
          color: var(--color-text-primary, #fff);
        }
      }
    `,
  ],
})
export class MiniPlayerComponent {
  player = inject(PlayerService);
  private router = inject(Router);

  @Output() expandClick = new EventEmitter<void>();

  constructor() {
    addIcons({
      play,
      pause,
      playSkipBack,
      playSkipForward,
      chevronUp,
    });
  }

  onTogglePlay(): void {
    this.player.togglePlayPause();
  }

  onPrevious(): void {
    if (this.player.hasPrevious()) {
      this.player.previous();
    }
  }

  onNext(): void {
    if (this.player.hasNext()) {
      this.player.next();
    }
  }

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const percent = parseFloat(input.value);
    this.player.seekToPercent(percent);
  }

  openDetail(): void {
    const recording = this.player.currentRecording();
    if (recording) {
      this.router.navigate(['/recording', recording.id]);
    }
  }
}
