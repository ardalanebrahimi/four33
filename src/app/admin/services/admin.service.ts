import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';

export interface JoinRequest {
  id: string;
  email: string;
  username: string;
  reason: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: UserSummary | null;
  reviewNotes: string | null;
}

export interface UserSummary {
  id: string;
  username: string;
  followersCount: number;
  followingCount: number;
  recordingsCount: number;
  isFollowing: boolean | null;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  invitesRemaining: number;
  recordingsCount: number;
  followersCount: number;
  createdAt: string;
  invitedBy: UserSummary | null;
}

export interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  isExpired: boolean;
  isValid: boolean;
  createdBy: UserSummary;
  usedBy: UserSummary | null;
  usedAt: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalRecordings: number;
  pendingRequests: number;
  totalInviteCodes: number;
  usedInviteCodes: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = inject(ApiService);

  // Join requests
  getJoinRequests(status?: string, limit = 20, offset = 0): Observable<PaginatedResult<JoinRequest>> {
    const params: Record<string, string | number> = { limit, offset };
    if (status) params['status'] = status;
    return this.api.get<PaginatedResult<JoinRequest>>('admin/requests', params);
  }

  reviewRequest(id: string, approved: boolean, notes?: string): Observable<JoinRequest> {
    return this.api.post<JoinRequest>(`admin/requests/${id}/review`, { approved, notes });
  }

  // Users
  getUsers(search?: string, limit = 20, offset = 0): Observable<PaginatedResult<AdminUser>> {
    const params: Record<string, string | number> = { limit, offset };
    if (search) params['search'] = search;
    return this.api.get<PaginatedResult<AdminUser>>('admin/users', params);
  }

  updateUser(id: string, data: { isAdmin?: boolean; invitesRemaining?: number }): Observable<AdminUser> {
    return this.api.put<AdminUser>(`admin/users/${id}`, data);
  }

  // Invites
  getAllInvites(limit = 20, offset = 0): Observable<PaginatedResult<InviteCode>> {
    return this.api.get<PaginatedResult<InviteCode>>('admin/invites', { limit, offset });
  }

  generateAdminInvite(): Observable<InviteCode> {
    return this.api.post<InviteCode>('admin/invites');
  }

  // Stats
  getStats(): Observable<AdminStats> {
    return this.api.get<AdminStats>('admin/stats');
  }
}
