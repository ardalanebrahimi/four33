import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { User, Recording, Activity } from '../models';
import { RecordingDto, UserSummaryDto, PaginatedResult } from './recordings-api.service';

export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  followersCount: number;
  followingCount: number;
  recordingsCount: number;
  isFollowing: boolean | null;
  createdAt: string;
}

export interface ActivityDto {
  id: string;
  type: 'like' | 'follow' | 'tag';
  user: UserSummaryDto;
  recording: RecordingDto | null;
  tag: string | null;
  createdAt: string;
  timeAgo: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private api = inject(ApiService);

  getCurrentUser(): Observable<User> {
    return this.api.get<UserProfileDto>('users/me').pipe(
      map(this.mapUser)
    );
  }

  getUser(id: string): Observable<User> {
    return this.api.get<UserProfileDto>(`users/${id}`).pipe(
      map(this.mapUser)
    );
  }

  getUserRecordings(userId: string, limit = 20, offset = 0): Observable<PaginatedResult<Recording>> {
    return this.api.get<PaginatedResult<RecordingDto>>(`users/${userId}/recordings`, { limit, offset }).pipe(
      map(result => ({
        ...result,
        items: result.items.map(this.mapRecording)
      }))
    );
  }

  getFollowers(userId: string, limit = 20, offset = 0): Observable<PaginatedResult<User>> {
    return this.api.get<PaginatedResult<UserSummaryDto>>(`users/${userId}/followers`, { limit, offset }).pipe(
      map(result => ({
        ...result,
        items: result.items.map(this.mapUserSummary)
      }))
    );
  }

  getFollowing(userId: string, limit = 20, offset = 0): Observable<PaginatedResult<User>> {
    return this.api.get<PaginatedResult<UserSummaryDto>>(`users/${userId}/following`, { limit, offset }).pipe(
      map(result => ({
        ...result,
        items: result.items.map(this.mapUserSummary)
      }))
    );
  }

  followUser(userId: string): Observable<{ following: boolean }> {
    return this.api.post(`users/${userId}/follow`);
  }

  unfollowUser(userId: string): Observable<{ following: boolean }> {
    return this.api.delete(`users/${userId}/follow`);
  }

  getActivity(limit = 20): Observable<Activity[]> {
    return this.api.get<ActivityDto[]>('users/me/activity', { limit }).pipe(
      map(activities => activities.map(this.mapActivity))
    );
  }

  updateUsername(username: string): Observable<User> {
    return this.api.put<UserProfileDto>('users/me', { username }).pipe(
      map(this.mapUser)
    );
  }

  private mapUser = (dto: UserProfileDto): User => ({
    id: dto.id,
    username: dto.username,
    followersCount: dto.followersCount,
    followingCount: dto.followingCount,
    recordingsCount: dto.recordingsCount,
    isFollowing: dto.isFollowing ?? undefined
  });

  private mapUserSummary = (dto: UserSummaryDto): User => ({
    id: dto.id,
    username: dto.username,
    followersCount: dto.followersCount,
    followingCount: dto.followingCount,
    recordingsCount: dto.recordingsCount,
    isFollowing: dto.isFollowing ?? undefined
  });

  private mapRecording = (dto: RecordingDto): Recording => ({
    id: dto.id,
    user: this.mapUserSummary(dto.user),
    movement: dto.movement as any,
    durationSeconds: dto.durationSeconds,
    audioUrl: dto.audioUrl,
    waveformData: dto.waveformData ?? [],
    tags: dto.tags.map(t => ({
      id: t.id,
      name: t.name,
      recordingCount: t.recordingCount ?? undefined,
      isFollowing: t.isFollowing ?? undefined,
      isOriginal: t.isOriginal
    })),
    title: dto.title ?? undefined,
    likesCount: dto.likesCount,
    isLiked: dto.isLiked,
    createdAt: new Date(dto.createdAt),
    timeAgo: dto.timeAgo
  });

  private mapActivity = (dto: ActivityDto): Activity => ({
    id: dto.id,
    type: dto.type,
    user: this.mapUserSummary(dto.user),
    recording: dto.recording ? this.mapRecording(dto.recording) : undefined,
    tag: dto.tag ?? undefined,
    createdAt: new Date(dto.createdAt),
    timeAgo: dto.timeAgo
  });
}
