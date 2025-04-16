import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Traceroute - IP-See",
  description: "Trace the network path to any host. See the hops between your computer and the destination with our free traceroute tool.",
  keywords: "traceroute, network path, network hops, route tracing, network diagnostics, network troubleshooting, ping path, network latency, network routing, network tool",
  openGraph: {
    title: "Traceroute - IP-See",
    description: "Trace the network path to any host. See the hops between your computer and the destination with our free traceroute tool.",
    url: 'https://ip-see.com/traceroute',
    siteName: 'IP-See',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IP-See - Traceroute Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Traceroute - IP-See',
    description: 'Trace the network path to any host. See the hops between your computer and the destination with our free traceroute tool.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/traceroute',
  },
}; 