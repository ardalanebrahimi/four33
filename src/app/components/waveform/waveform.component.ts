import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-waveform',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="waveform" [style.height.px]="height" [style.gap.px]="gap">
      @for (bar of displayBars; track $index) {
        <div
          class="bar"
          [style.height.px]="bar"
          [style.width.px]="barWidth"
          [class.active]="($index / displayBars.length) * 100 < progress"
          [class.live]="live"
        ></div>
      }
    </div>
  `,
  styles: [
    `
      .waveform {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      .bar {
        background: var(--color-border-light, #333);
        border-radius: 2px;
        transition: height 0.1s ease-out;
        flex-shrink: 0;
      }

      .bar.active {
        background: var(--color-text-primary, #fff);
      }

      .bar.live {
        background: var(--color-text-secondary, #888);
      }

      .bar.live.active {
        background: var(--color-text-primary, #fff);
      }
    `,
  ],
})
export class WaveformComponent {
  @Input() data: number[] = [];
  @Input() progress: number = 0;
  @Input() height: number = 60;
  @Input() barWidth: number = 3;
  @Input() gap: number = 2;
  @Input() barCount: number = 40;
  @Input() live: boolean = false;

  get displayBars(): number[] {
    if (this.data.length === 0) {
      return Array(this.barCount).fill(10);
    }

    // If we have data, normalize to barCount
    if (this.data.length === this.barCount) {
      return this.data.map((v) => this.scaleValue(v));
    }

    // Resample to barCount
    const result: number[] = [];
    const step = this.data.length / this.barCount;
    for (let i = 0; i < this.barCount; i++) {
      const start = Math.floor(i * step);
      const end = Math.min(Math.floor((i + 1) * step), this.data.length);
      if (end > start) {
        const slice = this.data.slice(start, end);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        result.push(this.scaleValue(avg));
      } else {
        result.push(10);
      }
    }
    return result;
  }

  private scaleValue(value: number): number {
    // Scale value from 0-100 range to height range
    const minHeight = 8;
    const maxHeight = this.height - 10;
    return minHeight + (value / 100) * (maxHeight - minHeight);
  }
}
