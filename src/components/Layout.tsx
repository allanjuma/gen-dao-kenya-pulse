
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isConnected, isLoading } = useWebSocket();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="fixed bottom-4 right-4 z-50">
        <Badge 
          variant={isConnected ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Connected to Cloudflare</span>
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
