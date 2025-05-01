
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Users, BarChart2 } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import KenyaCoatOfArms from '@/assets/kenya-coat-of-arms.svg';

export const Header = () => {
  const { activeUsers, currentUser } = useWebSocket();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${
      isScrolled ? 'bg-background/80 backdrop-blur-md shadow-sm' : 'bg-background'
    }`}>
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={KenyaCoatOfArms} alt="Kenya Coat of Arms" className="h-10 w-10" />
          <span className="font-bold text-xl hidden md:block">genDAO Kenya Pulse</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <NavLinks showDashboard={currentUser?.isFirstUser} />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full text-sm">
              <Users className="h-4 w-4" />
              <span>{activeUsers.length} active</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 mt-6">
                  <NavLinks showDashboard={currentUser?.isFirstUser} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

interface NavLinksProps {
  showDashboard?: boolean;
}

const NavLinks = ({ showDashboard }: NavLinksProps) => {
  return (
    <>
      <Link to="/" className="text-foreground hover:text-primary transition-colors">
        Home
      </Link>
      <Link to="/proposals" className="text-foreground hover:text-primary transition-colors">
        Proposals
      </Link>
      {showDashboard && (
        <Link to="/dashboard" className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
          <BarChart2 className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      )}
    </>
  );
};
