'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw, Mail, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { tempEmailService, Email } from '@/services/temp-email';
import DOMPurify from 'isomorphic-dompurify';

export default function TempEmailPage() {
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isCheckingEmails, setIsCheckingEmails] = useState(false);

  const generateNewEmail = async () => {
    setIsLoading(true);
    try {
      const email = await tempEmailService.generateEmail();
      setEmailAddress(email);
      setEmails([]);
      setSelectedEmail(null);
      toast.success('New email address generated');
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email address');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      toast.success('Email address copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const checkEmails = useCallback(async () => {
    if (!emailAddress || isCheckingEmails) return;
    setIsCheckingEmails(true);
    try {
      const messages = await tempEmailService.getEmails(emailAddress);
      
      // Check for new messages
      const newMessages = messages.filter(
        newMsg => !emails.some(existingMsg => existingMsg.id === newMsg.id)
      );
      
      if (newMessages.length > 0) {
        toast.info(`Received ${newMessages.length} new message${newMessages.length > 1 ? 's' : ''}`);
      }
      
      setEmails(messages);
    } catch (error) {
      console.error('Error checking emails:', error);
      toast.error('Failed to fetch emails');
    } finally {
      setIsCheckingEmails(false);
    }
  }, [emailAddress, emails, isCheckingEmails]);

  const viewEmail = async (id: string) => {
    try {
      const email = await tempEmailService.getEmailContent(emailAddress, id);
      setSelectedEmail(email);
    } catch (error) {
      console.error('Error viewing email:', error);
      toast.error('Failed to load email content');
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    if (!emailAddress) return;

    // Initial check
    checkEmails();

    // Set up interval for auto-refresh
    const interval = setInterval(checkEmails, 20000); // Check every 20 seconds

    // Cleanup interval on unmount or when email changes
    return () => clearInterval(interval);
  }, [emailAddress, checkEmails]);

  // Generate initial email on mount
  useEffect(() => {
    generateNewEmail();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster />
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Temporary Email</h1>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              Generate a temporary email address to protect your privacy and avoid spam.
              Messages are automatically checked every 20 seconds.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Temporary Email Address</CardTitle>
              <CardDescription>Use this email address to receive messages temporarily</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  value={emailAddress}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={generateNewEmail} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  New
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>Messages are checked automatically every 20 seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button onClick={checkEmails} disabled={isCheckingEmails}>
                  {isCheckingEmails ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
              
              {emails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Messages will appear here when you receive them</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <Card key={email.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewEmail(email.id)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{email.from}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(email.date).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-muted-foreground">{email.subject}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedEmail && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>{selectedEmail.subject}</CardTitle>
                    <CardDescription>
                      From: {selectedEmail.from}
                      <br />
                      Date: {new Date(selectedEmail.date).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(selectedEmail.htmlBody || selectedEmail.textBody) 
                      }} 
                    />
                    {selectedEmail.attachments.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Attachments:</h3>
                        <ul className="list-disc pl-4">
                          {selectedEmail.attachments.map((attachment) => (
                            <li key={attachment.filename}>
                              {attachment.filename} ({Math.round(attachment.size / 1024)} KB)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
} 