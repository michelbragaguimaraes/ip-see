import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";

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
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TV3CWNWD');
          `}
        </Script>
        {/* End Google Tag Manager */}
        
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4861321135980201"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-TV3CWNWD"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
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
