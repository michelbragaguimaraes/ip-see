'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface HistoryEntry {
  type: 'ip' | 'speed';
  data: any;
  timestamp: Date;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('ip-see-history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })));
    }
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ip-see-history');
    toast.success('History cleared');
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ip-see-history-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('History exported');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Test History</h1>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              View your past speed tests and network diagnostics.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Tests</CardTitle>
              <CardDescription>Your network test history from this browser</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test history available
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{entry.type === 'ip' ? 'IP Check' : 'Speed Test'}</CardTitle>
                            <CardDescription>
                              {entry.timestamp.toLocaleString()}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={clearHistory}
                  disabled={history.length === 0}
                >
                  Clear History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
} 