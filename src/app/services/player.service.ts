import { Injectable, signal, computed } from '@angular/core';
import { Recording } from '../models';

export interface PlayerState {
  recording: Recording | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playlist: Recording[];
  currentIndex: number;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private audioElement: HTMLAudioElement | null = null;
  private _isSimulating = false; // Track if we're using simulated playback

  // Core state signals
  private _currentRecording = signal<Recording | null>(null);
  private _isPlaying = signal(false);
  private _currentTime = signal(0);
  private _duration = signal(0);
  private _playlist = signal<Recording[]>([]);
  private _currentIndex = signal(-1);

  // Public readonly signals
  readonly currentRecording = this._currentRecording.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly currentTime = this._currentTime.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly playlist = this._playlist.asReadonly();
  readonly currentIndex = this._currentIndex.asReadonly();

  // Computed signals
  readonly progress = computed(() => {
    const duration = this._duration();
    if (duration <= 0) return 0;
    return (this._currentTime() / duration) * 100;
  });

  readonly hasNext = computed(() => {
    const playlist = this._playlist();
    const index = this._currentIndex();
    return playlist.length > 0 && index < playlist.length - 1;
  });

  readonly hasPrevious = computed(() => {
    const index = this._currentIndex();
    return index > 0;
  });

  readonly isActive = computed(() => this._currentRecording() !== null);

  constructor() {
    this.initAudioElement();
  }

  private initAudioElement(): void {
    this.audioElement = new Audio();

    this.audioElement.addEventListener('timeupdate', () => {
      // Only update from audio element when not in simulation mode
      if (this.audioElement && !this._isSimulating) {
        this._currentTime.set(this.audioElement.currentTime);
      }
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement) {
        this._duration.set(this.audioElement.duration);
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this._isPlaying.set(false);
      // Auto-play next if available
      if (this.hasNext()) {
        this.next();
      } else {
        this._currentTime.set(0);
      }
    });

    this.audioElement.addEventListener('play', () => {
      this._isPlaying.set(true);
    });

    this.audioElement.addEventListener('pause', () => {
      this._isPlaying.set(false);
    });
  }

  play(recording: Recording, playlist?: Recording[]): void {
    // If a playlist is provided, set it
    if (playlist && playlist.length > 0) {
      this._playlist.set(playlist);
      const index = playlist.findIndex(r => r.id === recording.id);
      this._currentIndex.set(index >= 0 ? index : 0);
    } else if (this._playlist().length === 0) {
      // If no playlist exists, create one with just this recording
      this._playlist.set([recording]);
      this._currentIndex.set(0);
    } else {
      // Update index if playing from existing playlist
      const index = this._playlist().findIndex(r => r.id === recording.id);
      if (index >= 0) {
        this._currentIndex.set(index);
      }
    }

    this.loadAndPlay(recording);
  }

  private loadAndPlay(recording: Recording): void {
    if (!this.audioElement) return;

    // If same recording, just toggle play/pause
    if (this._currentRecording()?.id === recording.id) {
      if (this._isPlaying()) {
        this.pause();
      } else {
        this.audioElement.play();
      }
      return;
    }

    // Load new recording
    this._currentRecording.set(recording);
    this._currentTime.set(0);
    this._duration.set(recording.durationSeconds);

    if (recording.audioUrl) {
      this._isSimulating = false;
      this.audioElement.src = recording.audioUrl;
      this.audioElement.load();
      this.audioElement.play().catch(err => {
        console.error('Error playing audio:', err);
        // Simulate playback for development when no real audio
        this.simulatePlayback(recording);
      });
    } else {
      // Simulate playback for development
      this.simulatePlayback(recording);
    }
  }

  private simulationInterval: any = null;

  private simulatePlayback(recording: Recording): void {
    this._isSimulating = true;
    this._isPlaying.set(true);
    this._duration.set(recording.durationSeconds);

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      if (!this._isPlaying()) return;

      const newTime = this._currentTime() + 0.1;
      if (newTime >= this._duration()) {
        clearInterval(this.simulationInterval);
        this._currentTime.set(0);
        this._isPlaying.set(false);

        // Auto-play next if available
        if (this.hasNext()) {
          this.next();
        }
      } else {
        this._currentTime.set(newTime);
      }
    }, 100);
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    this._isPlaying.set(false);
  }

  togglePlayPause(): void {
    if (this._isPlaying()) {
      this.pause();
    } else {
      const recording = this._currentRecording();
      if (recording) {
        if (this._isSimulating) {
          // Resume simulation from current position
          this.resumeSimulation(recording);
        } else if (this.audioElement?.src) {
          this.audioElement.play().catch(() => {
            this.simulatePlayback(recording);
          });
        } else {
          this.simulatePlayback(recording);
        }
      }
    }
  }

  private resumeSimulation(recording: Recording): void {
    this._isPlaying.set(true);

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      if (!this._isPlaying()) return;

      const newTime = this._currentTime() + 0.1;
      if (newTime >= this._duration()) {
        clearInterval(this.simulationInterval);
        this._currentTime.set(0);
        this._isPlaying.set(false);

        if (this.hasNext()) {
          this.next();
        }
      } else {
        this._currentTime.set(newTime);
      }
    }, 100);
  }

  seek(time: number): void {
    const duration = this._duration();
    const clampedTime = Math.max(0, Math.min(time, duration));

    if (this.audioElement && this.audioElement.src) {
      this.audioElement.currentTime = clampedTime;
    }
    this._currentTime.set(clampedTime);
  }

  seekToPercent(percent: number): void {
    const duration = this._duration();
    const time = (percent / 100) * duration;
    this.seek(time);
  }

  seekForward(seconds: number = 10): void {
    this.seek(this._currentTime() + seconds);
  }

  seekBackward(seconds: number = 10): void {
    this.seek(this._currentTime() - seconds);
  }

  next(): void {
    const playlist = this._playlist();
    const currentIndex = this._currentIndex();

    if (currentIndex < playlist.length - 1) {
      const nextRecording = playlist[currentIndex + 1];
      this._currentIndex.set(currentIndex + 1);
      this.loadAndPlay(nextRecording);
    }
  }

  previous(): void {
    const currentIndex = this._currentIndex();
    const playlist = this._playlist();

    // If more than 3 seconds in, restart current track
    if (this._currentTime() > 3) {
      this.seek(0);
      return;
    }

    if (currentIndex > 0) {
      const prevRecording = playlist[currentIndex - 1];
      this._currentIndex.set(currentIndex - 1);
      this.loadAndPlay(prevRecording);
    } else {
      this.seek(0);
    }
  }

  stop(): void {
    this.pause();
    this._isSimulating = false;
    this._currentRecording.set(null);
    this._currentTime.set(0);
    this._duration.set(0);
    this._playlist.set([]);
    this._currentIndex.set(-1);

    if (this.audioElement) {
      this.audioElement.src = '';
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
