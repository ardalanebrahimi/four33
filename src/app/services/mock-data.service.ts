import { Injectable } from '@angular/core';
import { Recording, User, Tag, Activity, MovementId } from '../models';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private users: User[] = [
    {
      id: '1',
      username: 'you',
      followersCount: 2,
      followingCount: 1,
      recordingsCount: 0,
    },
    {
      id: '2',
      username: 'listener_42',
      followersCount: 156,
      followingCount: 89,
      recordingsCount: 23,
      isFollowing: false,
    },
    {
      id: '3',
      username: 'ambient_soul',
      followersCount: 342,
      followingCount: 127,
      recordingsCount: 45,
      isFollowing: false,
    },
    {
      id: '4',
      username: 'nature_ear',
      followersCount: 89,
      followingCount: 56,
      recordingsCount: 12,
      isFollowing: true,
    },
    {
      id: '5',
      username: 'city_monk',
      followersCount: 234,
      followingCount: 178,
      recordingsCount: 34,
      isFollowing: false,
    },
  ];

  private tags: Tag[] = [
    { id: '1', name: 'rain', recordingCount: 234, isFollowing: true },
    { id: '2', name: 'solitude', recordingCount: 189, isFollowing: false },
    { id: '3', name: 'evening', recordingCount: 156, isFollowing: false },
    { id: '4', name: 'traffic', recordingCount: 123, isFollowing: false },
    { id: '5', name: 'urban', recordingCount: 98, isFollowing: false },
    { id: '6', name: 'rush', recordingCount: 87, isFollowing: false },
    { id: '7', name: 'birds', recordingCount: 145, isFollowing: false },
    { id: '8', name: 'morning', recordingCount: 178, isFollowing: false },
    { id: '9', name: 'silence', recordingCount: 267, isFollowing: true },
    { id: '10', name: 'wind', recordingCount: 134, isFollowing: false },
  ];

  private recordings: Recording[] = [
    {
      id: '1',
      user: this.users[1],
      movement: 'I',
      durationSeconds: 30,
      audioUrl: '',
      waveformData: this.generateWaveform(),
      tags: [
        { ...this.tags[0], isOriginal: true },
        { ...this.tags[1], isOriginal: true },
        { ...this.tags[2], isOriginal: false },
      ],
      likesCount: 23,
      isLiked: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      timeAgo: '2h ago',
    },
    {
      id: '2',
      user: this.users[2],
      movement: 'II',
      durationSeconds: 143,
      audioUrl: '',
      waveformData: this.generateWaveform(),
      tags: [
        { ...this.tags[3], isOriginal: true },
        { ...this.tags[4], isOriginal: true },
        { ...this.tags[5], isOriginal: true },
      ],
      likesCount: 15,
      isLiked: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      timeAgo: '5h ago',
    },
    {
      id: '3',
      user: this.users[3],
      movement: 'FULL',
      durationSeconds: 273,
      audioUrl: '',
      waveformData: this.generateWaveform(),
      tags: [
        { ...this.tags[6], isOriginal: true },
        { ...this.tags[7], isOriginal: true },
        { ...this.tags[9], isOriginal: false },
      ],
      likesCount: 47,
      isLiked: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      timeAgo: '1d ago',
    },
    {
      id: '4',
      user: this.users[4],
      movement: 'III',
      durationSeconds: 100,
      audioUrl: '',
      waveformData: this.generateWaveform(),
      tags: [
        { ...this.tags[8], isOriginal: true },
        { ...this.tags[9], isOriginal: true },
      ],
      likesCount: 31,
      isLiked: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      timeAgo: '3d ago',
    },
  ];

  private activities: Activity[] = [
    {
      id: '1',
      type: 'like',
      user: this.users[3],
      recording: this.recordings[0],
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      timeAgo: '1h ago',
    },
    {
      id: '2',
      type: 'follow',
      user: this.users[4],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      timeAgo: '3h ago',
    },
  ];

  getCurrentUser(): User {
    return this.users[0];
  }

  getRecordings(filter?: { tag?: string; userId?: string }): Recording[] {
    let result = [...this.recordings];
    if (filter?.tag) {
      result = result.filter((r) =>
        r.tags.some((t) => t.name.toLowerCase() === filter.tag?.toLowerCase())
      );
    }
    if (filter?.userId) {
      result = result.filter((r) => r.user.id === filter.userId);
    }
    return result;
  }

  getRecording(id: string): Recording | undefined {
    return this.recordings.find((r) => r.id === id);
  }

  getTags(): Tag[] {
    return this.tags;
  }

  getFollowedTags(): Tag[] {
    return this.tags.filter((t) => t.isFollowing);
  }

  getUser(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getFollowers(): User[] {
    return [this.users[3], this.users[4]];
  }

  getFollowing(): User[] {
    return [this.users[3]];
  }

  getActivities(): Activity[] {
    return this.activities;
  }

  toggleLike(recordingId: string): void {
    const recording = this.recordings.find((r) => r.id === recordingId);
    if (recording) {
      recording.isLiked = !recording.isLiked;
      recording.likesCount += recording.isLiked ? 1 : -1;
    }
  }

  toggleFollowUser(userId: string): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.isFollowing = !user.isFollowing;
      user.followersCount += user.isFollowing ? 1 : -1;
    }
  }

  toggleFollowTag(tagName: string): void {
    const tag = this.tags.find((t) => t.name === tagName);
    if (tag) {
      tag.isFollowing = !tag.isFollowing;
    }
  }

  addRecording(recording: Partial<Recording>): Recording {
    const newRecording: Recording = {
      id: String(this.recordings.length + 1),
      user: this.users[0],
      movement: recording.movement || 'I',
      durationSeconds: recording.durationSeconds || 30,
      audioUrl: recording.audioUrl || '',
      waveformData: recording.waveformData || this.generateWaveform(),
      tags: (recording.tags || []).map((t, i) => ({
        id: String(this.tags.length + i + 1),
        name: typeof t === 'string' ? t : t.name,
        isOriginal: true,
      })),
      likesCount: 0,
      isLiked: false,
      createdAt: new Date(),
      timeAgo: 'just now',
    };
    this.recordings.unshift(newRecording);
    this.users[0].recordingsCount++;
    return newRecording;
  }

  private generateWaveform(): number[] {
    return Array.from({ length: 50 }, () => 10 + Math.random() * 50);
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}"`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  }

  getMovementLabel(movement: MovementId): string {
    const labels: Record<MovementId, string> = {
      I: '30"',
      II: "2'23\"",
      III: "1'40\"",
      FULL: "4'33\"",
    };
    return labels[movement];
  }
}
