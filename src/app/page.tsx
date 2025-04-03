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
import { AdSense } from '@/components/AdSense';

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
          {/* Top ad */}
          <div className="w-full">
            <AdSense
              adSlot="1234567890" // Replace with your actual ad slot ID
              className="mb-8"
            />
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Check Your IP & Network Status
            </h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              Get detailed information about your IP address, location, and network performance with our comprehensive tools.
            </p>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">IP Information</h2>
            <button 
              onClick={refreshIPData}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh IP'}
            </button>
          </div>
          
          <div className="grid gap-8">
            <IpCard {...ipInfo} onRefresh={fetchIpInfo} isLoading={isLoading} />
            
            {/* Middle ad */}
            <AdSense
              adSlot="0987654321" // Replace with your actual ad slot ID
              className="my-8"
            />
            
            <SpeedTest 
              result={speedTestResult} 
              onRunTest={runSpeedTestHandler} 
              isLoading={isSpeedTestLoading} 
            />
            
            {/* Bottom ad */}
            <AdSense
              adSlot="5432109876" // Replace with your actual ad slot ID
              className="mt-8"
            />
          </div>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
