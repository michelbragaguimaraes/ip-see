import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : headersList.get('x-real-ip');

    const response = await fetch(`https://ipinfo.io/${clientIp}/json`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch IP info');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP info' },
      { status: 500 }
    );
  }
} 