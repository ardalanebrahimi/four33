import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tag-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="chip"
      [class.selected]="selected"
      [class.removable]="removable"
      [class.addable]="addable"
      (click)="handleClick($event)"
    >
      <span class="name">{{ name }}</span>
      @if (removable) {
        <span class="remove" (click)="handleRemove($event)">×</span>
      }
      @if (addable && !selected) {
        <span class="add">+</span>
      }
      @if (selected && !removable) {
        <span class="check">✓</span>
      }
    </button>
  `,
  styles: [
    `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: var(--color-surface-elevated, #1a1a1a);
        border: 1px solid var(--color-border, #222);
        border-radius: 20px;
        color: var(--color-text-secondary, #888);
        font-size: 14px;
        cursor: pointer;
        transition: all var(--duration-fast, 150ms) ease;
      }

      .chip:hover {
        border-color: var(--color-border-light, #333);
      }

      .chip.selected {
        background: var(--color-text-primary, #fff);
        border-color: var(--color-text-primary, #fff);
        color: var(--color-bg, #000);
      }

      .chip.removable {
        padding-right: 10px;
      }

      .remove {
        font-size: 16px;
        line-height: 1;
        opacity: 0.7;
      }

      .remove:hover {
        opacity: 1;
      }

      .add,
      .check {
        font-size: 12px;
        opacity: 0.7;
      }

      .check {
        opacity: 1;
      }
    `,
  ],
})
export class TagChipComponent {
  @Input() name: string = '';
  @Input() selected: boolean = false;
  @Input() removable: boolean = false;
  @Input() addable: boolean = false;
  @Output() chipClick = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  handleClick(event: Event): void {
    if (!this.removable) {
      this.chipClick.emit(this.name);
    }
  }

  handleRemove(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.name);
  }
}
