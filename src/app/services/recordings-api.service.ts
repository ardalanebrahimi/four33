import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Recording, Tag, MovementId } from '../models';

export interface RecordingDto {
  id: string;
  user: UserSummaryDto;
  movement: string;
  durationSeconds: number;
  audioUrl: string;
  waveformData: number[] | null;
  tags: TagDto[];
  title: string | null;
  likesCount: number;
  playCount: number;
  isLiked: boolean;
  likedByUsers?: UserSummaryDto[];
  createdAt: string;
  timeAgo: string;
}

export interface UserSummaryDto {
  id: string;
  username: string;
  followersCount: number;
  followingCount: number;
  recordingsCount: number;
  isFollowing: boolean | null;
}

export interface TagDto {
  id: string;
  name: string;
  recordingCount: number | null;
  isFollowing: boolean | null;
  isOriginal: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface RecordingFilter {
  tag?: string;
  userId?: string;
  movement?: MovementId;
  following?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class RecordingsApiService {
  private api = inject(ApiService);

  getRecordings(filter?: RecordingFilter): Observable<PaginatedResult<Recording>> {
    return this.api.get<PaginatedResult<RecordingDto>>('recordings', filter as any).pipe(
      map(result => ({
        ...result,
        items: result.items.map(this.mapRecording)
      }))
    );
  }

  getRecording(id: string): Observable<Recording> {
    return this.api.get<RecordingDto>(`recordings/${id}`).pipe(
      map(this.mapRecording)
    );
  }

  createRecording(
    audioFile: Blob,
    movement: MovementId,
    durationSeconds: number,
    tags: string[],
    waveformData: number[],
    title?: string
  ): Observable<Recording> {
    const formData = new FormData();
    formData.append('audioFile', audioFile, 'recording.wav');
    formData.append('movement', movement);
    formData.append('durationSeconds', durationSeconds.toString());
    formData.append('tags', tags.join(','));
    formData.append('waveformData', JSON.stringify(waveformData));
    if (title) {
      formData.append('title', title);
    }

    return this.api.postForm<RecordingDto>('recordings', formData).pipe(
      map(this.mapRecording)
    );
  }

  deleteRecording(id: string): Observable<void> {
    return this.api.delete(`recordings/${id}`);
  }

  likeRecording(id: string): Observable<{ liked: boolean }> {
    return this.api.post(`recordings/${id}/like`);
  }

  unlikeRecording(id: string): Observable<{ liked: boolean }> {
    return this.api.delete(`recordings/${id}/like`);
  }

  addTag(recordingId: string, tagName: string): Observable<Tag> {
    return this.api.post<TagDto>(`recordings/${recordingId}/tags`, { tagName }).pipe(
      map(t => ({
        id: t.id,
        name: t.name,
        recordingCount: t.recordingCount ?? undefined,
        isFollowing: t.isFollowing ?? undefined,
        isOriginal: t.isOriginal
      }))
    );
  }

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
    movement: dto.movement as MovementId,
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
    likedByUsers: dto.likedByUsers?.map(u => ({
      id: u.id,
      username: u.username,
      followersCount: u.followersCount,
      followingCount: u.followingCount,
      recordingsCount: u.recordingsCount,
      isFollowing: u.isFollowing ?? undefined
    })),
    createdAt: new Date(dto.createdAt),
    timeAgo: dto.timeAgo
  });
}
