import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import RecordRTC from 'recordrtc';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-audio-recorder',
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.scss'],
  imports: [CommonModule],
})
export class AudioRecorderComponent {
  recorder: any;
  audioBlob: Blob | null = null;
  audioUrl: string = '';
  isRecording: boolean = false;
  recordingFinished: boolean = false;

  countdown: number = 10; // For testing (replace with 273 for 4:33)
  progressWidth: number = 0; // Progress bar percentage
  interval: any;
  constructor(private cdr: ChangeDetectorRef) {}

  startRecording(): void {
    this.isRecording = true;
    this.recordingFinished = false;
    this.progressWidth = 0;

    // Request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.recorder = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/webm',
        });
        this.recorder.startRecording();

        // Start countdown
        this.countdown = 10; // Testing value
        this.interval = setInterval(() => {
          this.countdown--;
          this.progressWidth += 10; // 100% / 10 seconds
          if (this.countdown <= 0) {
            clearInterval(this.interval);
            this.stopRecording();
          }
        }, 1000);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
        this.isRecording = false;
      });
  }

  stopRecording(): void {
    if (this.recorder) {
      this.recorder.stopRecording(() => {
        this.audioBlob = this.recorder.getBlob();
        if (this.audioBlob) {
          this.audioUrl = URL.createObjectURL(this.audioBlob);
        }
        this.isRecording = false;
        this.recordingFinished = true;
        this.cdr.detectChanges();
      });
    }
  }

  cancelRecording(): void {
    if (this.recorder) {
      this.recorder.reset();
    }
    clearInterval(this.interval);
    this.isRecording = false;
    this.progressWidth = 0;
  }

  reset(): void {
    this.audioBlob = null;
    this.audioUrl = '';
    this.isRecording = false;
    this.recordingFinished = false;
    this.progressWidth = 0;
    this.cdr.detectChanges();
  }
}
