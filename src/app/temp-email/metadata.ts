import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temporary Email - IP-See",
  description: "Generate a temporary email address to protect your privacy and avoid spam. Free disposable email service with instant inbox access.",
  keywords: "temporary email, disposable email, temp mail, fake email, anonymous email, privacy email, spam protection, email privacy",
  openGraph: {
    title: "Temporary Email - IP-See",
    description: "Generate a temporary email address to protect your privacy and avoid spam. Free disposable email service with instant inbox access.",
    url: 'https://ip-see.com/temp-email',
    siteName: 'IP-See',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IP-See - Temporary Email Service',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Temporary Email - IP-See',
    description: 'Generate a temporary email address to protect your privacy and avoid spam. Free disposable email service with instant inbox access.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/temp-email',
  },
}; 