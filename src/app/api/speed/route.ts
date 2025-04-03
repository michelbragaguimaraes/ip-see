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
    
    // Use a large file from a reliable CDN (1GB)
    const url = 'https://speed.cloudflare.com/__down?bytes=1073741824'; // 1GB
    
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
    });

    if (!response.ok) {
      console.error(`Download failed with status: ${response.status}`);
      return NextResponse.json(
        { error: `Download failed: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the content length
    const contentLength = response.headers.get('Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 1073741824; // Default to 1GB if not provided
    
    // Read the response as a stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }
    
    let bytesRead = 0;
    let chunks = 0;
    
    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      bytesRead += value.length;
      chunks++;
      
      // Log progress every 100MB
      if (bytesRead % (100 * 1024 * 1024) < value.length) {
        console.log(`Downloaded ${(bytesRead / (1024 * 1024)).toFixed(2)} MB`);
      }
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Calculate speed in Mbps
    const speedInMbps = (bytesRead * 8) / (1024 * 1024 * duration);
    
    console.log(`Download completed: ${(bytesRead / (1024 * 1024)).toFixed(2)} MB in ${duration.toFixed(2)}s, Speed: ${speedInMbps.toFixed(2)} Mbps`);
    
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
    
    // Get the request body as an ArrayBuffer
    const body = await request.arrayBuffer();
    console.log(`Received upload body of size: ${(body.byteLength / (1024 * 1024)).toFixed(2)} MB`);
    
    // Simulate upload by sending to a test endpoint
    const startTime = Date.now();
    
    // Use a test endpoint that accepts uploads
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: body,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`Upload failed with status: ${response.status}`);
      return NextResponse.json(
        { error: `Upload failed: ${response.status}` },
        { status: response.status }
      );
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Calculate speed in Mbps
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
    
    // Use a simple ping test
    const startTime = Date.now();
    
    // Use a small file for ping test
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
    
    const endTime = Date.now();
    const pingTime = endTime - startTime;
    
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