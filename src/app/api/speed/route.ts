import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bytes = searchParams.get('bytes');
  const type = searchParams.get('type');

  try {
    let url = '';
    if (type === 'download') {
      url = `https://speed.cloudflare.com/__down?bytes=${bytes}`;
    } else if (type === 'upload') {
      url = 'https://speed.cloudflare.com/__up';
    } else if (type === 'ping') {
      // For ping, we'll use a small download request instead of the ping endpoint
      // This is more reliable and works better with VPNs
      url = 'https://speed.cloudflare.com/__down?bytes=1024';
    }

    const response = await fetch(url, {
      method: type === 'upload' ? 'POST' : 'GET',
      body: type === 'upload' ? new ArrayBuffer(Number(bytes)) : undefined,
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Speed test request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': type === 'download' || type === 'ping' ? 'application/octet-stream' : 'text/plain'
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
        'Content-Type': 'application/octet-stream'
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