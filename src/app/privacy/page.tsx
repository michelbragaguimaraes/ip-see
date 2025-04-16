'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl prose dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="lead">
              At IP-See, we take your privacy seriously. This privacy policy describes how we collect, use, and protect your information.
            </p>

            <h2>Information We Collect</h2>
            <p>
              When you use IP-See, we collect the following information:
            </p>
            <ul>
              <li>Your IP address and related information (location, ISP, etc.)</li>
              <li>Speed test results</li>
              <li>Network diagnostic information</li>
              <li>Browser type and version</li>
              <li>Operating system information</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>
              We use the collected information to:
            </p>
            <ul>
              <li>Provide IP address and location information</li>
              <li>Conduct network speed tests</li>
              <li>Generate network diagnostics</li>
              <li>Improve our services</li>
              <li>Analyze usage patterns</li>
            </ul>

            <h2>Data Storage</h2>
            <p>
              All test results and history are stored locally in your browser using localStorage. 
              We do not store any personal information on our servers.
            </p>

            <h2>Third-Party Services</h2>
            <p>
              We use the following third-party services:
            </p>
            <ul>
              <li>Cloudflare for speed testing</li>
              <li>IP geolocation services</li>
              <li>Map providers for location visualization</li>
            </ul>

            <h2>Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access your data (stored locally in your browser)</li>
              <li>Export your test history</li>
              <li>Clear your test history</li>
              <li>Use the service without persistent storage</li>
            </ul>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact us through the Contact page.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 