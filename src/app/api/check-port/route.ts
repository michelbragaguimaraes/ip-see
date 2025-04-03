import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get('host');
  const port = searchParams.get('port');

  if (!host || !port) {
    return NextResponse.json({ error: 'Host and port are required' }, { status: 400 });
  }

  try {
    const isOpen = await checkPort(host, parseInt(port));
    return NextResponse.json({ isOpen });
  } catch (error) {
    return NextResponse.json({ error: 'Port check failed' }, { status: 500 });
  }
}

async function checkPort(host: string, port: number): Promise<boolean> {
  try {
    const protocol = port === 443 ? 'https' : 'http';
    const response = await fetch(`${protocol}://${host}:${port}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    // If we get any error (timeout, connection refused, etc), port is closed
    return false;
  }
} 