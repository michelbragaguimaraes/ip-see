import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window
const ipRequests = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requestData = ipRequests.get(ip);

  if (!requestData) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (now - requestData.timestamp > RATE_LIMIT_WINDOW) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (requestData.count >= RATE_LIMIT_MAX) {
    return true;
  }

  requestData.count++;
  return false;
}

export async function GET(request: Request) {
  try {
    // Get client IP from request headers
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    '0.0.0.0';

    // Check rate limit
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

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
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    const status = errorMessage.includes('429') ? 429 : 
                   errorMessage.includes('403') ? 403 : 500;
                   
    return NextResponse.json(
      { 
        error: 'Failed to fetch IP information', 
        details: errorMessage,
        timestamp: Date.now()
      },
      { 
        status,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 