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
    
    // Get the requested size from the URL
    const url = new URL(request.url);
    const requestedSize = parseInt(url.searchParams.get('size') || '104857600', 10); // Default to 100MB
    
    // Create a ReadableStream to stream the data
    const stream = new ReadableStream({
      async start(controller) {
        let totalSent = 0;
        const chunkSize = 64 * 1024; // 64KB chunks
        
        while (totalSent < requestedSize) {
          const remainingSize = requestedSize - totalSent;
          const currentChunkSize = Math.min(chunkSize, remainingSize);
          const chunk = new Uint8Array(currentChunkSize);
          crypto.getRandomValues(chunk);
          controller.enqueue(chunk);
          totalSent += currentChunkSize;
          
          // Small delay to prevent overwhelming the connection
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        controller.close();
      }
    });
    
    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': requestedSize.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
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
    
    // Calculate actual upload speed based on the time it took to receive the data
    const duration = Math.max(0.001, (endTime - startTime) / 1000); // in seconds, minimum 0.001s
    const speedInMbps = (body.byteLength * 8) / (1024 * 1024 * duration);
    
    console.log(`Upload completed: ${(body.byteLength / (1024 * 1024)).toFixed(2)} MB in ${duration.toFixed(2)}s, Speed: ${speedInMbps.toFixed(2)} Mbps`);
    
    return NextResponse.json({ 
      speed: speedInMbps,
      size: body.byteLength,
      duration: duration
    });
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