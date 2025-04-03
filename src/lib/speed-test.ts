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
    let lastBytesRead = 0;
    let speedSamples: number[] = [];
    let totalChunks = 50; // We'll get this from the first response
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalSize = totalChunks * chunkSize;
    const maxConcurrentDownloads = 3; // Number of parallel downloads

    // Start progress at 0%
    onProgress?.(0, 0);

    // Download chunks in parallel batches
    for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber += maxConcurrentDownloads) {
      const downloadPromises = [];
      
      // Create a batch of download promises
      for (let i = 0; i < maxConcurrentDownloads && (chunkNumber + i) < totalChunks; i++) {
        const currentChunk = chunkNumber + i;
        const promise = fetch(`${server.url}&chunk=${currentChunk}&t=${new Date().getTime()}`, {
          method: 'GET',
          cache: 'no-store'
        }).then(async response => {
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Download failed: ${response.status} ${errorText}`);
          }

          // Update total chunks from the first response
          if (currentChunk === 0) {
            const totalChunksHeader = response.headers.get('X-Total-Chunks');
            if (totalChunksHeader) {
              totalChunks = parseInt(totalChunksHeader, 10);
            }
          }

          return response.arrayBuffer();
        });
        
        downloadPromises.push(promise);
      }

      // Wait for all downloads in this batch to complete
      const chunks = await Promise.all(downloadPromises);
      
      // Update progress and speed
      for (const chunk of chunks) {
        downloadedBytes += chunk.byteLength;
        const progress = (downloadedBytes / totalSize) * 100;
        const currentTime = performance.now();
        const timeDiff = currentTime - lastProgressTime;

        // Calculate speed every 100ms
        if (timeDiff >= 100) {
          const bytesDiff = downloadedBytes - lastBytesRead;
          const currentSpeed = (bytesDiff * 8) / (timeDiff / 1000) / (1024 * 1024); // Mbps
          speedSamples.push(currentSpeed);
          
          onProgress?.(progress, currentSpeed);
          
          lastProgressTime = currentTime;
          lastBytesRead = downloadedBytes;
        }
      }
    }

    const totalTime = (performance.now() - startTime) / 1000; // in seconds
    
    // Calculate average speed excluding the lowest and highest 10% of samples
    const sortedSpeeds = speedSamples.sort((a, b) => a - b);
    const trimAmount = Math.floor(speedSamples.length * 0.1);
    const trimmedSpeeds = sortedSpeeds.slice(trimAmount, -trimAmount);
    const avgSpeed = trimmedSpeeds.reduce((a, b) => a + b, 0) / trimmedSpeeds.length || 0;

    console.log(`Download completed: ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB in ${totalTime.toFixed(2)}s`);
    
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

    // Create test data (50MB total in 5MB chunks)
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const totalSize = 50 * 1024 * 1024; // 50MB total
    const chunk = new Uint8Array(chunkSize);
    crypto.getRandomValues(chunk); // Fill with random data
    
    let uploadedBytes = 0;
    let startTime = performance.now();
    let lastProgressTime = startTime;
    let lastBytesUploaded = 0;
    let speedSamples: number[] = [];
    const maxConcurrentUploads = 2; // Number of parallel uploads

    // Start progress at 0%
    onProgress?.(0, 0);

    // Upload chunks in parallel batches
    for (let offset = 0; offset < totalSize; offset += chunkSize * maxConcurrentUploads) {
      const uploadPromises = [];
      
      // Create a batch of upload promises
      for (let i = 0; i < maxConcurrentUploads && (offset + i * chunkSize) < totalSize; i++) {
        const currentOffset = offset + i * chunkSize;
        const currentSize = Math.min(chunkSize, totalSize - currentOffset);
        
        const promise = fetch(server.uploadUrl + '&t=' + new Date().getTime(), {
          method: 'POST',
          body: chunk.slice(0, currentSize),
          cache: 'no-store'
        }).then(async response => {
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
          return currentSize;
        });
        
        uploadPromises.push(promise);
      }

      // Wait for all uploads in this batch to complete
      const uploadedSizes = await Promise.all(uploadPromises);
      
      // Update progress and speed
      for (const size of uploadedSizes) {
        uploadedBytes += size;
        const progress = (uploadedBytes / totalSize) * 100;
        const currentTime = performance.now();
        const timeDiff = currentTime - lastProgressTime;

        // Calculate speed every 100ms
        if (timeDiff >= 100) {
          const bytesDiff = uploadedBytes - lastBytesUploaded;
          const currentSpeed = (bytesDiff * 8) / (timeDiff / 1000) / (1024 * 1024); // Mbps
          speedSamples.push(currentSpeed);
          
          onProgress?.(progress, currentSpeed);
          
          lastProgressTime = currentTime;
          lastBytesUploaded = uploadedBytes;
        }
      }
    }

    const totalTime = (performance.now() - startTime) / 1000; // in seconds
    
    // Calculate average speed excluding the lowest and highest 10% of samples
    const sortedSpeeds = speedSamples.sort((a, b) => a - b);
    const trimAmount = Math.floor(speedSamples.length * 0.1);
    const trimmedSpeeds = sortedSpeeds.slice(trimAmount, -trimAmount);
    const avgSpeed = trimmedSpeeds.reduce((a, b) => a + b, 0) / trimmedSpeeds.length || 0;

    console.log(`Upload completed: ${(uploadedBytes / (1024 * 1024)).toFixed(2)} MB in ${totalTime.toFixed(2)}s`);
    
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