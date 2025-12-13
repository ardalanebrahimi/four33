import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.fullscreen]="fullscreen">
      <div class="waveform-loader">
        @for (bar of bars; track bar) {
          <div
            class="bar"
            [style.animation-delay.ms]="bar * 120"
            [style.height.%]="getBarHeight(bar)"
          ></div>
        }
      </div>
      @if (text) {
        <p class="loading-text">{{ text }}</p>
      }
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
    }

    .loading-container.fullscreen {
      min-height: 50vh;
    }

    .waveform-loader {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      height: 40px;
    }

    .bar {
      width: 3px;
      background: var(--color-text-primary, #fff);
      border-radius: 2px;
      animation: pulse 1.2s ease-in-out infinite;
      opacity: 0.4;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scaleY(0.3);
        opacity: 0.3;
      }
      50% {
        transform: scaleY(1);
        opacity: 1;
      }
    }

    .loading-text {
      font-size: 12px;
      color: var(--color-text-tertiary, #555);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
      animation: fade 2s ease-in-out infinite;
    }

    @keyframes fade {
      0%, 100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }
  `]
})
export class LoadingComponent {
  @Input() text?: string;
  @Input() barCount = 7;
  @Input() fullscreen = true;

  get bars(): number[] {
    return Array.from({ length: this.barCount }, (_, i) => i);
  }

  getBarHeight(index: number): number {
    // Create varied heights for more organic waveform look
    const heights = [40, 70, 55, 100, 55, 70, 40];
    return heights[index % heights.length];
  }
}
