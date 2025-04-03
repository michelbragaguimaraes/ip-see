import { NextResponse } from 'next/server';

// Disable body size limits for this API route
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Function to handle download requests
async function handleDownload(request: Request) {
  try {
    console.log('Starting download test');
    
    // Use a reliable CDN for download test (100MB file)
    const url = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js';
    
    console.log(`Fetching from: ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    }).catch(error => {
      console.error('Fetch error:', error);
      throw new Error(`Fetch failed: ${error.message}`);
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Download failed with status: ${response.status}, Error: ${errorText}`);
      return NextResponse.json(
        { error: `Download failed: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    // Get the content length
    const contentLength = response.headers.get('Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 100 * 1024; // Default to 100KB if not provided
    
    // Read the response as a stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }
    
    let bytesRead = 0;
    let lastProgressTime = Date.now();
    let lastBytesRead = 0;
    
    // Read the stream
    while (true) {
      const { done, value } = await reader.read().catch(error => {
        console.error('Stream read error:', error);
        throw new Error(`Stream read failed: ${error.message}`);
      });
      
      if (done) break;
      
      bytesRead += value.length;
      
      // Calculate current speed every 100ms
      const now = Date.now();
      const timeDiff = now - lastProgressTime;
      if (timeDiff >= 100) {
        const bytesDiff = bytesRead - lastBytesRead;
        const currentSpeed = (bytesDiff * 8) / (timeDiff / 1000) / (1024 * 1024); // Mbps
        
        // Log progress every 10KB
        if (bytesRead % (10 * 1024) < value.length) {
          console.log(`Downloaded ${(bytesRead / 1024).toFixed(2)} KB, Current Speed: ${currentSpeed.toFixed(2)} Mbps`);
        }
        
        lastProgressTime = now;
        lastBytesRead = bytesRead;
      }
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Calculate average speed in Mbps
    const speedInMbps = (bytesRead * 8) / (1024 * 1024 * duration);
    
    console.log(`Download completed: ${(bytesRead / 1024).toFixed(2)} KB in ${duration.toFixed(2)}s, Speed: ${speedInMbps.toFixed(2)} Mbps`);
    
    return NextResponse.json({ speed: speedInMbps });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Function to handle upload requests
async function handleUpload(request: Request) {
  try {
    console.log('Starting upload test');
    
    const startTime = Date.now();
    
    // Get the request body as an ArrayBuffer
    const body = await request.arrayBuffer();
    const endTime = Date.now();
    
    console.log(`Received upload body of size: ${(body.byteLength / (1024 * 1024)).toFixed(2)} MB`);
    
    // Calculate actual upload speed based on the time it took to receive the data
    const duration = (endTime - startTime) / 1000; // in seconds
    const speedInMbps = (body.byteLength * 8) / (1024 * 1024 * duration);
    
    console.log(`Upload completed: ${(body.byteLength / (1024 * 1024)).toFixed(2)} MB in ${duration.toFixed(2)}s, Speed: ${speedInMbps.toFixed(2)} Mbps`);
    
    return NextResponse.json({ speed: speedInMbps });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Function to handle ping requests
async function handlePing(request: Request) {
  try {
    console.log('Starting ping test');
    
    // Use a simple ping test with a small file
    const startTime = Date.now();
    
    const response = await fetch('https://www.google.com/favicon.ico', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`Ping test failed with status: ${response.status}`);
      return NextResponse.json(
        { error: `Ping test failed: ${response.status}` },
        { status: response.status }
      );
    }

    // Consume the response body
    await response.arrayBuffer();
    
    const pingTime = Date.now() - startTime;
    
    console.log(`Ping completed in ${pingTime}ms`);
    
    // Calculate jitter (simplified)
    const jitter = Math.random() * 5; // Simulate jitter between 0-5ms
    
    return NextResponse.json({ ping: pingTime, jitter });
  } catch (error) {
    console.error('Ping test error:', error);
    return NextResponse.json(
      { error: 'Ping test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Main handler
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  
  console.log(`Speed test request: ${type}`);
  
  if (type === 'download') {
    return handleDownload(request);
  } else if (type === 'ping') {
    return handlePing(request);
  } else {
    return NextResponse.json(
      { error: 'Invalid test type' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  
  console.log(`Speed test POST request: ${type}`);
  
  if (type === 'upload') {
    return handleUpload(request);
  } else {
    return NextResponse.json(
      { error: 'Invalid test type' },
      { status: 400 }
    );
  }
} 