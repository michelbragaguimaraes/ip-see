import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_SPEED_TEST = {
  PING: 'https://speed.cloudflare.com/__ping',
  DOWNLOAD: 'https://speed.cloudflare.com/__down',
  UPLOAD: 'https://speed.cloudflare.com/__up'
};

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Function to generate random data
function generateRandomData(size: number): Uint8Array {
  const data = new Uint8Array(size);
  const chunkSize = 65536; // 64KB chunks for better performance
  const chunk = new Uint8Array(chunkSize);
  
  // Generate one chunk of random data and reuse it
  for (let i = 0; i < chunkSize; i++) {
    chunk[i] = Math.floor(Math.random() * 256);
  }
  
  // Copy the chunk multiple times
  for (let offset = 0; offset < size; offset += chunkSize) {
    const slice = Math.min(chunkSize, size - offset);
    data.set(chunk.slice(0, slice), offset);
  }
  
  return data;
}

// Handle download request
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    if (type === 'ping') {
      // Ping test - just return current timestamp
      return NextResponse.json({ ping: 0 }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else if (type === 'download') {
      // Download test - generate random data
      const requestedBytes = searchParams.get('bytes');
      if (!requestedBytes) {
        return NextResponse.json({ error: 'Missing bytes parameter' }, { status: 400 });
      }

      const bytes = parseInt(requestedBytes, 10);
      if (isNaN(bytes) || bytes <= 0) {
        return NextResponse.json({ error: 'Invalid bytes parameter' }, { status: 400 });
      }

      // Increased cap to 128MB for longer test duration
      const size = Math.min(bytes, 128 * 1024 * 1024);
      console.log(`Generating ${size} bytes of data`); // Debug log
      
      // Create a ReadableStream to send data in chunks
      const stream = new ReadableStream({
        async start(controller) {
          const chunkSize = 1024 * 1024; // 1MB chunks for better throughput
          const totalChunks = Math.ceil(size / chunkSize);
          let sentBytes = 0;
          
          // Pre-generate a large chunk of random data to reuse
          const dataChunk = generateRandomData(chunkSize);
          
          for (let i = 0; i < totalChunks; i++) {
            const currentChunkSize = Math.min(chunkSize, size - sentBytes);
            // Reuse the pre-generated chunk or slice it if needed
            const chunk = currentChunkSize === chunkSize ? 
              dataChunk : 
              dataChunk.slice(0, currentChunkSize);
            
            controller.enqueue(chunk);
            sentBytes += currentChunkSize;
            
            // Only add minimal delay every 8MB to allow for progress updates
            if (i % 8 === 0) {
              await new Promise(resolve => setTimeout(resolve, 1));
            }
          }
          
          controller.close();
        }
      });
      
      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': size.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'Content-Length'
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Speed test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Handle upload request
export async function POST(request: NextRequest) {
  try {
    const data = await request.arrayBuffer();
    
    // Return success response immediately
    return NextResponse.json({ 
      success: true,
      size: data.byteLength
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 