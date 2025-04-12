
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <WebSocketProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </WebSocketProvider>
  );
};
