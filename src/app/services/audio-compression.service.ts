import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

@Injectable({ providedIn: 'root' })
export class AudioCompressionService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private loading = false;

  /**
   * Compress a WAV blob to AAC/M4A format
   * @param wavBlob The WAV audio blob to compress
   * @param bitrate Target bitrate in kbps (default 128)
   * @returns Compressed M4A blob
   */
  async compressToM4A(wavBlob: Blob, bitrate = 128): Promise<Blob> {
    await this.ensureLoaded();

    if (!this.ffmpeg) {
      throw new Error('FFmpeg failed to load');
    }

    const inputName = 'input.wav';
    const outputName = 'output.m4a';

    // Write input file to FFmpeg virtual filesystem
    const inputData = await fetchFile(wavBlob);
    await this.ffmpeg.writeFile(inputName, inputData);

    // Convert WAV to AAC/M4A
    // -i input.wav: input file
    // -c:a aac: use AAC codec
    // -b:a 128k: bitrate (128kbps is good quality for ambient audio)
    // -movflags +faststart: optimize for web streaming
    await this.ffmpeg.exec([
      '-i', inputName,
      '-c:a', 'aac',
      '-b:a', `${bitrate}k`,
      '-movflags', '+faststart',
      outputName
    ]);

    // Read the output file
    const outputData = await this.ffmpeg.readFile(outputName);

    // Clean up
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    // Convert to Blob
    const outputBlob = new Blob([outputData], { type: 'audio/mp4' });

    console.log(`Compressed ${(wavBlob.size / 1024 / 1024).toFixed(2)}MB WAV to ${(outputBlob.size / 1024 / 1024).toFixed(2)}MB M4A`);

    return outputBlob;
  }

  /**
   * Get compression ratio estimate
   */
  getEstimatedSize(wavSizeBytes: number, bitrate = 128): number {
    // WAV is about 1411 kbps for 44.1kHz stereo 16-bit
    // AAC at 128kbps is about 11x smaller
    return wavSizeBytes / 11;
  }

  /**
   * Check if FFmpeg is ready
   */
  isReady(): boolean {
    return this.loaded;
  }

  /**
   * Preload FFmpeg (call this early to avoid delay when compressing)
   */
  async preload(): Promise<void> {
    await this.ensureLoaded();
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) {
      // Wait for existing load to complete
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.loading = true;

    try {
      this.ffmpeg = new FFmpeg();

      // Load FFmpeg core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.loaded = true;
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }
}
