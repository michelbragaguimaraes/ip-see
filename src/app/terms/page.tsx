'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl prose dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <p>
            By using IP-See, you agree to these terms. Please read them carefully.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using IP-See, you accept and agree to be bound by the terms
            and provision of this agreement.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily access the materials (information or software)
            on IP-See for personal, non-commercial viewing only.
          </p>

          <h2>3. Disclaimer</h2>
          <p>
            The materials on IP-See are provided on an 'as is' basis. IP-See makes no
            warranties, expressed or implied, and hereby disclaims and negates all other
            warranties including, without limitation, implied warranties or conditions of
            merchantability, fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </p>

          <h2>4. Limitations</h2>
          <p>
            In no event shall IP-See or its suppliers be liable for any damages (including,
            without limitation, damages for loss of data or profit, or due to business
            interruption) arising out of the use or inability to use the materials on IP-See.
          </p>

          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on IP-See could include technical, typographical, or
            photographic errors. IP-See does not warrant that any of the materials on its
            website are accurate, complete, or current.
          </p>

          <h2>6. Links</h2>
          <p>
            IP-See has not reviewed all of the sites linked to its website and is not
            responsible for the contents of any such linked site. The inclusion of any link
            does not imply endorsement by IP-See of the site.
          </p>

          <h2>7. Modifications</h2>
          <p>
            IP-See may revise these terms of service at any time without notice. By using
            this website, you are agreeing to be bound by the then current version of these
            terms of service.
          </p>

          <h2>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with
            applicable laws, and any disputes shall be subject to the exclusive jurisdiction
            of the courts.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us through the Contact page.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
} 