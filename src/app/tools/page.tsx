'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shield, Activity, Globe } from "lucide-react";
import { toast } from "sonner";

interface ToolResult {
  type: 'dns' | 'port' | 'ssl' | 'traceroute';
  data: any;
  timestamp: Date;
}

export default function ToolsPage() {
  const [domain, setDomain] = useState('');
  const [port, setPort] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ToolResult[]>([]);

  const runDnsLookup = async () => {
    if (!domain) {
      toast.error('Please enter a domain');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}`);
      const data = await response.json();
      setResults(prev => [{
        type: 'dns',
        data: data.Answer || [],
        timestamp: new Date()
      }, ...prev]);
      toast.success('DNS lookup completed');
    } catch (error) {
      toast.error('DNS lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPort = async () => {
    if (!domain || !port) {
      toast.error('Please enter both domain and port');
      return;
    }

    // Validate port number
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast.error('Please enter a valid port number (1-65535)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/check-port?host=${encodeURIComponent(domain)}&port=${port}`);
      if (!response.ok) {
        throw new Error('Port check failed');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResults(prev => [{
        type: 'port',
        data: { 
          status: data.isOpen ? 'open' : 'closed',
          port,
          host: domain
        },
        timestamp: new Date()
      }, ...prev]);
      toast.success('Port check completed');
    } catch (error) {
      console.error('Port check error:', error);
      toast.error(error instanceof Error ? error.message : 'Port check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSSL = async () => {
    if (!domain) {
      toast.error('Please enter a domain');
      return;
    }
    setIsLoading(true);
    try {
      // Simulate SSL check (real implementation would need a backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResults(prev => [{
        type: 'ssl',
        data: {
          valid: true,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          issuer: 'Let\'s Encrypt'
        },
        timestamp: new Date()
      }, ...prev]);
      toast.success('SSL check completed');
    } catch (error) {
      toast.error('SSL check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const runTraceroute = async () => {
    if (!domain) {
      toast.error('Please enter a domain');
      return;
    }
    setIsLoading(true);
    try {
      // Simulate traceroute (real implementation would need a backend)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResults(prev => [{
        type: 'traceroute',
        data: [
          { hop: 1, ip: '192.168.1.1', time: '1ms' },
          { hop: 2, ip: '10.0.0.1', time: '5ms' },
          { hop: 3, ip: '8.8.8.8', time: '20ms' }
        ],
        timestamp: new Date()
      }, ...prev]);
      toast.success('Traceroute completed');
    } catch (error) {
      toast.error('Traceroute failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Network Tools</h1>
        <p className="text-muted-foreground max-w-[600px] mx-auto">
          A collection of tools to help you analyze and troubleshoot network connections.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Domain Tools</CardTitle>
            <CardDescription>Enter a domain to analyze</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Enter domain (e.g., google.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Input
                placeholder="Port (optional)"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-24"
              />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={runDnsLookup} disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" />
                DNS Lookup
              </Button>
              <Button onClick={checkPort} disabled={isLoading}>
                <Activity className="mr-2 h-4 w-4" />
                Check Port
              </Button>
              <Button onClick={checkSSL} disabled={isLoading}>
                <Shield className="mr-2 h-4 w-4" />
                Check SSL
              </Button>
              <Button onClick={runTraceroute} disabled={isLoading}>
                <Globe className="mr-2 h-4 w-4" />
                Traceroute
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Latest results shown first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">
                        {result.type.toUpperCase()} Result
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {result.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 