import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Share2, Download, Copy } from "lucide-react";
import { LocationMap } from "./LocationMap";
import { toast } from "sonner";

interface IpCardProps {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export function IpCard({
  ip,
  city,
  region,
  country,
  loc,
  org,
  postal,
  timezone,
  onRefresh,
  isLoading
}: IpCardProps) {
  // Add auto-refresh on mount
  useEffect(() => {
    // Refresh on mount
    onRefresh();

    // Add event listener for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onRefresh]);

  const handleShare = async () => {
    const data = {
      ip,
      city,
      region,
      country,
      loc,
      org,
      postal,
      timezone,
      timestamp: new Date().toISOString()
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'IP Information',
          text: `My IP: ${ip}\nLocation: ${city}, ${region}, ${country}`,
          url: window.location.href
        });
        toast.success('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success('Copied to clipboard');
    }
  };

  const handleExport = () => {
    const data = {
      ip,
      city,
      region,
      country,
      loc,
      org,
      postal,
      timezone,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ip-info-${ip}-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('IP info exported');

    // Save to history
    const savedHistory = localStorage.getItem('ip-see-history') || '[]';
    const history = JSON.parse(savedHistory);
    history.unshift({
      type: 'ip',
      data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('ip-see-history', JSON.stringify(history.slice(0, 100)));
  };

  const handleCopyIp = async () => {
    await navigator.clipboard.writeText(ip);
    toast.success('IP copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>IP Information</CardTitle>
            <CardDescription>Your current IP address and location details</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">IP Address</p>
              {isLoading ? (
                <Skeleton className="h-4 w-[100px]" />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{ip}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyIp}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Location</p>
              {isLoading ? (
                <Skeleton className="h-4 w-[150px]" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {[city, region, country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Organization</p>
              {isLoading ? (
                <Skeleton className="h-4 w-[150px]" />
              ) : (
                <p className="text-sm text-muted-foreground">{org || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Postal Code</p>
              {isLoading ? (
                <Skeleton className="h-4 w-[100px]" />
              ) : (
                <p className="text-sm text-muted-foreground">{postal || 'N/A'}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Timezone</p>
              {isLoading ? (
                <Skeleton className="h-4 w-[100px]" />
              ) : (
                <p className="text-sm text-muted-foreground">{timezone || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>
        {loc && !isLoading && (
          <div className="h-[300px] rounded-md overflow-hidden border">
            <LocationMap 
              latitude={Number(loc.split(',')[0])} 
              longitude={Number(loc.split(',')[1])} 
              city={city}
              country={country}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 