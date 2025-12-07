import { Injectable, signal, computed } from '@angular/core';
import { MovementId, MOVEMENTS, RecordingPhase, RecordingDraft } from '../models';

@Injectable({ providedIn: 'root' })
export class RecordingStateService {
  private _phase = signal<RecordingPhase>('selecting');
  private _selectedMovement = signal<MovementId | null>(null);
  private _audioBlob = signal<Blob | null>(null);
  private _audioUrl = signal<string>('');
  private _waveformData = signal<number[]>([]);
  private _tags = signal<string[]>([]);
  private _elapsed = signal<number>(0);
  private _isRecording = signal<boolean>(false);

  // Public readonly signals
  readonly phase = this._phase.asReadonly();
  readonly selectedMovement = this._selectedMovement.asReadonly();
  readonly audioBlob = this._audioBlob.asReadonly();
  readonly audioUrl = this._audioUrl.asReadonly();
  readonly waveformData = this._waveformData.asReadonly();
  readonly tags = this._tags.asReadonly();
  readonly elapsed = this._elapsed.asReadonly();
  readonly isRecording = this._isRecording.asReadonly();

  // Computed values
  readonly movement = computed(() => {
    const id = this._selectedMovement();
    return id ? MOVEMENTS[id] : null;
  });

  readonly duration = computed(() => {
    return this.movement()?.duration ?? 0;
  });

  readonly remaining = computed(() => {
    return Math.max(0, this.duration() - this._elapsed());
  });

  readonly progress = computed(() => {
    const dur = this.duration();
    if (dur === 0) return 0;
    return Math.min(100, (this._elapsed() / dur) * 100);
  });

  selectMovement(movement: MovementId): void {
    this._selectedMovement.set(movement);
    this._phase.set('ready');
  }

  startRecording(): void {
    this._phase.set('recording');
    this._isRecording.set(true);
    this._elapsed.set(0);
    this._waveformData.set([]);
  }

  updateProgress(elapsed: number, amplitude?: number): void {
    this._elapsed.set(elapsed);
    if (amplitude !== undefined) {
      this._waveformData.update((data) => [...data, amplitude]);
    }
  }

  finishRecording(blob: Blob, waveform: number[]): void {
    this._audioBlob.set(blob);
    this._audioUrl.set(URL.createObjectURL(blob));
    this._waveformData.set(waveform);
    this._isRecording.set(false);
    this._phase.set('recorded');
  }

  goToTagging(): void {
    this._phase.set('tagging');
  }

  setTags(tags: string[]): void {
    this._tags.set(tags);
  }

  addTag(tag: string): boolean {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || this._tags().length >= 5) return false;
    if (this._tags().includes(normalized)) return false;
    this._tags.update((tags) => [...tags, normalized]);
    return true;
  }

  removeTag(tag: string): void {
    this._tags.update((tags) => tags.filter((t) => t !== tag));
  }

  startUpload(): void {
    this._phase.set('uploading');
  }

  getDraft(): RecordingDraft {
    return {
      movement: this._selectedMovement(),
      audioBlob: this._audioBlob(),
      waveformData: this._waveformData(),
      tags: this._tags(),
    };
  }

  reset(): void {
    if (this._audioUrl()) {
      URL.revokeObjectURL(this._audioUrl());
    }
    this._phase.set('selecting');
    this._selectedMovement.set(null);
    this._audioBlob.set(null);
    this._audioUrl.set('');
    this._waveformData.set([]);
    this._tags.set([]);
    this._elapsed.set(0);
    this._isRecording.set(false);
  }

  goBackToSelection(): void {
    this._phase.set('selecting');
    this._selectedMovement.set(null);
  }
}
