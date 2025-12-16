import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminStats } from '../services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-container">
      <aside class="sidebar">
        <div class="logo">
          <h1>4'33" Admin</h1>
        </div>
        <nav class="nav">
          <a routerLink="requests" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">&#128229;</span>
            Requests
            @if (stats()?.pendingRequests) {
              <span class="badge">{{ stats()?.pendingRequests }}</span>
            }
          </a>
          <a routerLink="users" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">&#128100;</span>
            Users
          </a>
          <a routerLink="invites" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">&#127881;</span>
            Invites
          </a>
        </nav>
        <div class="stats">
          @if (stats()) {
            <div class="stat">
              <span class="stat-value">{{ stats()?.totalUsers }}</span>
              <span class="stat-label">Users</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ stats()?.totalRecordings }}</span>
              <span class="stat-label">Recordings</span>
            </div>
          }
        </div>
        <a href="/" class="back-link">Back to App</a>
      </aside>
      <main class="main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-container {
      display: flex;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .sidebar {
      width: 240px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    .logo h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 24px 0;
      color: var(--color-text-primary);
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 14px;
      transition: all 0.15s ease;

      &:hover {
        background: var(--color-surface-elevated);
        color: var(--color-text-primary);
      }

      &.active {
        background: var(--color-surface-elevated);
        color: var(--color-text-primary);
      }
    }

    .nav-icon {
      font-size: 16px;
    }

    .badge {
      margin-left: auto;
      background: #ff6b6b;
      color: white;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .stats {
      margin-top: auto;
      display: flex;
      gap: 16px;
      padding: 16px;
      background: var(--color-surface-elevated);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: 11px;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
    }

    .back-link {
      text-align: center;
      color: var(--color-text-tertiary);
      text-decoration: none;
      font-size: 13px;
      padding: 12px;

      &:hover {
        color: var(--color-text-secondary);
      }
    }

    .main {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  private adminService = inject(AdminService);
  stats = signal<AdminStats | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {}
    });
  }
}
