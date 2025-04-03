import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IP-See - IP Address & Network Information Tools",
  description: "Free IP address lookup, network diagnostics, and temporary email tools. Check your IP, location, DNS, traceroute, port scanner, and more.",
  keywords: "IP lookup, IP address, network tools, DNS lookup, traceroute, port scanner, temporary email, network diagnostics, IP information, network status",
  authors: [{ name: "Michel Braga Guimaraes" }],
  creator: "Michel Braga Guimaraes",
  publisher: "IP-See",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ip-see.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "IP-See - IP Address & Network Information Tools",
    description: "Free IP address lookup, network diagnostics, and temporary email tools. Check your IP, location, DNS, traceroute, port scanner, and more.",
    url: 'https://ip-see.com',
    siteName: 'IP-See',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IP-See - Network Information Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IP-See - IP Address & Network Information Tools',
    description: 'Free IP address lookup, network diagnostics, and temporary email tools. Check your IP, location, DNS, traceroute, port scanner, and more.',
    images: ['/og-image.png'],
    creator: '@michelbragaguimaraes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Replace with your actual verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
