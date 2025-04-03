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
    
    const response = await fetch(server.url, {
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

    const contentLength = response.headers.get('Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 1024 * 1024 * 1024; // Default to 1GB if not specified
    let downloadedBytes = 0;
    let startTime = performance.now();
    let lastProgressUpdate = 0;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      downloadedBytes += value.length;
      
      // Update progress
      const progress = Math.min(100, (downloadedBytes / totalBytes) * 100);
      const currentTime = performance.now();
      
      // Update progress every 1% or every 100ms
      if (progress - lastProgressUpdate >= 1 || currentTime - startTime >= 100) {
        const elapsed = (currentTime - startTime) / 1000; // in seconds
        const currentSpeed = (downloadedBytes * 8) / (1024 * 1024 * elapsed); // in Mbps
        
        onProgress?.(progress, currentSpeed);
        lastProgressUpdate = progress;
        startTime = currentTime;
        
        // Log progress every 64MB
        if (downloadedBytes % (64 * 1024 * 1024) < value.length) {
          console.log(`Downloaded ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB (${progress.toFixed(1)}%) at ${currentSpeed.toFixed(2)} Mbps`);
        }
      }
    }

    const totalTime = (performance.now() - startTime) / 1000; // in seconds
    const speedInMbps = (downloadedBytes * 8) / (1024 * 1024 * totalTime);

    console.log(`Download completed: Speed: ${speedInMbps.toFixed(2)} Mbps`);
    
    // Ensure we report 100% progress at the end
    onProgress?.(100, speedInMbps);

    return speedInMbps;
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
    
    // Create a test file to upload (25MB)
    const chunkSize = 1 * 1024 * 1024; // 1MB chunks
    const totalSize = 25 * 1024 * 1024; // 25MB total
    const numChunks = Math.ceil(totalSize / chunkSize);
    
    console.log(`Creating ${numChunks} chunks of ${chunkSize / (1024 * 1024)}MB each for a total of ${totalSize / (1024 * 1024 * 1024)}GB`);
    
    // Create a single chunk to upload
    const chunk = new Uint8Array(chunkSize);
    for (let i = 0; i < chunk.length; i++) {
      chunk[i] = Math.floor(Math.random() * 256);
    }
    
    // Upload the chunk multiple times to simulate a larger file
    let totalUploaded = 0;
    let startTime = performance.now();
    let lastProgressUpdate = 0;
    
    // Upload in parallel for better throughput
    const maxConcurrentUploads = 3;
    const uploadPromises = [];
    
    // Start progress at 0%
    onProgress?.(0, 0);
    
    for (let i = 0; i < numChunks; i += maxConcurrentUploads) {
      const batchSize = Math.min(maxConcurrentUploads, numChunks - i);
      const batchPromises = [];
      
      for (let j = 0; j < batchSize; j++) {
        const promise = fetch(server.uploadUrl, {
          method: 'POST',
          body: chunk,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Upload failed: ${response.status} ${errorText}`);
          }
          
          const data = await response.json();
          if (data.error) {
            throw new Error(`Upload error: ${data.error}`);
          }
          
          totalUploaded += chunkSize;
          
          // Update progress
          const progress = Math.min(100, (totalUploaded / totalSize) * 100);
          const currentTime = performance.now();
          
          // Update progress every 0.25% or every 25ms
          if (progress - lastProgressUpdate >= 0.25 || currentTime - startTime >= 25) {
            const elapsed = (currentTime - startTime) / 1000; // in seconds
            const currentSpeed = (totalUploaded * 8) / (1024 * 1024 * elapsed); // in Mbps
            
            onProgress?.(progress, currentSpeed);
            lastProgressUpdate = progress;
            startTime = currentTime;
            
            // Log progress every 2MB
            if (totalUploaded % (2 * 1024 * 1024) < chunkSize) {
              console.log(`Uploaded ${(totalUploaded / (1024 * 1024)).toFixed(2)} MB (${progress.toFixed(1)}%) at ${currentSpeed.toFixed(2)} Mbps`);
            }
          }
          
          return data.speed || 0;
        });
        
        batchPromises.push(promise);
      }
      
      // Wait for the current batch to complete before starting the next batch
      const batchResults = await Promise.all(batchPromises);
      uploadPromises.push(...batchResults);
    }
    
    // Calculate average speed from all uploads
    const speeds = await Promise.all(uploadPromises);
    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    
    console.log(`Upload completed: Average speed: ${avgSpeed.toFixed(2)} Mbps`);
    
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