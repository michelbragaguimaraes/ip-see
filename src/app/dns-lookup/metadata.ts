import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DNS Lookup - IP-See",
  description: "Look up DNS records for any domain. Check A, AAAA, CNAME, MX, TXT, NS, and other DNS records with our free DNS lookup tool.",
  keywords: "DNS lookup, DNS records, DNS check, domain records, A record, CNAME, MX record, TXT record, NS record, DNS resolver, DNS tool",
  openGraph: {
    title: "DNS Lookup - IP-See",
    description: "Look up DNS records for any domain. Check A, AAAA, CNAME, MX, TXT, NS, and other DNS records with our free DNS lookup tool.",
    url: 'https://ip-see.com/dns-lookup',
    siteName: 'IP-See',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IP-See - DNS Lookup Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS Lookup - IP-See',
    description: 'Look up DNS records for any domain. Check A, AAAA, CNAME, MX, TXT, NS, and other DNS records with our free DNS lookup tool.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/dns-lookup',
  },
}; 