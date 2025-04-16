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
  private worker: Worker | null = null;
  private server: SpeedTestServer;
  private onProgress?: (result: SpeedTestResult) => void;
  private testState = -1;
  private result: SpeedTestResult;

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
    if (this.worker) {
      this.worker.postMessage('abort');
      this.worker.terminate();
      this.worker = null;
    }
    this.testState = -1;
  }

  public async start(onProgress?: (result: SpeedTestResult) => void): Promise<SpeedTestResult> {
    this.onProgress = onProgress;

    return new Promise((resolve, reject) => {
      try {
        // Create worker
        this.worker = new Worker('/speedtest_worker.js');

        // Handle messages from worker
        this.worker.onmessage = (e) => {
          const data = JSON.parse(e.data);
          this.testState = data.testState;

          // Update result object
          this.result.currentSpeed = {
            download: data.dlStatus,
            upload: data.ulStatus
          };
          this.result.currentPing = data.pingStatus;
          this.result.currentJitter = data.jitterStatus;
          this.result.progress = {
            download: data.dlProgress * 100,
            upload: data.ulProgress * 100,
            ping: data.pingProgress * 100
          };

          // If test is complete, set final values
          if (data.testState === 4) {
            this.result.download = data.dlStatus;
            this.result.upload = data.ulStatus;
            this.result.ping = data.pingStatus;
            this.result.jitter = data.jitterStatus;
          }

          // Call progress callback
          if (this.onProgress) {
            this.onProgress(this.result);
          }

          // If test is complete or aborted, resolve/reject promise
          if (data.testState === 4) {
            this.worker?.terminate();
            this.worker = null;
            resolve(this.result);
          } else if (data.testState === 5) {
            this.worker?.terminate();
            this.worker = null;
            reject(new Error('Test aborted'));
          }
        };

        // Start test
        this.worker.postMessage('start ' + JSON.stringify({
          url_dl: this.server.downloadUrl,
          url_ul: this.server.uploadUrl,
          url_ping: this.server.pingUrl
        }));
      } catch (error) {
        console.error('Failed to start speed test:', error);
        reject(error);
      }
    });
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