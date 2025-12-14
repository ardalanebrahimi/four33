import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Tag, Recording } from '../models';
import { RecordingDto, PaginatedResult } from './recordings-api.service';

export interface TagDetailDto {
  id: string;
  name: string;
  recordingCount: number;
  isFollowing: boolean;
  createdAt: string;
}

export interface TagListDto {
  id: string;
  name: string;
  recordingCount: number;
  isFollowing: boolean;
}

@Injectable({ providedIn: 'root' })
export class TagsApiService {
  private api = inject(ApiService);

  getTags(limit = 50, search?: string): Observable<Tag[]> {
    const params: Record<string, any> = { limit };
    if (search) params['search'] = search;

    return this.api.get<TagListDto[]>('tags', params).pipe(
      map(tags => tags.map(this.mapTag))
    );
  }

  getTag(name: string): Observable<Tag & { createdAt: Date }> {
    return this.api.get<TagDetailDto>(`tags/${encodeURIComponent(name)}`).pipe(
      map(t => ({
        ...this.mapTag(t),
        createdAt: new Date(t.createdAt)
      }))
    );
  }

  getTagRecordings(name: string, limit = 20, offset = 0): Observable<PaginatedResult<Recording>> {
    return this.api.get<PaginatedResult<RecordingDto>>(`tags/${encodeURIComponent(name)}/recordings`, { limit, offset }).pipe(
      map(result => ({
        ...result,
        items: result.items.map(this.mapRecording)
      }))
    );
  }

  followTag(name: string): Observable<{ following: boolean }> {
    return this.api.post(`tags/${encodeURIComponent(name)}/follow`);
  }

  unfollowTag(name: string): Observable<{ following: boolean }> {
    return this.api.delete(`tags/${encodeURIComponent(name)}/follow`);
  }

  getFollowedTags(): Observable<Tag[]> {
    return this.api.get<TagListDto[]>('tags/following').pipe(
      map(tags => tags.map(this.mapTag))
    );
  }

  private mapTag = (dto: TagListDto | TagDetailDto): Tag => ({
    id: dto.id,
    name: dto.name,
    recordingCount: dto.recordingCount,
    isFollowing: dto.isFollowing
  });

  private mapRecording = (dto: RecordingDto): Recording => ({
    id: dto.id,
    user: {
      id: dto.user.id,
      username: dto.user.username,
      followersCount: dto.user.followersCount,
      followingCount: dto.user.followingCount,
      recordingsCount: dto.user.recordingsCount,
      isFollowing: dto.user.isFollowing ?? undefined
    },
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
    playCount: dto.playCount ?? 0,
    isLiked: dto.isLiked,
    createdAt: new Date(dto.createdAt),
    timeAgo: dto.timeAgo
  });
}
