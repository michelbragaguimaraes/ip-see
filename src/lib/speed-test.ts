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
    id: 'netlify',
    host: 'Netlify',
    location: 'Global',
    country: 'Global',
    url: '/api/speed?type=download',
    uploadUrl: '/api/speed?type=upload'
  }
];

// Function to measure download speed with progress callback
async function measureDownloadSpeed(
  server: SpeedTestServer,
  onProgress?: (progress: number, currentSpeed: number) => void
): Promise<number> {
  try {
    console.log('Starting download test');
    
    let downloadedBytes = 0;
    let startTime = performance.now();
    let lastProgressTime = startTime;
    let speedSamples: number[] = [];
    const totalSize = 100 * 1024 * 1024; // 100MB total
    const windowSize = 500; // 500ms window for speed calculation
    let speedWindow: { bytes: number; time: number }[] = [];

    // Start progress at 0%
    onProgress?.(0, 0);

    // Single large file download with progress tracking
    const response = await fetch(`${server.url}&size=${totalSize}&t=${new Date().getTime()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Download failed: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    let isDone = false;

    while (!isDone) {
      const { done, value } = await reader.read();
      
      if (done) {
        isDone = true;
        continue;
      }

      if (value) {
        const now = performance.now();
        downloadedBytes += value.length;
        
        // Add to speed window
        speedWindow.push({ bytes: value.length, time: now });
        
        // Remove old samples outside the window
        while (speedWindow.length > 0 && (now - speedWindow[0].time) > windowSize) {
          speedWindow.shift();
        }
        
        // Calculate current speed based on window
        if (speedWindow.length > 1) {
          const windowBytes = speedWindow.reduce((sum, sample) => sum + sample.bytes, 0);
          const windowTime = (speedWindow[speedWindow.length - 1].time - speedWindow[0].time) / 1000; // seconds
          if (windowTime > 0) {
            const currentSpeed = (windowBytes * 8) / windowTime / (1024 * 1024); // Mbps
            speedSamples.push(currentSpeed);
            
            const progress = Math.min((downloadedBytes / totalSize) * 100, 100);
            onProgress?.(progress, currentSpeed);
          }
        }
      }
    }

    const totalTime = (performance.now() - startTime) / 1000; // in seconds
    
    // Calculate average speed using the highest sustained speed
    // Take the top 25% of samples for the average
    const sortedSpeeds = speedSamples.sort((a, b) => b - a); // Sort descending
    const topSpeedCount = Math.max(1, Math.floor(speedSamples.length * 0.25));
    const avgSpeed = sortedSpeeds.slice(0, topSpeedCount).reduce((a, b) => a + b, 0) / topSpeedCount;

    console.log(`Download completed: ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB in ${totalTime.toFixed(2)}s`);
    console.log(`Average speed: ${avgSpeed.toFixed(2)} Mbps`);
    
    // Ensure we report 100% progress at the end
    onProgress?.(100, avgSpeed);

    return avgSpeed;
  } catch (error) {
    console.error('Download speed test error:', error);
    throw error;
  }
}

// Function to measure ping and jitter
async function measurePingAndJitter(
  server: SpeedTestServer,
  onProgress?: (progress: number, currentPing: number, currentJitter: number) => void
): Promise<{ ping: number; jitter: number }> {
  try {
    console.log('Starting ping test');
    
    // Start progress at 0%
    onProgress?.(0, 0, 0);
    
    const response = await fetch('/api/speed?type=ping', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ping failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Ping error: ${data.error}`);
    }
    
    const ping = data.ping || 0;
    const jitter = data.jitter || 0;
    
    console.log(`Ping: ${ping.toFixed(1)}ms, Jitter: ${jitter.toFixed(1)}ms`);
    
    // Simulate progress for UI
    if (onProgress) {
      // Start at 0%
      onProgress(0, ping, jitter);
      
      // Simulate progress over 1 second
      const startTime = performance.now();
      const duration = 1000; // 1 second
      
      const interval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        
        onProgress(progress, ping, jitter);
        
        if (progress >= 100) {
          clearInterval(interval);
          onProgress(100, ping, jitter);
        }
      }, 50);
    }
    
    return { ping, jitter };
  } catch (error) {
    console.error('Ping test error:', error);
    throw error;
  }
}

// Function to measure upload speed with progress callback
async function measureUploadSpeed(
  server: SpeedTestServer,
  onProgress?: (progress: number, currentSpeed: number) => void
): Promise<number> {
  try {
    console.log('Starting upload test');
    
    let uploadedBytes = 0;
    let startTime = performance.now();
    let lastProgressTime = startTime;
    let lastBytesUploaded = 0;
    let speedSamples: number[] = [];
    const totalSize = 50 * 1024 * 1024; // 50MB total for better handling
    const chunkSize = 64 * 1024; // 64KB chunks for generating data (crypto API limit)
    const uploadChunkSize = 512 * 1024; // 512KB upload chunks for more frequent measurements
    const windowSize = 500; // 500ms window for speed calculation
    let speedWindow: { bytes: number; time: number }[] = [];

    // Start progress at 0%
    onProgress?.(0, 0);

    // Generate the full random data first in 64KB chunks
    console.log('Generating test data...');
    const fullData = new Uint8Array(totalSize);
    for (let offset = 0; offset < totalSize; offset += chunkSize) {
      const size = Math.min(chunkSize, totalSize - offset);
      const chunk = new Uint8Array(size);
      crypto.getRandomValues(chunk);
      fullData.set(chunk, offset);
      
      // Report progress of data generation
      const genProgress = (offset / totalSize) * 10; // Use first 10% for data generation
      onProgress?.(genProgress, 0);
    }
    console.log('Test data generated');

    // Upload in chunks for progress tracking
    for (let offset = 0; offset < totalSize; offset += uploadChunkSize) {
      const chunkStartTime = performance.now();
      const size = Math.min(uploadChunkSize, totalSize - offset);
      const chunk = fullData.slice(offset, offset + size);
      
      const response = await fetch(`${server.uploadUrl}&size=${size}&offset=${offset}&total=${totalSize}&t=${new Date().getTime()}`, {
        method: 'POST',
        body: chunk,
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const now = performance.now();
      uploadedBytes += size;
      
      // Add to speed window
      speedWindow.push({ bytes: size, time: now });
      
      // Remove old samples outside the window
      while (speedWindow.length > 0 && (now - speedWindow[0].time) > windowSize) {
        speedWindow.shift();
      }
      
      // Calculate current speed based on window
      if (speedWindow.length > 1) {
        const windowBytes = speedWindow.reduce((sum, sample) => sum + sample.bytes, 0);
        const windowTime = (speedWindow[speedWindow.length - 1].time - speedWindow[0].time) / 1000; // seconds
        if (windowTime > 0) {
          const currentSpeed = (windowBytes * 8) / windowTime / (1024 * 1024); // Mbps
          speedSamples.push(currentSpeed);
          
          const progress = 10 + ((uploadedBytes / totalSize) * 90); // Start at 10% (after data gen)
          onProgress?.(progress, currentSpeed);
        }
      }
    }

    const totalTime = (performance.now() - startTime) / 1000; // in seconds
    
    // Calculate average speed using the highest sustained speed
    // Take the top 25% of samples for the average
    const sortedSpeeds = speedSamples.sort((a, b) => b - a); // Sort descending
    const topSpeedCount = Math.max(1, Math.floor(speedSamples.length * 0.25));
    const avgSpeed = sortedSpeeds.slice(0, topSpeedCount).reduce((a, b) => a + b, 0) / topSpeedCount;

    console.log(`Upload completed: ${(uploadedBytes / (1024 * 1024)).toFixed(2)} MB in ${totalTime.toFixed(2)}s`);
    console.log(`Average speed: ${avgSpeed.toFixed(2)} Mbps`);
    
    // Ensure we report 100% progress at the end
    onProgress?.(100, avgSpeed);

    return avgSpeed;
  } catch (error) {
    console.error('Upload speed test error:', error);
    throw error;
  }
}

async function getServerInfo(): Promise<{ host: string; location: string; country: string }> {
  return {
    host: 'Netlify',
    location: 'Global',
    country: 'Global'
  };
}

export async function runSpeedTest(
  selectedServerId: string = 'netlify',
  onProgress?: (type: 'download' | 'upload' | 'ping', progress: number, currentSpeed: number, currentPing?: number, currentJitter?: number) => void
): Promise<SpeedTestResult> {
  try {
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

    // Get server info
    const serverInfo = await getServerInfo();

    return {
      download,
      upload,
      ping,
      jitter,
      server: {
        ...serverInfo,
        id: server.id
      },
      progress: {
        download: 100,
        upload: 100,
        ping: 100
      },
      currentSpeed: {
        download,
        upload
      },
      currentPing: ping,
      currentJitter: jitter
    };
  } catch (error) {
    console.error('Speed test error:', error);
    throw error;
  }
} 