import { Metadata } from "next";

export const metadata: Metadata = {
  title: "IP Lookup - IP-See",
  description: "Look up detailed information about any IP address. Find location, ISP, organization, and network details for any IP in the world.",
  keywords: "IP lookup, IP address lookup, IP geolocation, IP information, IP details, IP location, IP ISP, IP organization, IP network, IP lookup tool",
  openGraph: {
    title: "IP Lookup - IP-See",
    description: "Look up detailed information about any IP address. Find location, ISP, organization, and network details for any IP in the world.",
    url: 'https://ip-see.com/ip-lookup',
    siteName: 'IP-See',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IP-See - IP Lookup Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IP Lookup - IP-See',
    description: 'Look up detailed information about any IP address. Find location, ISP, organization, and network details for any IP in the world.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/ip-lookup',
  },
}; 