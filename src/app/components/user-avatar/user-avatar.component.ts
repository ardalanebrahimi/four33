import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="avatar"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="size * 0.4"
    >
      {{ initial }}
    </div>
  `,
  styles: [
    `
      .avatar {
        border-radius: 50%;
        background: var(--color-surface-elevated, #1a1a1a);
        border: 1px solid var(--color-border, #222);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary, #888);
        text-transform: uppercase;
        font-weight: 500;
        flex-shrink: 0;
      }
    `,
  ],
})
export class UserAvatarComponent {
  @Input() username: string = '';
  @Input() size: number = 48;

  get initial(): string {
    return this.username.charAt(0).toUpperCase();
  }
}
