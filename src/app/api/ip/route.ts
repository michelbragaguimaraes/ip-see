import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    // Get client IP from various headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    const trueClientIP = request.headers.get('true-client-ip');
    
    // Log all headers for debugging
    console.log('IP Detection Headers:', {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIP,
      'cf-connecting-ip': cfConnectingIP,
      'true-client-ip': trueClientIP,
      'remote-addr': request.headers.get('remote-addr'),
      'x-client-ip': request.headers.get('x-client-ip'),
      'x-forwarded': request.headers.get('x-forwarded'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    });

    // Try to get the most reliable IP
    let clientIP = cfConnectingIP || trueClientIP || realIP;
    
    // If we have x-forwarded-for, take the first IP (client's real IP)
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      clientIP = ips[0] || clientIP;
    }

    // If we still don't have an IP, try to get it from the request
    if (!clientIP) {
      const url = new URL(request.url);
      clientIP = url.searchParams.get('ip') || 'unknown';
    }

    console.log('Detected client IP:', clientIP);

    // Fetch IP info with the detected IP
    const ipInfoUrl = clientIP && clientIP !== 'unknown' 
      ? `https://ipinfo.io/${clientIP}/json` 
      : 'https://ipinfo.io/json';
    
    console.log('Fetching IP info from:', ipInfoUrl);
    
    const response = await fetch(ipInfoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`IP info API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('IP info response:', data);

    return new NextResponse(JSON.stringify({
      ...data,
      detectedIP: clientIP
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP information', details: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
} 