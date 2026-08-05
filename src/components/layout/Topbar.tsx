import { useState, useEffect } from 'react';
import { Menu, Search, Moon, Sun, Bell } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { GlobalSearch } from '../dashboard/GlobalSearch';

interface TopbarProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

export function Topbar({ setSidebarOpen }: TopbarProps) {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="hidden md:block max-w-md w-full" onClick={() => setSearchOpen(true)}>
            <div className="relative cursor-pointer group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="block w-full pl-10 pr-3 py-2 border border-border/50 rounded-lg leading-5 bg-muted/50 text-muted-foreground sm:text-sm transition-colors group-hover:bg-muted group-hover:border-border/80">
                Search across all drives... (Cmd+K)
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="md:hidden text-muted-foreground"
          >
            <Search className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hidden sm:inline-flex"
          >
            <Bell className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          
          <div className="ml-2 pl-2 border-l border-border flex items-center gap-3">
            <Link to="/profile">
              <Avatar 
                fallback={user?.name?.charAt(0) || 'U'}
                src=""
                className="w-8 h-8 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all"
              />
            </Link>
          </div>
        </div>
      </header>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
