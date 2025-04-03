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
  url: string;
  uploadUrl: string;
}

// List of available speed test servers
export const speedTestServers: SpeedTestServer[] = [
  {
    id: 'cloudflare',
    host: 'Cloudflare',
    location: 'Global',
    country: 'Global',
    url: '/api/speed?type=download&bytes=1073741824',
    uploadUrl: '/api/speed?type=upload'
  }
];

// Function to measure download speed with progress callback
async function measureDownloadSpeed(
  server: SpeedTestServer,
  onProgress?: (progress: number, currentSpeed: number) => void
): Promise<number> {
  try {
    const url = server.url;
    let downloadedSize = 0;
    const startTime = performance.now();
    let endTime = startTime;
    let lastProgressUpdate = 0;
    let lastSpeedUpdate = 0;
    
    console.log(`Starting download from ${server.host} (${url})`);
    
    const response = await fetch(url, { 
      cache: 'no-store'
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to start download: ${response.status} ${response.statusText}`);
    }

    // For Cloudflare, we know the file size from the URL (1GB)
    const fileSize = 1073741824; // 1GB
    
    console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

    const reader = response.body.getReader();

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        endTime = performance.now();
        break;
      }

      downloadedSize += (value?.length || 0);

      // Calculate and report progress
      const progress = Math.min(100, (downloadedSize / fileSize) * 100);
      const currentTime = performance.now();
      const currentDuration = (currentTime - startTime) / 1000;
      const currentSpeed = ((downloadedSize * 8) / currentDuration) / 1000000;

      // Report progress every 1% or every 100ms for speed
      if (onProgress && (progress - lastProgressUpdate >= 1 || currentTime - lastSpeedUpdate >= 100)) {
        onProgress(progress, currentSpeed);
        lastProgressUpdate = progress;
        lastSpeedUpdate = currentTime;
      }

      // Log progress every 50MB
      if (downloadedSize % (50 * 1024 * 1024) === 0) {
        console.log(`Download Progress: ${Math.round(downloadedSize / 1024 / 1024)}MB (${progress.toFixed(1)}%), Current Speed: ${currentSpeed.toFixed(2)} Mbps`);
      }
    }

    reader.cancel();

    const durationInSeconds = (endTime - startTime) / 1000;
    const downloadedBits = downloadedSize * 8;
    const speedInMbps = (downloadedBits / durationInSeconds) / 1000000;

    console.log(`Download completed: ${downloadedSize / 1024 / 1024}MB in ${durationInSeconds.toFixed(2)}s, Speed: ${speedInMbps.toFixed(2)} Mbps`);

    // Ensure we show 100% at the end
    if (onProgress) {
      onProgress(100, speedInMbps);
    }

    return speedInMbps > 0 ? speedInMbps : 0;
  } catch (error) {
    console.error('Download speed test error:', error);
    return 0;
  }
}

// Function to measure ping and jitter
async function measurePingAndJitter(
  server: SpeedTestServer,
  onProgress?: (progress: number, currentPing: number, currentJitter: number) => void
): Promise<{ ping: number; jitter: number }> {
  const pings: number[] = [];
  const jitters: number[] = [];
  const testDuration = 3000; // 3 seconds
  const startTime = performance.now();
  let lastPing = 0;
  let progress = 0;

  console.log('Starting ping and jitter test...');

  while (performance.now() - startTime < testDuration) {
    const pingStartTime = performance.now();
    try {
      const response = await fetch('/api/speed?type=ping', { 
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Ping failed: ${response.status} ${response.statusText}`);
      }
      
      const pingTime = performance.now() - pingStartTime;
      pings.push(pingTime);

      // Calculate jitter only if we have a previous ping
      if (lastPing > 0) {
        const jitter = Math.abs(pingTime - lastPing);
        jitters.push(jitter);
      }
      lastPing = pingTime;

      // Calculate current averages
      const currentPing = pings.reduce((a, b) => a + b, 0) / pings.length;
      const currentJitter = jitters.length > 0 
        ? jitters.reduce((a, b) => a + b, 0) / jitters.length 
        : 0;

      // Calculate progress (0-100)
      progress = Math.min(100, ((performance.now() - startTime) / testDuration) * 100);

      if (onProgress) {
        onProgress(progress, currentPing, currentJitter);
      }

      console.log(`Ping: ${pingTime.toFixed(1)}ms, Jitter: ${jitters[jitters.length - 1]?.toFixed(1) || 0}ms`);

      // Small delay between pings
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Ping test error:', error);
      // Add a failed ping attempt
      pings.push(999);
    }
  }

  // Calculate final averages
  const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
  const avgJitter = jitters.length > 0 
    ? jitters.reduce((a, b) => a + b, 0) / jitters.length 
    : 0;

  // Ensure we show 100% at the end
  if (onProgress) {
    onProgress(100, avgPing, avgJitter);
  }

  return {
    ping: avgPing,
    jitter: avgJitter
  };
}

// Function to measure upload speed with progress callback
async function measureUploadSpeed(
  server: SpeedTestServer,
  onProgress?: (progress: number, currentSpeed: number) => void
): Promise<number> {
  try {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalSize = 100 * 1024 * 1024; // 100MB total
    let uploadedSize = 0;
    const startTime = performance.now();
    let lastProgressUpdate = 0;
    let lastSpeedUpdate = 0;

    console.log('Starting upload test...');

    while (uploadedSize < totalSize) {
      const chunk = new ArrayBuffer(Math.min(chunkSize, totalSize - uploadedSize));
      
      const response = await fetch(server.uploadUrl, {
        method: 'POST',
        body: chunk,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      uploadedSize += chunkSize;

      // Calculate progress and speed
      const progress = Math.min(100, (uploadedSize / totalSize) * 100);
      const currentTime = performance.now();
      const currentDuration = (currentTime - startTime) / 1000;
      const currentSpeed = ((uploadedSize * 8) / currentDuration) / 1000000;

      // Report progress every 1% or every 100ms for speed
      if (onProgress && (progress - lastProgressUpdate >= 1 || currentTime - lastSpeedUpdate >= 100)) {
        onProgress(progress, currentSpeed);
        lastProgressUpdate = progress;
        lastSpeedUpdate = currentTime;
      }

      // Log progress every 10MB
      if (uploadedSize % (10 * 1024 * 1024) === 0) {
        console.log(`Upload Progress: ${Math.round(uploadedSize / 1024 / 1024)}MB (${progress.toFixed(1)}%), Current Speed: ${currentSpeed.toFixed(2)} Mbps`);
      }
    }

    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    const uploadedBits = uploadedSize * 8;
    const speedInMbps = (uploadedBits / durationInSeconds) / 1000000;

    console.log(`Upload completed: ${uploadedSize / 1024 / 1024}MB in ${durationInSeconds.toFixed(2)}s, Speed: ${speedInMbps.toFixed(2)} Mbps`);

    // Ensure we show 100% at the end
    if (onProgress) {
      onProgress(100, speedInMbps);
    }

    return speedInMbps > 0 ? speedInMbps : 0;
  } catch (error) {
    console.error('Upload speed test error:', error);
    return 0;
  }
}

async function getServerInfo(): Promise<{ host: string; location: string; country: string }> {
  return {
    host: 'Cloudflare',
    location: 'Global',
    country: 'Global'
  };
}

export async function runSpeedTest(
  selectedServerId: string = 'cloudflare',
  onProgress?: (type: 'download' | 'upload' | 'ping', progress: number, currentSpeed: number, currentPing?: number, currentJitter?: number) => void
): Promise<SpeedTestResult> {
  const server = speedTestServers.find(s => s.id === selectedServerId) || speedTestServers[0];
  
  // Measure ping and jitter first
  const { ping, jitter } = await measurePingAndJitter(server, (progress, currentPing, currentJitter) => {
    onProgress?.('ping', progress, 0, currentPing, currentJitter);
  });

  // Then measure download speed
  const download = await measureDownloadSpeed(server, (progress, currentSpeed) => {
    onProgress?.('download', progress, currentSpeed);
  });

  // Finally measure upload speed
  const upload = await measureUploadSpeed(server, (progress, currentSpeed) => {
    onProgress?.('upload', progress, currentSpeed);
  });

  return {
    download,
    upload,
    ping,
    jitter,
    server: {
      host: server.host,
      location: server.location,
      country: server.country,
      id: server.id
    }
  };
} 