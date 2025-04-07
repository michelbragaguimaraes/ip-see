'use client';

import { useEffect, useState } from 'react';
import { IpCard } from '@/components/IpCard';
import { SpeedTest } from '@/components/SpeedTest';
import { getIpInfo } from '@/lib/get-ip-info';
import { runSpeedTest, SpeedTestResult } from '@/lib/speed-test';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IPInfo } from "@/components/ip-info";
import { Traceroute } from "@/components/traceroute";
import { DNSLookup } from "@/components/dns-lookup";
import { PortScanner } from "@/components/port-scanner";
import { TempMail } from "@/components/temp-mail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [ipInfo, setIpInfo] = useState({
    ip: 'Loading...',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [speedTestResult, setSpeedTestResult] = useState<SpeedTestResult | null>(null);
  const [isSpeedTestLoading, setIsSpeedTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIpInfo = async () => {
    setIsLoading(true);
    try {
      const info = await getIpInfo();
      setIpInfo(info);
    } catch (error) {
      console.error('Error fetching IP info:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch IP information');
      setIpInfo({ ip: 'Error' });
    } finally {
      setIsLoading(false);
    }
  };

  const runSpeedTestHandler = async (
    serverId: string, 
    onProgress: (
      type: 'download' | 'upload' | 'ping', 
      progress: number, 
      currentSpeed: number,
      currentPing?: number,
      currentJitter?: number
    ) => void
  ) => {
    try {
      setIsSpeedTestLoading(true);
      toast.info('Starting speed test...');
      
      const result = await runSpeedTest(serverId, onProgress);
      
      if (result.download === 0 && result.ping === 0) {
        toast.error('Speed test failed. Please try again later.');
      } else {
        setSpeedTestResult(result);
        toast.success('Speed test completed!');
      }
    } catch (error) {
      console.error('Speed test error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run speed test. Please try again.');
    } finally {
      setIsSpeedTestLoading(false);
    }
  };

  const refreshIPData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/ip?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch IP data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('IP data refreshed:', data);
      
      setIpInfo(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing IP data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh IP data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIpInfo();
    
    // Add event listener for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchIpInfo();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">IP-See</h1>
            <p className="text-xl text-muted-foreground">
              Free IP address lookup, network diagnostics, and temporary email tools
            </p>
          </div>

          <div className="grid gap-8">
            <IPInfo />
            
            <Tabs defaultValue="speed" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="speed">Speed Test</TabsTrigger>
                <TabsTrigger value="traceroute">Traceroute</TabsTrigger>
                <TabsTrigger value="dns">DNS Lookup</TabsTrigger>
                <TabsTrigger value="ports">Port Scanner</TabsTrigger>
                <TabsTrigger value="mail">Temp Mail</TabsTrigger>
              </TabsList>
              <TabsContent value="speed">
                <Card>
                  <CardHeader>
                    <CardTitle>Network Speed Test</CardTitle>
                    <CardDescription>
                      Measure your download and upload speeds
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SpeedTest />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="traceroute">
                <Card>
                  <CardHeader>
                    <CardTitle>Network Traceroute</CardTitle>
                    <CardDescription>
                      Trace the network path to a destination
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Traceroute />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="dns">
                <Card>
                  <CardHeader>
                    <CardTitle>DNS Lookup</CardTitle>
                    <CardDescription>
                      Look up DNS records for a domain
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DNSLookup />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="ports">
                <Card>
                  <CardHeader>
                    <CardTitle>Port Scanner</CardTitle>
                    <CardDescription>
                      Check if common ports are open
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PortScanner />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="mail">
                <Card>
                  <CardHeader>
                    <CardTitle>Temporary Email</CardTitle>
                    <CardDescription>
                      Generate a temporary email address
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TempMail />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
