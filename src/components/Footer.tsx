
import { Github, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const Footer = () => {
  return (
    <footer className="bg-muted py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="font-bold text-lg">genDAO Kenya Pulse</h3>
            <p className="text-muted-foreground text-sm">
              A decentralized autonomous organization for collective decision-making
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} genDAO Kenya. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
