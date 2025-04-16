import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Github, Globe, Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Globe className="h-6 w-6" />
            <span className="text-2xl font-bold">IP-See</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              History
            </Link>
            <Link href="/tools" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tools
            </Link>
            <Link href="/temp-email" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Temp Email
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://github.com/michelbragaguimaraes/ip-see" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b">
          <nav className="container mx-auto px-4 py-2 flex flex-col space-y-2">
            <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              History
            </Link>
            <Link href="/tools" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tools
            </Link>
            <Link href="/temp-email" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Temp Email
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
