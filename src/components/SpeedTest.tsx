import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, Activity, Share2, Download as DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { SpeedTestResult, speedTestServers } from "@/lib/speed-test";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SpeedTestProps {
  result: SpeedTestResult | null;
  onRunTest: (
    serverId: string,
    onProgress: (
      type: 'download' | 'upload' | 'ping',
      progress: number,
      currentSpeed: number,
      currentPing?: number,
      currentJitter?: number
    ) => void
  ) => Promise<void>;
  isLoading: boolean;
}

interface SpeedHistory {
  timestamp: string;
  download: number;
  upload: number;
  ping: number;
}

export function SpeedTest({ result, onRunTest, isLoading }: SpeedTestProps) {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState({ download: 0, upload: 0 });
  const [currentPing, setCurrentPing] = useState(0);
  const [currentJitter, setCurrentJitter] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<SpeedHistory[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [selectedServer, setSelectedServer] = useState('cloudflare');

  useEffect(() => {
    // Load speed history from localStorage
    const savedHistory = localStorage.getItem('speed-test-history');
    if (savedHistory) {
      setSpeedHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (result) {
      const newHistory = [{
        timestamp: new Date().toISOString(),
        download: result.download,
        upload: result.upload,
        ping: result.ping
      }, ...speedHistory].slice(0, 100);

      setSpeedHistory(newHistory);
      localStorage.setItem('speed-test-history', JSON.stringify(newHistory));

      // Save to global history
      const savedHistory = localStorage.getItem('ip-see-history') || '[]';
      const history = JSON.parse(savedHistory);
      history.unshift({
        type: 'speed',
        data: {
          ...result,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('ip-see-history', JSON.stringify(history.slice(0, 100)));
    }
  }, [result]);

  const handleProgress = (
    type: 'download' | 'upload' | 'ping',
    progress: number,
    speed: number,
    ping?: number,
    jitter?: number
  ) => {
    if (type === 'download') {
      setDownloadProgress(progress);
      setCurrentSpeed(prev => ({ ...prev, download: speed }));
    } else if (type === 'upload') {
      setUploadProgress(progress);
      setCurrentSpeed(prev => ({ ...prev, upload: speed }));
    } else if (type === 'ping') {
      if (ping !== undefined) setCurrentPing(ping);
      if (jitter !== undefined) setCurrentJitter(jitter);
    }
  };

  const handleShare = async () => {
    if (!result) return;

    const text = `Speed Test Results:
Download: ${result.download.toFixed(2)} Mbps
Upload: ${result.upload.toFixed(2)} Mbps
Ping: ${result.ping.toFixed(2)} ms
Jitter: ${result.jitter.toFixed(2)} ms`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Speed Test Results',
          text,
          url: window.location.href
        });
        toast.success('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
  };

  const handleExport = () => {
    if (!speedHistory.length) return;

    const dataStr = JSON.stringify(speedHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `speed-test-history-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Speed test history exported');
  };

  const formatSpeed = (speed: number) => {
    return speed < 1 ? `${(speed * 1000).toFixed(0)} Kbps` : `${speed.toFixed(1)} Mbps`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Speed Test</CardTitle>
            <CardDescription>Test your internet connection speed</CardDescription>
          </div>
          {result && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </span>
              <span>{isLoading ? formatSpeed(currentSpeed.download) : (result ? formatSpeed(result.download) : '0 Mbps')}</span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </span>
              <span>{isLoading ? formatSpeed(currentSpeed.upload) : (result ? formatSpeed(result.upload) : '0 Mbps')}</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Ping
                </span>
                <span>{isLoading ? `${currentPing.toFixed(1)} ms` : (result ? `${result.ping.toFixed(1)} ms` : '0 ms')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Jitter
                </span>
                <span>{isLoading ? `${currentJitter.toFixed(1)} ms` : (result ? `${result.jitter.toFixed(1)} ms` : '0 ms')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={() => onRunTest(selectedServer, handleProgress)}
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Start Test'}
          </Button>
          {speedHistory.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowGraph(!showGraph)}
            >
              {showGraph ? 'Hide History' : 'Show History'}
            </Button>
          )}
        </div>

        {showGraph && speedHistory.length > 0 && (
          <div className="h-[300px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedHistory.slice(0, 10).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(2)} Mbps`]}
                />
                <Line
                  type="monotone"
                  dataKey="download"
                  stroke="#2563eb"
                  name="Download"
                />
                <Line
                  type="monotone"
                  dataKey="upload"
                  stroke="#16a34a"
                  name="Upload"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 