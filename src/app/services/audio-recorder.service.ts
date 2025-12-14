import { Injectable, signal } from '@angular/core';
import RecordRTC from 'recordrtc';

export type RecordingFormat = 'wav' | 'mp4';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private recorder: RecordRTC | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private amplitudeHistory: number[] = [];

  // Developer toggle for recording format
  // 'wav' = RecordRTC (high quality, large files ~6MB/30s)
  // 'mp4' = Native MediaRecorder (compressed, small files ~400KB/30s)
  private _format = signal<RecordingFormat>('wav');
  readonly format = this._format.asReadonly();

  setFormat(format: RecordingFormat): void {
    this._format.set(format);
    console.log(`Recording format set to: ${format}`);
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  async startRecording(): Promise<void> {
    this.amplitudeHistory = [];
    this.recordedChunks = [];

    const format = this._format();

    // Audio constraints differ by format
    const audioConstraints: MediaTrackConstraints & Record<string, unknown> = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 2 },
      ...(format === 'wav' ? { sampleRate: { ideal: 96000, min: 48000 } } : {}),
    };

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });

    // Get actual sample rate from the track
    const audioTrack = this.stream.getAudioTracks()[0];
    const settings = audioTrack.getSettings();
    const actualSampleRate = settings.sampleRate || 48000;

    // Setup analyser for waveform
    this.audioContext = new AudioContext({ sampleRate: actualSampleRate });
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.3;
    const source = this.audioContext.createMediaStreamSource(this.stream);
    source.connect(this.analyser);

    if (format === 'wav') {
      // RecordRTC for high-quality WAV
      this.recorder = new RecordRTC(this.stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 2,
        desiredSampRate: actualSampleRate,
        audioBitsPerSecond: 512000,
        bufferSize: 4096,
      });
      this.recorder.startRecording();
      console.log(`Recording WAV at ${actualSampleRate}Hz (RecordRTC)`);
    } else {
      // Native MediaRecorder for compressed MP4/WebM
      const mimeType = this.getSupportedMimeType();
      // 320kbps for near-transparent quality (still ~10x smaller than WAV)
      const bitrate = 320000;
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: bitrate,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      console.log(
        `Recording ${mimeType} at ${bitrate / 1000}kbps (MediaRecorder)`
      );
    }
  }

  private getSupportedMimeType(): string {
    // Prioritize Opus (best quality per bitrate), then AAC for iOS compatibility
    const types = [
      'audio/webm;codecs=opus', // Best quality - Chrome, Firefox, Android
      'audio/ogg;codecs=opus', // Firefox fallback
      'audio/mp4', // iOS/Safari
      'audio/mp4;codecs=mp4a.40.2', // AAC explicit
      'audio/webm', // Generic WebM
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback to default
    return '';
  }

  getAmplitude(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const amplitude =
      (data.reduce((a, b) => a + b, 0) / data.length / 255) * 100;
    this.amplitudeHistory.push(amplitude);
    return amplitude;
  }

  async stopRecording(): Promise<{ blob: Blob; waveform: number[] }> {
    const format = this._format();

    if (format === 'wav') {
      // RecordRTC stop
      return new Promise((resolve, reject) => {
        if (!this.recorder) {
          reject(new Error('No recording in progress'));
          return;
        }

        this.recorder.stopRecording(() => {
          const blob = this.recorder!.getBlob();
          const waveform = this.normalizeWaveform(this.amplitudeHistory);
          console.log(
            `Recorded WAV: ${(blob.size / 1024 / 1024).toFixed(2)}MB`
          );
          this.cleanup();
          resolve({ blob, waveform });
        });
      });
    } else {
      // MediaRecorder stop
      return new Promise((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('No recording in progress'));
          return;
        }

        this.mediaRecorder.onstop = () => {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/mp4';
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          const waveform = this.normalizeWaveform(this.amplitudeHistory);
          console.log(
            `Recorded ${mimeType}: ${(blob.size / 1024).toFixed(0)}KB`
          );
          this.cleanup();
          resolve({ blob, waveform });
        };

        this.mediaRecorder.stop();
      });
    }
  }

  cancelRecording(): void {
    if (this.recorder) {
      this.recorder.reset();
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private normalizeWaveform(history: number[]): number[] {
    // Reduce to ~50 samples for display
    const targetLength = 50;
    if (history.length <= targetLength) {
      return history.map((v) => Math.max(10, v));
    }

    const result: number[] = [];
    const step = history.length / targetLength;
    for (let i = 0; i < targetLength; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      const slice = history.slice(start, end);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      result.push(Math.max(10, avg));
    }
    return result;
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.recorder = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }
}
