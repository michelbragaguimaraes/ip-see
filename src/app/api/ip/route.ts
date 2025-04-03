import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Get client IP from request headers
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    '0.0.0.0';

    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const ipInfoUrl = `https://ipinfo.io/${clientIP}/json?token=${process.env.IPINFO_TOKEN}&t=${timestamp}`;

    const response = await fetch(ipInfoUrl, {
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
      throw new Error(`IP info API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Add the detected IP and timestamp to the response
    return NextResponse.json({
      ...data,
      detectedIP: clientIP,
      timestamp
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP information', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 