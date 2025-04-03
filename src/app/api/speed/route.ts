import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Increase the body size limit for the API route
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    let url = '';
    if (type === 'download') {
      url = 'https://speed.cloudflare.com/__down?bytes=1073741824'; // Exactly 1GB
    } else if (type === 'ping') {
      url = 'https://speed.cloudflare.com/__down?bytes=1024';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Speed test request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.arrayBuffer();
    
    return new NextResponse(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Content-Type': 'application/octet-stream'
      }
    });
  } catch (error) {
    console.error('Speed test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Speed test failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.arrayBuffer();
    const response = await fetch('https://speed.cloudflare.com/__up', {
      method: 'POST',
      body: data,
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.arrayBuffer();
    return new NextResponse(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/octet-stream'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
} 