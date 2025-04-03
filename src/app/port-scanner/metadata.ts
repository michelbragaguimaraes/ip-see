import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Port Scanner - IP-See",
  description: "Scan open ports on any IP address or domain. Check which services are running and identify potential security vulnerabilities.",
  keywords: "port scanner, open ports, port scan, network security, port check, service detection, network vulnerability, port testing, TCP scan, UDP scan",
  openGraph: {
    title: "Port Scanner - IP-See",
    description: "Scan open ports on any IP address or domain. Check which services are running and identify potential security vulnerabilities.",
    url: 'https://ip-see.com/port-scanner',
    siteName: 'IP-See',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IP-See - Port Scanner Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Port Scanner - IP-See',
    description: 'Scan open ports on any IP address or domain. Check which services are running and identify potential security vulnerabilities.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/port-scanner',
  },
}; 