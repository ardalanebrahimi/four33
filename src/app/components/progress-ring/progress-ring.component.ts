import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-ring" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size">
        <!-- Background circle -->
        <circle
          class="bg"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
        />
        <!-- Progress circle -->
        <circle
          class="progress"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
        />
      </svg>
      <div class="content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .progress-ring {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      svg {
        position: absolute;
        transform: rotate(-90deg);
      }

      circle {
        fill: none;
      }

      circle.bg {
        stroke: var(--color-border, #222);
      }

      circle.progress {
        stroke: var(--color-text-primary, #fff);
        transition: stroke-dashoffset 0.1s linear;
      }

      .content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }
    `,
  ],
})
export class ProgressRingComponent {
  @Input() progress: number = 0; // 0-100
  @Input() size: number = 200;
  @Input() strokeWidth: number = 4;

  get center(): number {
    return this.size / 2;
  }

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get dashOffset(): number {
    return this.circumference * (1 - this.progress / 100);
  }
}
