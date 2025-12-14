import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  Recording,
  PopularTag,
  PopularUser,
  TrendDataPoint,
  RecordingTrends,
  PlatformTrends,
  OverviewStats,
  AnalyticsPeriod,
  MovementId
} from '../models';
import { RecordingDto, UserSummaryDto, TagDto } from './recordings-api.service';

// Response DTOs from backend
interface PopularRecordingDto extends RecordingDto {}

interface PopularTagDto {
  id: string;
  name: string;
  recordingCount: number;
  playCount: number;
  isFollowing: boolean;
}

interface PopularUserDto {
  id: string;
  username: string;
  avatarUrl: string | null;
  recordingsCount: number;
  totalPlays: number;
  followersCount: number;
  isFollowing: boolean;
}

interface TrendDataPointDto {
  date: string;
  count: number;
}

interface RecordingTrendsDto {
  recordingId: string;
  title: string | null;
  totalPlays: number;
  dailyPlays: TrendDataPointDto[];
}

interface PlatformTrendsDto {
  dailyPlays: TrendDataPointDto[];
  dailyRecordings: TrendDataPointDto[];
  dailyUsers: TrendDataPointDto[];
}

interface OverviewStatsDto {
  totalRecordings: number;
  totalPlays: number;
  totalUsers: number;
  totalTags: number;
  playsToday: number;
  playsThisWeek: number;
  playsThisMonth: number;
  newRecordingsToday: number;
  newRecordingsThisWeek: number;
  newUsersThisWeek: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private api = inject(ApiService);

  // ==================== TRACKING ====================

  trackPlay(recordingId: string, durationListened: number, completedPercent: number, source?: string): Observable<{ success: boolean; playCount: number }> {
    return this.api.post('analytics/play', {
      recordingId,
      durationListened,
      completedPercent,
      source
    });
  }

  trackView(pageType: string, pageId: string, source?: string): Observable<{ success: boolean }> {
    return this.api.post('analytics/view', {
      pageType,
      pageId,
      source
    });
  }

  trackSearch(query: string, resultsCount: number, clickedResultId?: string): Observable<{ success: boolean }> {
    return this.api.post('analytics/search', {
      query,
      resultsCount,
      clickedResultId
    });
  }

  // ==================== POPULAR ====================

  getPopularRecordings(period: AnalyticsPeriod = 'week', limit = 10): Observable<Recording[]> {
    return this.api.get<PopularRecordingDto[]>('analytics/popular/recordings', { period, limit }).pipe(
      map(recordings => recordings.map(this.mapRecording))
    );
  }

  getPopularTags(period: AnalyticsPeriod = 'week', limit = 10): Observable<PopularTag[]> {
    return this.api.get<PopularTagDto[]>('analytics/popular/tags', { period, limit }).pipe(
      map(tags => tags.map(t => ({
        id: t.id,
        name: t.name,
        recordingCount: t.recordingCount,
        playCount: t.playCount,
        isFollowing: t.isFollowing
      })))
    );
  }

  getPopularUsers(period: AnalyticsPeriod = 'week', limit = 10): Observable<PopularUser[]> {
    return this.api.get<PopularUserDto[]>('analytics/popular/users', { period, limit }).pipe(
      map(users => users.map(u => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl ?? undefined,
        recordingsCount: u.recordingsCount,
        totalPlays: u.totalPlays,
        followersCount: u.followersCount,
        isFollowing: u.isFollowing
      })))
    );
  }

  // ==================== TRENDS ====================

  getRecordingTrends(recordingId: string, period: AnalyticsPeriod = 'month'): Observable<RecordingTrends> {
    return this.api.get<RecordingTrendsDto>(`analytics/trends/recording/${recordingId}`, { period }).pipe(
      map(dto => ({
        recordingId: dto.recordingId,
        title: dto.title ?? undefined,
        totalPlays: dto.totalPlays,
        dailyPlays: dto.dailyPlays.map(this.mapTrendDataPoint)
      }))
    );
  }

  getPlatformTrends(period: AnalyticsPeriod = 'month'): Observable<PlatformTrends> {
    return this.api.get<PlatformTrendsDto>('analytics/trends/platform', { period }).pipe(
      map(dto => ({
        dailyPlays: dto.dailyPlays.map(this.mapTrendDataPoint),
        dailyRecordings: dto.dailyRecordings.map(this.mapTrendDataPoint),
        dailyUsers: dto.dailyUsers.map(this.mapTrendDataPoint)
      }))
    );
  }

  getOverviewStats(): Observable<OverviewStats> {
    return this.api.get<OverviewStatsDto>('analytics/overview').pipe(
      map(dto => ({
        totalRecordings: dto.totalRecordings,
        totalPlays: dto.totalPlays,
        totalUsers: dto.totalUsers,
        totalTags: dto.totalTags,
        playsToday: dto.playsToday,
        playsThisWeek: dto.playsThisWeek,
        playsThisMonth: dto.playsThisMonth,
        newRecordingsToday: dto.newRecordingsToday,
        newRecordingsThisWeek: dto.newRecordingsThisWeek,
        newUsersThisWeek: dto.newUsersThisWeek
      }))
    );
  }

  // ==================== MAPPERS ====================

  private mapTrendDataPoint = (dto: TrendDataPointDto): TrendDataPoint => ({
    date: new Date(dto.date),
    count: dto.count
  });

  private mapRecording = (dto: PopularRecordingDto): Recording => ({
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
    createdAt: new Date(dto.createdAt),
    timeAgo: dto.timeAgo
  });
}
