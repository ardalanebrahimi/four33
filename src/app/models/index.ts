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
  likesCount: number;
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
}

export type RecordingPhase =
  | 'selecting'
  | 'ready'
  | 'recording'
  | 'recorded'
  | 'tagging'
  | 'uploading';
