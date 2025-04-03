import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - IP-See",
  description: "Get in touch with the IP-See team. Send us your questions, feedback, or business inquiries and we'll get back to you as soon as possible.",
  keywords: "contact, support, feedback, business inquiries, help, questions, IP-See contact",
  openGraph: {
    title: "Contact Us - IP-See",
    description: "Get in touch with the IP-See team. Send us your questions, feedback, or business inquiries and we'll get back to you as soon as possible.",
    url: 'https://ip-see.com/contact',
    siteName: 'IP-See',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IP-See - Contact Us',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us - IP-See',
    description: 'Get in touch with the IP-See team. Send us your questions, feedback, or business inquiries and we\'ll get back to you as soon as possible.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/contact',
  },
}; 