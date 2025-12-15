import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeepAliveService implements OnDestroy {
  private http = inject(HttpClient);
  private intervalId: any = null;
  private readonly PING_INTERVAL = 4 * 60 * 1000; // 4 minutes

  start(): void {
    if (this.intervalId) return; // Already running

    // Ping immediately on start
    this.ping();

    // Then ping every 4 minutes
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.PING_INTERVAL);

    console.log('Keep-alive service started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Keep-alive service stopped');
    }
  }

  private ping(): void {
    // Use tags endpoint as a lightweight health check
    this.http.get(`${environment.apiUrl}/tags?limit=1`).subscribe({
      next: () => console.log('Keep-alive ping successful'),
      error: (err) => console.warn('Keep-alive ping failed:', err.status)
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
