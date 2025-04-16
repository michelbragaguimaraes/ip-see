export interface SpeedTestResult {
  download: number; // Mbps
  upload: number; // Mbps
  ping: number; // ms
  jitter: number; // ms
  server: {
    host: string;
    location: string;
    country: string;
    id: string;
  };
  progress?: {
    download: number; // 0-100
    upload: number; // 0-100
    ping: number; // 0-100
  };
  currentSpeed?: {
    download: number; // Current speed in Mbps
    upload: number; // Current speed in Mbps
  };
  currentPing?: number; // Current ping in ms
  currentJitter?: number; // Current jitter in ms
}

export interface SpeedTestServer {
  id: string;
  host: string;
  location: string;
  country: string;
  downloadUrl: string;
  uploadUrl: string;
  pingUrl: string;
}

// List of available speed test servers
export const speedTestServers: SpeedTestServer[] = [
  {
    id: 'cloudflare',
    host: 'Cloudflare',
    location: 'Global Edge Network',
    country: 'Global',
    downloadUrl: '/api/speed?type=download',
    uploadUrl: '/api/speed',
    pingUrl: '/api/speed?type=ping'
  }
];

export class SpeedTest {
  private server: SpeedTestServer;
  private onProgress?: (result: SpeedTestResult) => void;
  private testState = -1;
  private result: SpeedTestResult;
  private abortController: AbortController | null = null;

  constructor(server: SpeedTestServer = speedTestServers[0]) {
    this.server = server;
    this.result = {
      download: 0,
      upload: 0,
      ping: 0,
      jitter: 0,
      server: {
        id: server.id,
        host: server.host,
        location: server.location,
        country: server.country
      },
      progress: {
        download: 0,
        upload: 0,
        ping: 0
      },
      currentSpeed: {
        download: 0,
        upload: 0
      }
    };
  }

  public setServer(server: SpeedTestServer) {
    this.server = server;
    this.result.server = {
      id: server.id,
      host: server.host,
      location: server.location,
      country: server.country
    };
  }

  public getState() {
    return this.testState;
  }

  public abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.testState = -1;
  }

  private async measurePing(url: string): Promise<{ ping: number; jitter: number }> {
    const pings: number[] = [];
    const iterations = 10;
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await fetch(url, { signal: this.abortController?.signal });
        const end = performance.now();
        pings.push(end - start);
        
        // Update progress
        this.result.progress!.ping = ((i + 1) / iterations) * 100;
        this.result.currentPing = end - start;
        if (this.onProgress) this.onProgress(this.result);
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        console.error('Ping measurement error:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate average ping and jitter
    const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
    const jitters = pings.slice(1).map((ping, i) => Math.abs(ping - pings[i]));
    const avgJitter = jitters.reduce((a, b) => a + b, 0) / jitters.length;

    return { ping: avgPing, jitter: avgJitter };
  }

  private async measureSpeed(url: string, type: 'download' | 'upload'): Promise<number> {
    const startTime = performance.now();
    let totalBytes = 0;
    const testDuration = 10000; // 10 seconds
    const chunkSize = 1024 * 1024; // 1MB chunks

    try {
      if (type === 'download') {
        // Add bytes parameter for download test
        const downloadUrl = new URL(url, window.location.origin);
        downloadUrl.searchParams.set('bytes', '134217728'); // 128MB for longer test duration
        
        const response = await fetch(downloadUrl.toString(), { signal: this.abortController?.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (!response.body) throw new Error('Response body is null');

        let reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length') || 0;
        console.log('Download test started:', { contentLength, url: downloadUrl.toString() });
        
        let lastUpdate = performance.now();
        let lastBytes = 0;
        let progress = 0;
        const targetBytes = 134217728; // 128MB target
        const minTestDuration = 10000; // Minimum 10 seconds test

        while (true) {
          const { done, value } = await reader.read();
          const now = performance.now();
          const elapsed = now - startTime;
          
          // If we've received all data but haven't reached minimum duration,
          // start a new request
          if (done) {
            if (elapsed < minTestDuration) {
              // Start a new request
              const newResponse = await fetch(downloadUrl.toString(), { signal: this.abortController?.signal });
              if (!newResponse.ok) break;
              if (!newResponse.body) break;
              reader.releaseLock();
              reader = newResponse.body.getReader();
              continue;
            }
            break;
          }
          
          totalBytes += value.length;
          
          // Update speed and progress every 100ms
          if (now - lastUpdate >= 100) {
            const intervalSpeed = ((totalBytes - lastBytes) * 8) / (1024 * 1024 * ((now - lastUpdate) / 1000));
            this.result.currentSpeed!.download = intervalSpeed;
            
            // Calculate progress based on time instead of bytes for smoother progress
            progress = Math.min((elapsed / minTestDuration) * 100, 100);
            this.result.progress!.download = progress;
            
            console.log('Download progress:', { 
              totalBytes, 
              progress, 
              speed: intervalSpeed, 
              elapsed,
              targetBytes
            });
            
            if (this.onProgress) this.onProgress(this.result);
            
            lastUpdate = now;
            lastBytes = totalBytes;
          }
        }
        
        // Calculate final speed based on total bytes and time
        const finalElapsed = (performance.now() - startTime) / 1000;
        const finalSpeed = (totalBytes * 8) / (1024 * 1024 * finalElapsed);
        this.result.currentSpeed!.download = finalSpeed;
        this.result.progress!.download = 100;
        if (this.onProgress) this.onProgress(this.result);
        
        console.log('Download test completed:', { 
          totalBytes, 
          finalSpeed,
          duration: finalElapsed 
        });
      } else {
        // Upload test
        const chunkSize = 8 * 1024 * 1024; // 8MB chunks for upload
        const startTime = performance.now();
        const minTestDuration = 10000; // Minimum 10 seconds test
        let lastUpdate = startTime;
        let lastBytes = 0;
        
        // Pre-generate random data for upload
        const uploadData = new Uint8Array(chunkSize);
        for (let i = 0; i < chunkSize; i++) {
          uploadData[i] = Math.random() * 256;
        }

        // Run multiple upload requests in parallel for better throughput
        const parallelUploads = 6; // Increased parallel uploads
        const uploadPromises = [];
        let activeUploads = 0;

        while (true) {
          const elapsed = performance.now() - startTime;
          if (elapsed >= minTestDuration && totalBytes >= chunkSize * parallelUploads) break;

          // Start new uploads if we have less than parallelUploads running
          while (activeUploads < parallelUploads) {
            const uploadPromise = fetch(url, {
              method: 'POST',
              body: uploadData,
              signal: this.abortController?.signal
            }).then(() => {
              totalBytes += chunkSize;
              activeUploads--;
              const now = performance.now();
              
              // Update speed and progress every 100ms
              if (now - lastUpdate >= 100) {
                const intervalSpeed = ((totalBytes - lastBytes) * 8) / (1024 * 1024 * ((now - lastUpdate) / 1000));
                // Apply a small correction factor for network overhead
                const correctedSpeed = intervalSpeed * 1.1;
                this.result.currentSpeed!.upload = correctedSpeed;
                this.result.progress!.upload = Math.min((elapsed / minTestDuration) * 100, 100);
                if (this.onProgress) this.onProgress(this.result);
                
                lastUpdate = now;
                lastBytes = totalBytes;
              }
            }).catch((error) => {
              if (error.name !== 'AbortError') {
                console.error('Upload chunk error:', error);
              }
              activeUploads--;
            });
            
            uploadPromises.push(uploadPromise);
            activeUploads++;
          }

          // Wait a short time before checking again
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Wait for all remaining uploads to complete
        await Promise.all(uploadPromises);

        // Calculate final speed
        const finalElapsed = (performance.now() - startTime) / 1000;
        const finalSpeed = (totalBytes * 8) / (1024 * 1024 * finalElapsed);
        // Apply the same correction factor
        const correctedFinalSpeed = finalSpeed * 1.1;
        this.result.currentSpeed!.upload = correctedFinalSpeed;
        this.result.progress!.upload = 100;
        if (this.onProgress) this.onProgress(this.result);
        
        console.log('Upload test completed:', {
          totalBytes,
          finalSpeed: correctedFinalSpeed,
          duration: finalElapsed,
          parallelUploads
        });
      }

      const elapsed = (performance.now() - startTime) / 1000;
      const speed = (totalBytes * 8) / (1024 * 1024 * elapsed);
      return speed * 1.1; // Apply correction factor to returned speed
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      console.error(`${type} speed measurement error:`, error);
      throw error;
    }
  }

  public async start(onProgress?: (result: SpeedTestResult) => void): Promise<SpeedTestResult> {
    this.onProgress = onProgress;
    this.abortController = new AbortController();

    try {
      // Run ping test
      this.testState = 0;
      const { ping, jitter } = await this.measurePing(this.server.pingUrl);
      this.result.ping = ping;
      this.result.jitter = jitter;

      // Run download test
      this.testState = 1;
      this.result.download = await this.measureSpeed(this.server.downloadUrl, 'download');

      // Run upload test
      this.testState = 2;
      this.result.upload = await this.measureSpeed(this.server.uploadUrl, 'upload');

      // Test complete
      this.testState = 4;
      return this.result;
    } catch (error) {
      if (error.name === 'AbortError') {
        this.testState = 5;
        throw new Error('Test aborted');
      }
      console.error('Speed test error:', error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }
}

// Main speed test function
export async function runSpeedTest(
  selectedServerId: string = 'cloudflare',
  onProgress?: (type: 'download' | 'upload' | 'ping', progress: number, currentSpeed: number, currentPing?: number, currentJitter?: number) => void
): Promise<SpeedTestResult> {
  const server = speedTestServers.find(s => s.id === selectedServerId) || speedTestServers[0];
  const speedTest = new SpeedTest(server);

  return speedTest.start((result) => {
    if (onProgress) {
      if (result.currentPing !== undefined && result.currentJitter !== undefined) {
        onProgress('ping', result.progress?.ping || 0, 0, result.currentPing, result.currentJitter);
      }
      if (result.currentSpeed?.download !== undefined) {
        onProgress('download', result.progress?.download || 0, result.currentSpeed.download);
      }
      if (result.currentSpeed?.upload !== undefined) {
        onProgress('upload', result.progress?.upload || 0, result.currentSpeed.upload);
      }
    }
  });
} 