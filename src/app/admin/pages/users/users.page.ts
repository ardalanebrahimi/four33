import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Users</h2>
        <input
          type="text"
          class="search-input"
          placeholder="Search users..."
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
        />
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (users().length === 0) {
        <div class="empty">No users found</div>
      } @else {
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Recordings</th>
                <th>Followers</th>
                <th>Invites</th>
                <th>Admin</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <a [href]="'/user/' + user.id" class="username-link">
                      {{ user.username }}
                    </a>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.recordingsCount }}</td>
                  <td>{{ user.followersCount }}</td>
                  <td>{{ user.invitesRemaining }}</td>
                  <td>
                    @if (user.isAdmin) {
                      <span class="admin-badge">Admin</span>
                    }
                  </td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <button class="btn edit" (click)="openEditModal(user)">Edit</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (hasMore()) {
          <button class="load-more" (click)="loadMore()">Load More</button>
        }
      }

      <!-- Edit Modal -->
      @if (editingUser()) {
        <div class="modal-overlay" (click)="cancelEdit()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Edit User</h3>
            <p class="user-info">{{ editingUser()?.username }} ({{ editingUser()?.email }})</p>

            <div class="form-group">
              <label>Invites Remaining</label>
              <input
                type="number"
                class="form-input"
                [(ngModel)]="editInvites"
                min="0"
              />
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="editIsAdmin"
                />
                Admin privileges
              </label>
            </div>

            <div class="modal-actions">
              <button class="btn secondary" (click)="cancelEdit()">Cancel</button>
              <button class="btn primary" (click)="saveEdit()">Save</button>
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

    .search-input {
      padding: 10px 16px;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-primary);
      font-size: 14px;
      width: 250px;

      &::placeholder {
        color: var(--color-text-tertiary);
      }

      &:focus {
        outline: none;
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

    .username-link {
      color: var(--color-text-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .admin-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #7950f233;
      color: #7950f2;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;

      &.edit {
        background: var(--color-surface-elevated);
        color: var(--color-text-secondary);

        &:hover {
          color: var(--color-text-primary);
        }
      }

      &.secondary {
        background: var(--color-surface-elevated);
        color: var(--color-text-secondary);
      }

      &.primary {
        background: var(--color-text-primary);
        color: var(--color-bg);
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

      .user-info {
        color: var(--color-text-secondary);
        margin: 0 0 24px;
        font-size: 14px;
      }
    }

    .form-group {
      margin-bottom: 16px;

      label {
        display: block;
        font-size: 12px;
        text-transform: uppercase;
        color: var(--color-text-tertiary);
        margin-bottom: 8px;
      }
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      color: var(--color-text-primary);
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: var(--color-border-light);
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: var(--color-text-primary);
      cursor: pointer;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #7950f2;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
  `]
})
export class UsersPage implements OnInit {
  private adminService = inject(AdminService);

  users = signal<AdminUser[]>([]);
  loading = signal(false);
  hasMore = signal(false);
  searchQuery = '';

  editingUser = signal<AdminUser | null>(null);
  editInvites = 0;
  editIsAdmin = false;

  private offset = 0;
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadUsers();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.offset = 0;
      this.users.set([]);
      this.loadUsers();
    }, 300);
  }

  loadMore(): void {
    this.loadUsers(true);
  }

  openEditModal(user: AdminUser): void {
    this.editingUser.set(user);
    this.editInvites = user.invitesRemaining;
    this.editIsAdmin = user.isAdmin;
  }

  cancelEdit(): void {
    this.editingUser.set(null);
  }

  saveEdit(): void {
    const user = this.editingUser();
    if (!user) return;

    this.adminService.updateUser(user.id, {
      invitesRemaining: this.editInvites,
      isAdmin: this.editIsAdmin
    }).subscribe({
      next: (updated) => {
        this.users.update(list =>
          list.map(u => u.id === updated.id ? updated : u)
        );
        this.editingUser.set(null);
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

  private loadUsers(append = false): void {
    if (!append) {
      this.loading.set(true);
      this.offset = 0;
    }

    this.adminService.getUsers(this.searchQuery || undefined, 20, this.offset)
      .subscribe({
        next: (result) => {
          if (append) {
            this.users.update(list => [...list, ...result.items]);
          } else {
            this.users.set(result.items);
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
