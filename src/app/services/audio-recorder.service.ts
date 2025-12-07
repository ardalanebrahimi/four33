import { Injectable } from '@angular/core';
import RecordRTC from 'recordrtc';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private recorder: RecordRTC | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private amplitudeHistory: number[] = [];

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

    // Request maximum quality audio - no processing for pure ambient capture
    const audioConstraints: MediaTrackConstraints & Record<string, unknown> = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: { ideal: 96000, min: 48000 },  // Studio quality (96kHz)
      channelCount: { ideal: 2 },
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
    this.analyser.fftSize = 512;  // Higher resolution for visualization
    this.analyser.smoothingTimeConstant = 0.3;
    const source = this.audioContext.createMediaStreamSource(this.stream);
    source.connect(this.analyser);

    this.recorder = new RecordRTC(this.stream, {
      type: 'audio',
      mimeType: 'audio/wav',                      // Uncompressed WAV for max quality
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 2,
      desiredSampRate: actualSampleRate,
      audioBitsPerSecond: 512000,                 // 512kbps for compressed fallback
      bufferSize: 4096,                           // Larger buffer = less glitches
    });
    this.recorder.startRecording();

    console.log(`Recording at ${actualSampleRate}Hz`);
  }

  getAmplitude(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const amplitude = (data.reduce((a, b) => a + b, 0) / data.length / 255) * 100;
    this.amplitudeHistory.push(amplitude);
    return amplitude;
  }

  async stopRecording(): Promise<{ blob: Blob; waveform: number[] }> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.recorder.stopRecording(() => {
        const blob = this.recorder!.getBlob();
        const waveform = this.normalizeWaveform(this.amplitudeHistory);
        this.cleanup();
        resolve({ blob, waveform });
      });
    });
  }

  cancelRecording(): void {
    if (this.recorder) {
      this.recorder.reset();
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
  }
}
