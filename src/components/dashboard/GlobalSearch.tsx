import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, File, Folder, X, ExternalLink } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isOpen) {
          // Note: Needs a global event listener to open it, which we'll add in Topbar
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/drives/search/all?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden relative flex flex-col max-h-[70vh]"
          >
            <div className="flex items-center p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground"
                placeholder="Search across all drives..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 h-8 w-8 ml-2">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {results.map((result, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => {
                        window.open(result.webViewLink, '_blank');
                        onClose();
                      }}
                    >
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                        {result.mimeType.includes('folder') ? (
                          <Folder className="w-4 h-4 text-blue-500" />
                        ) : (
                          <File className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-medium text-sm truncate text-foreground">{result.name}</h4>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          Drive: {result.driveName}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-50" />
                    </div>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-8 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Start typing to search files and folders
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
