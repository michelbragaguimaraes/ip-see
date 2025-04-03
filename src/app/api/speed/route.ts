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
    } else {
      url = 'https://speed.cloudflare.com/__ping';
    }

    const response = await fetch(url, {
      method: type === 'upload' ? 'POST' : 'GET',
      body: type === 'upload' ? new ArrayBuffer(Number(bytes)) : undefined,
    });

    if (!response.ok) {
      throw new Error('Speed test request failed');
    }

    const data = await response.arrayBuffer();
    return new NextResponse(data);
  } catch (error) {
    console.error('Speed test error:', error);
    return NextResponse.json(
      { error: 'Speed test failed' },
      { status: 500 }
    );
  }
} 