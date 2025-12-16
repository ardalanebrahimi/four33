import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse } from './auth.service';

export interface JoinRequestSubmission {
  email: string;
  username: string;
  password: string;
  reason: string;
}

export interface JoinRequestStatus {
  status: string;
  inviteCode: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  isExpired: boolean;
  isValid: boolean;
  usedBy: { id: string; username: string } | null;
  usedAt: string | null;
}

export interface RegisterWithInviteRequest {
  inviteCode: string;
  username: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class InviteService {
  private api = inject(ApiService);

  // Submit a join request
  submitJoinRequest(data: JoinRequestSubmission): Observable<any> {
    return this.api.post('invites/request', data);
  }

  // Check status of a join request
  checkRequestStatus(email: string): Observable<JoinRequestStatus> {
    return this.api.get<JoinRequestStatus>('invites/request/status', { email });
  }

  // Validate an invite code
  validateInviteCode(code: string): Observable<{ valid: boolean; message?: string }> {
    return this.api.get<{ valid: boolean; message?: string }>(`invites/validate/${code}`);
  }

  // Register with an invite code
  registerWithInvite(data: RegisterWithInviteRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('invites/register', data);
  }

  // Get current user's invite codes
  getMyInviteCodes(): Observable<InviteCode[]> {
    return this.api.get<InviteCode[]>('invites/codes');
  }

  // Generate a new invite code
  generateInviteCode(): Observable<InviteCode> {
    return this.api.post<InviteCode>('invites/codes');
  }
}
