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
    
    // Use a large file from a fast CDN for direct browser download
    const url = 'https://cdn.jsdelivr.net/gh/jquery/jquery@3.7.1/dist/jquery.min.js';
    const response = await fetch(url + '?' + new Date().getTime(), {
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
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    
    if (!totalBytes) {
      throw new Error('Could not determine file size');
    }

    let downloadedBytes = 0;
    let startTime = performance.now();
    let lastProgressTime = startTime;
    let lastBytesRead = 0;
    let speedSamples: number[] = [];

    // Start progress at 0%
    onProgress?.(0, 0);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    // Read the stream in chunks
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      downloadedBytes += value.length;
      const progress = (downloadedBytes / totalBytes) * 100;
      const currentTime = performance.now();
      const timeDiff = currentTime - lastProgressTime;

      // Calculate speed every 200ms
      if (timeDiff >= 200) {
        const bytesDiff = downloadedBytes - lastBytesRead;
        const currentSpeed = (bytesDiff * 8) / (timeDiff / 1000) / (1024 * 1024); // Mbps
        speedSamples.push(currentSpeed);
        
        onProgress?.(progress, currentSpeed);
        
        lastProgressTime = currentTime;
        lastBytesRead = downloadedBytes;
      }
    }

    const totalTime = (performance.now() - startTime) / 1000; // in seconds
    
    // Calculate average speed excluding the lowest and highest 10% of samples
    const sortedSpeeds = speedSamples.sort((a, b) => a - b);
    const trimAmount = Math.floor(speedSamples.length * 0.1);
    const trimmedSpeeds = sortedSpeeds.slice(trimAmount, -trimAmount);
    const avgSpeed = trimmedSpeeds.reduce((a, b) => a + b, 0) / trimmedSpeeds.length;

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

    // Create test data (25MB)
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalSize = 25 * chunkSize; // 25MB total
    const chunk = new Uint8Array(chunkSize).fill(0);
    
    let uploadedBytes = 0;
    let startTime = performance.now();
    let lastProgressTime = startTime;
    let lastBytesUploaded = 0;
    let speedSamples: number[] = [];

    // Start progress at 0%
    onProgress?.(0, 0);

    // Upload in chunks
    while (uploadedBytes < totalSize) {
      const remainingBytes = totalSize - uploadedBytes;
      const currentChunkSize = Math.min(chunkSize, remainingBytes);
      
      // Create form data with the current chunk
      const formData = new FormData();
      formData.append('file', new Blob([chunk.slice(0, currentChunkSize)]), 'test.bin');

      // Upload the chunk
      const response = await fetch(server.url + '?' + new Date().getTime(), {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      uploadedBytes += currentChunkSize;
      const progress = (uploadedBytes / totalSize) * 100;
      const currentTime = performance.now();
      const timeDiff = currentTime - lastProgressTime;

      // Calculate speed every 200ms
      if (timeDiff >= 200) {
        const bytesDiff = uploadedBytes - lastBytesUploaded;
        const currentSpeed = (bytesDiff * 8) / (timeDiff / 1000) / (1024 * 1024); // Mbps
        speedSamples.push(currentSpeed);
        
        onProgress?.(progress, currentSpeed);
        
        lastProgressTime = currentTime;
        lastBytesUploaded = uploadedBytes;
      }

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const totalTime = (performance.now() - startTime) / 1000; // in seconds
    
    // Calculate average speed excluding the lowest and highest 10% of samples
    const sortedSpeeds = speedSamples.sort((a, b) => a - b);
    const trimAmount = Math.floor(speedSamples.length * 0.1);
    const trimmedSpeeds = sortedSpeeds.slice(trimAmount, -trimAmount);
    const avgSpeed = trimmedSpeeds.reduce((a, b) => a + b, 0) / trimmedSpeeds.length;

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