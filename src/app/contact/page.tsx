'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Github, Twitter } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              Get in touch with me through any of the channels below.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Choose the method that works best for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Email</h3>
                <p className="text-sm text-muted-foreground">
                  For support and business inquiries:{' '}
                  <a 
                    href="mailto:michelbragaguimaraes@gmail.com"
                    className="hover:underline text-primary"
                  >
                    michelbragaguimaraes@gmail.com
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Social Media</h3>
                <div className="space-y-2">
                  <a 
                    href="https://x.com/omichelbraga" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    @omichelbraga on X
                  </a>
                  <a 
                    href="https://github.com/michelbragaguimaraes" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    @michelbragaguimaraes on GitHub
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  I typically respond to inquiries within 24-48 hours during business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
} 