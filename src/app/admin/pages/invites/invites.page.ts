import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, InviteCode } from '../../services/admin.service';

@Component({
  selector: 'app-invites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Invite Codes</h2>
        <button class="btn primary" (click)="generateInvite()">
          Generate Admin Invite
        </button>
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (invites().length === 0) {
        <div class="empty">No invite codes yet</div>
      } @else {
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Used By</th>
                <th>Created</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              @for (invite of invites(); track invite.id) {
                <tr [class.used]="invite.isUsed" [class.expired]="invite.isExpired">
                  <td>
                    <code class="code" (click)="copyCode(invite.code)">
                      {{ invite.code }}
                    </code>
                  </td>
                  <td>
                    <a [href]="'/user/' + invite.createdBy.id" class="user-link">
                      {{ invite.createdBy.username }}
                    </a>
                  </td>
                  <td>
                    <span class="status" [class]="getStatus(invite)">
                      {{ getStatus(invite) }}
                    </span>
                  </td>
                  <td>
                    @if (invite.usedBy) {
                      <a [href]="'/user/' + invite.usedBy.id" class="user-link">
                        {{ invite.usedBy.username }}
                      </a>
                    } @else {
                      <span class="no-value">-</span>
                    }
                  </td>
                  <td>{{ formatDate(invite.createdAt) }}</td>
                  <td>{{ formatDate(invite.expiresAt) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (hasMore()) {
          <button class="load-more" (click)="loadMore()">Load More</button>
        }
      }

      @if (copiedCode()) {
        <div class="toast">
          Copied {{ copiedCode() }} to clipboard
        </div>
      }

      @if (generatedCode()) {
        <div class="modal-overlay" (click)="closeGenerated()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Invite Code Generated</h3>
            <p>Share this code with someone to invite them:</p>
            <code class="generated-code" (click)="copyCode(generatedCode()!)">
              {{ generatedCode() }}
            </code>
            <p class="hint">Click to copy</p>
            <button class="btn primary" (click)="closeGenerated()">Done</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      max-width: 1200px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;

      &.primary {
        background: var(--color-text-primary);
        color: var(--color-bg);
      }
    }

    .loading, .empty {
      text-align: center;
      padding: 48px;
      color: var(--color-text-tertiary);
    }

    .table-container {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    th {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--color-text-tertiary);
      font-weight: 500;
    }

    td {
      font-size: 14px;
      color: var(--color-text-primary);
    }

    tr.used td {
      opacity: 0.5;
    }

    tr.expired:not(.used) td {
      opacity: 0.7;
    }

    .code {
      font-family: monospace;
      font-size: 14px;
      background: var(--color-surface-elevated);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      letter-spacing: 1px;

      &:hover {
        background: var(--color-surface);
      }
    }

    .user-link {
      color: var(--color-text-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .no-value {
      color: var(--color-text-tertiary);
    }

    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      &.valid {
        background: #40c05733;
        color: #40c057;
      }
      &.used {
        background: var(--color-surface-elevated);
        color: var(--color-text-tertiary);
      }
      &.expired {
        background: #ff6b6b33;
        color: #ff6b6b;
      }
    }

    .load-more {
      display: block;
      margin: 24px auto;
      padding: 12px 24px;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-secondary);
      cursor: pointer;

      &:hover {
        color: var(--color-text-primary);
      }
    }

    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      animation: fadeInOut 2s ease;
    }

    @keyframes fadeInOut {
      0% { opacity: 0; transform: translate(-50%, 20px); }
      10% { opacity: 1; transform: translate(-50%, 0); }
      90% { opacity: 1; transform: translate(-50%, 0); }
      100% { opacity: 0; transform: translate(-50%, -10px); }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--color-surface);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      max-width: 90%;

      h3 {
        margin: 0 0 12px;
        font-size: 20px;
      }

      p {
        color: var(--color-text-secondary);
        margin: 0 0 16px;
      }

      .generated-code {
        display: block;
        font-size: 28px;
        letter-spacing: 3px;
        padding: 16px 24px;
        background: var(--color-surface-elevated);
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;

        &:hover {
          background: var(--color-bg);
        }
      }

      .hint {
        font-size: 12px;
        color: var(--color-text-tertiary);
        margin-bottom: 24px;
      }
    }
  `]
})
export class InvitesPage implements OnInit {
  private adminService = inject(AdminService);

  invites = signal<InviteCode[]>([]);
  loading = signal(false);
  hasMore = signal(false);
  copiedCode = signal<string | null>(null);
  generatedCode = signal<string | null>(null);

  private offset = 0;

  ngOnInit(): void {
    this.loadInvites();
  }

  loadMore(): void {
    this.loadInvites(true);
  }

  generateInvite(): void {
    this.adminService.generateAdminInvite().subscribe({
      next: (invite) => {
        this.generatedCode.set(invite.code);
        this.invites.update(list => [invite, ...list]);
      },
      error: () => {}
    });
  }

  closeGenerated(): void {
    this.generatedCode.set(null);
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.copiedCode.set(code);
    setTimeout(() => this.copiedCode.set(null), 2000);
  }

  getStatus(invite: InviteCode): string {
    if (invite.isUsed) return 'used';
    if (invite.isExpired) return 'expired';
    return 'valid';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private loadInvites(append = false): void {
    if (!append) {
      this.loading.set(true);
      this.offset = 0;
    }

    this.adminService.getAllInvites(20, this.offset).subscribe({
      next: (result) => {
        if (append) {
          this.invites.update(list => [...list, ...result.items]);
        } else {
          this.invites.set(result.items);
        }
        this.hasMore.set(result.hasMore);
        this.offset += result.items.length;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
