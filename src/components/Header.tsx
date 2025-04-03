import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Github, Globe } from 'lucide-react';
import Link from 'next/link';

export function Header() {
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
        </div>
      </div>
    </header>
  );
} 