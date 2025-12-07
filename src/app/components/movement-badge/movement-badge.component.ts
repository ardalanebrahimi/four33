import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovementId } from '../../models';

@Component({
  selector: 'app-movement-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class.small]="small">
      <span class="icon">○</span>
      <span class="label">{{ label }}</span>
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: var(--color-surface-elevated, #1a1a1a);
        border: 1px solid var(--color-border, #222);
        border-radius: 16px;
        font-size: 12px;
        color: var(--color-text-secondary, #888);
      }

      .badge.small {
        padding: 2px 8px;
        font-size: 10px;
      }

      .icon {
        font-size: 8px;
      }
    `,
  ],
})
export class MovementBadgeComponent {
  @Input() movement!: MovementId;
  @Input() small: boolean = false;

  get label(): string {
    const labels: Record<MovementId, string> = {
      I: '30"',
      II: "2'23\"",
      III: "1'40\"",
      FULL: "4'33\"",
    };
    return labels[this.movement] || '';
  }
}
