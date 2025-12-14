import { Injectable, inject } from '@angular/core';
import { AnalyticsApiService } from './analytics-api.service';
import { Recording } from '../models';

export type PageType = 'recording' | 'tag' | 'user';
export type PlaySource = 'explore' | 'detail' | 'profile' | 'tag' | 'trends';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private analyticsApi = inject(AnalyticsApiService);

  // Track currently playing recording to calculate duration
  private playStartTime: number | null = null;
  private currentPlayingId: string | null = null;

  /**
   * Track when playback starts
   */
  trackPlayStart(recording: Recording, source: PlaySource = 'explore'): void {
    // If there was a previous recording playing, track its completion first
    if (this.currentPlayingId && this.currentPlayingId !== recording.id) {
      this.trackPlayEnd(this.currentPlayingId, 0); // Unknown completion
    }

    this.playStartTime = Date.now();
    this.currentPlayingId = recording.id;

    // Fire and forget - don't block UI
    this.analyticsApi.trackPlay(
      recording.id,
      0, // Will be updated on end
      0, // Will be updated on end
      source
    ).subscribe({
      error: () => {} // Silently fail analytics
    });
  }

  /**
   * Track when playback ends or is stopped
   */
  trackPlayEnd(recordingId: string, completedPercent: number): void {
    if (!this.playStartTime || this.currentPlayingId !== recordingId) {
      return;
    }

    const durationListened = Math.floor((Date.now() - this.playStartTime) / 1000);

    // Only track if they listened for at least 1 second
    if (durationListened >= 1) {
      this.analyticsApi.trackPlay(
        recordingId,
        durationListened,
        Math.round(completedPercent),
        'detail'
      ).subscribe({
        error: () => {} // Silently fail analytics
      });
    }

    this.playStartTime = null;
    this.currentPlayingId = null;
  }

  /**
   * Track page view
   */
  trackView(pageType: PageType, pageId: string, source?: string): void {
    this.analyticsApi.trackView(pageType, pageId, source).subscribe({
      error: () => {} // Silently fail analytics
    });
  }

  /**
   * Track search query
   */
  trackSearch(query: string, resultsCount: number, clickedResultId?: string): void {
    if (query.trim().length < 2) return; // Don't track very short queries

    this.analyticsApi.trackSearch(query, resultsCount, clickedResultId).subscribe({
      error: () => {} // Silently fail analytics
    });
  }
}
