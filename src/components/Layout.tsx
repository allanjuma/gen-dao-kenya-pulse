
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isConnected, isLoading, connectionError, retryConnection } = useWebSocket();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
        {connectionError && (
          <div className="bg-destructive text-destructive-foreground p-3 rounded-md shadow-lg max-w-xs flex flex-col items-start">
            <div className="flex items-center gap-1 mb-1">
              <WifiOff className="h-4 w-4" />
              <span className="font-semibold">Connection Error</span>
            </div>
            <p className="text-sm mb-2">{connectionError}</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-xs" 
              onClick={retryConnection}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Connection
            </Button>
          </div>
        )}
        <Badge 
          variant={isConnected ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Connected to Server</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>{isLoading ? "Connecting..." : "Disconnected"}</span>
            </>
          )}
        </Badge>
      </div>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
