import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, JoinRequest } from '../../services/admin.service';

@Component({
  selector: 'app-join-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Join Requests</h2>
        <div class="tabs">
          @for (tab of tabs; track tab.value) {
            <button
              class="tab"
              [class.active]="statusFilter() === tab.value"
              (click)="setFilter(tab.value)"
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (requests().length === 0) {
        <div class="empty">No requests found</div>
      } @else {
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (request of requests(); track request.id) {
                <tr [class.expanded]="expandedId() === request.id">
                  <td>{{ request.email }}</td>
                  <td>{{ request.username }}</td>
                  <td class="reason-cell">
                    <button class="reason-toggle" (click)="toggleExpand(request.id)">
                      {{ request.reason.length > 50 ? request.reason.slice(0, 50) + '...' : request.reason }}
                    </button>
                  </td>
                  <td>
                    <span class="status" [class]="request.status.toLowerCase()">
                      {{ request.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(request.createdAt) }}</td>
                  <td>
                    @if (request.status === 'Pending') {
                      <div class="actions">
                        <button class="btn approve" (click)="review(request, true)">Approve</button>
                        <button class="btn reject" (click)="review(request, false)">Reject</button>
                      </div>
                    } @else {
                      <span class="reviewed-by">
                        @if (request.reviewedBy) {
                          by {{ request.reviewedBy.username }}
                        }
                      </span>
                    }
                  </td>
                </tr>
                @if (expandedId() === request.id) {
                  <tr class="expanded-row">
                    <td colspan="6">
                      <div class="expanded-content">
                        <strong>Full reason:</strong>
                        <p>{{ request.reason }}</p>
                        @if (request.reviewNotes) {
                          <strong>Review notes:</strong>
                          <p>{{ request.reviewNotes }}</p>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        @if (hasMore()) {
          <button class="load-more" (click)="loadMore()">Load More</button>
        }
      }

      <!-- Review Modal -->
      @if (reviewingRequest()) {
        <div class="modal-overlay" (click)="cancelReview()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>{{ reviewApprove() ? 'Approve' : 'Reject' }} Request</h3>
            <p>{{ reviewingRequest()?.email }}</p>
            <textarea
              class="notes-input"
              placeholder="Notes (optional)"
              [(ngModel)]="reviewNotes"
            ></textarea>
            <div class="modal-actions">
              <button class="btn secondary" (click)="cancelReview()">Cancel</button>
              <button
                class="btn"
                [class.approve]="reviewApprove()"
                [class.reject]="!reviewApprove()"
                (click)="confirmReview()"
              >
                {{ reviewApprove() ? 'Approve' : 'Reject' }}
              </button>
            </div>
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

    .tabs {
      display: flex;
      gap: 8px;
    }

    .tab {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      color: var(--color-text-secondary);
      font-size: 13px;
      cursor: pointer;

      &.active {
        background: var(--color-surface-elevated);
        color: var(--color-text-primary);
        border-color: var(--color-border-light);
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

    .reason-cell {
      max-width: 300px;
    }

    .reason-toggle {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      text-align: left;
      font-size: 13px;

      &:hover {
        color: var(--color-text-primary);
      }
    }

    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      &.pending {
        background: #ffd43b33;
        color: #ffd43b;
      }
      &.approved {
        background: #40c05733;
        color: #40c057;
      }
      &.rejected {
        background: #ff6b6b33;
        color: #ff6b6b;
      }
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;

      &.approve {
        background: #40c057;
        color: white;
      }
      &.reject {
        background: #ff6b6b;
        color: white;
      }
      &.secondary {
        background: var(--color-surface-elevated);
        color: var(--color-text-secondary);
      }
    }

    .reviewed-by {
      font-size: 12px;
      color: var(--color-text-tertiary);
    }

    .expanded-row td {
      padding: 0;
      border-bottom: none;
    }

    .expanded-content {
      padding: 16px 24px;
      background: var(--color-surface);
      border-radius: 8px;
      margin: 8px 16px 16px;

      strong {
        font-size: 12px;
        text-transform: uppercase;
        color: var(--color-text-tertiary);
      }

      p {
        margin: 8px 0 16px;
        color: var(--color-text-primary);
        white-space: pre-wrap;
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
      padding: 24px;
      width: 400px;
      max-width: 90%;

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
      }

      p {
        color: var(--color-text-secondary);
        margin: 0 0 16px;
      }
    }

    .notes-input {
      width: 100%;
      height: 100px;
      padding: 12px;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-primary);
      font-size: 14px;
      resize: none;
      margin-bottom: 16px;

      &::placeholder {
        color: var(--color-text-tertiary);
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class JoinRequestsPage implements OnInit {
  private adminService = inject(AdminService);

  tabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  requests = signal<JoinRequest[]>([]);
  loading = signal(false);
  hasMore = signal(false);
  statusFilter = signal('');
  expandedId = signal<string | null>(null);

  reviewingRequest = signal<JoinRequest | null>(null);
  reviewApprove = signal(false);
  reviewNotes = '';

  private offset = 0;

  ngOnInit(): void {
    this.loadRequests();
  }

  setFilter(status: string): void {
    this.statusFilter.set(status);
    this.offset = 0;
    this.requests.set([]);
    this.loadRequests();
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  loadMore(): void {
    this.loadRequests(true);
  }

  review(request: JoinRequest, approve: boolean): void {
    this.reviewingRequest.set(request);
    this.reviewApprove.set(approve);
    this.reviewNotes = '';
  }

  cancelReview(): void {
    this.reviewingRequest.set(null);
  }

  confirmReview(): void {
    const request = this.reviewingRequest();
    if (!request) return;

    this.adminService.reviewRequest(request.id, this.reviewApprove(), this.reviewNotes || undefined)
      .subscribe({
        next: (updated) => {
          this.requests.update(list =>
            list.map(r => r.id === updated.id ? updated : r)
          );
          this.reviewingRequest.set(null);
        },
        error: () => {}
      });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private loadRequests(append = false): void {
    if (!append) {
      this.loading.set(true);
      this.offset = 0;
    }

    this.adminService.getJoinRequests(this.statusFilter() || undefined, 20, this.offset)
      .subscribe({
        next: (result) => {
          if (append) {
            this.requests.update(list => [...list, ...result.items]);
          } else {
            this.requests.set(result.items);
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
