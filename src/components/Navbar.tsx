import { Menu, Github, Terminal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

export function Navbar({ onMenuClick, sidebarOpen }: NavbarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Menu button and Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0"
          >
            <div className="relative h-5 w-5">
              <Menu 
                className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${
                  sidebarOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`} 
              />
              <X 
                className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${
                  sidebarOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                }`} 
              />
            </div>
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-gruvbox-green" />
            <span className="font-semibold text-lg">
              <span className="text-gruvbox-green">Vim</span>
              <span className="text-foreground">Tutor</span>
            </span>
          </div>
        </div>

        {/* Right side - Links */}
        <nav className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="ghost" size="icon">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Button>
          </a>
        </nav>
      </div>
    </header>
  );
}
