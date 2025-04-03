import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://ipinfo.io/json', {
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