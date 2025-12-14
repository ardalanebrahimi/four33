export type MovementId = 'I' | 'II' | 'III' | 'FULL';

export interface Movement {
  id: MovementId;
  name: string;
  duration: number; // seconds
  label: string; // display string e.g. "2'23""
  description: string;
}

export const MOVEMENTS: Record<MovementId, Movement> = {
  I: { id: 'I', name: 'I', duration: 30, label: '30"', description: 'Tacet' },
  II: {
    id: 'II',
    name: 'II',
    duration: 143,
    label: "2'23\"",
    description: 'Tacet',
  },
  III: {
    id: 'III',
    name: 'III',
    duration: 100,
    label: "1'40\"",
    description: 'Tacet',
  },
  FULL: {
    id: 'FULL',
    name: 'Complete',
    duration: 273,
    label: "4'33\"",
    description: 'All movements',
  },
};

export interface User {
  id: string;
  username: string;
  followersCount: number;
  followingCount: number;
  recordingsCount: number;
  isFollowing?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  recordingCount?: number;
  isFollowing?: boolean;
  isOriginal?: boolean;
}

export interface Recording {
  id: string;
  user: User;
  movement: MovementId;
  durationSeconds: number;
  audioUrl: string;
  waveformData: number[];
  tags: Tag[];
  title?: string;
  likesCount: number;
  playCount: number;
  isLiked: boolean;
  likedByUsers?: User[];
  createdAt: Date;
  timeAgo: string;
}

export interface Activity {
  id: string;
  type: 'like' | 'follow' | 'tag';
  user: User;
  recording?: Recording;
  tag?: string;
  createdAt: Date;
  timeAgo: string;
}

export interface RecordingDraft {
  movement: MovementId | null;
  audioBlob: Blob | null;
  waveformData: number[];
  tags: string[];
  title: string | null;
}

export type RecordingPhase =
  | 'selecting'
  | 'ready'
  | 'recording'
  | 'recorded'
  | 'tagging'
  | 'uploading';

// Analytics models
export interface PopularRecording extends Recording {
  // Same as Recording, playCount already included
}

export interface PopularTag {
  id: string;
  name: string;
  recordingCount: number;
  playCount: number;
  isFollowing: boolean;
}

export interface PopularUser {
  id: string;
  username: string;
  avatarUrl?: string;
  recordingsCount: number;
  totalPlays: number;
  followersCount: number;
  isFollowing: boolean;
}

export interface TrendDataPoint {
  date: Date;
  count: number;
}

export interface RecordingTrends {
  recordingId: string;
  title?: string;
  totalPlays: number;
  dailyPlays: TrendDataPoint[];
}

export interface PlatformTrends {
  dailyPlays: TrendDataPoint[];
  dailyRecordings: TrendDataPoint[];
  dailyUsers: TrendDataPoint[];
}

export interface OverviewStats {
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

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
