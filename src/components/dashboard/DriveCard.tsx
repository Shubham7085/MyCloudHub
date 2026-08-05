import { Cloud, HardDrive, MoreVertical, CheckCircle2, RefreshCw, Trash2, Unlink } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface DriveCardProps {
  key?: string | number;
  id: string;
  name: string;
  email: string;
  usedSpace: number;
  totalSpace: number;
  type: 'google' | 'onedrive' | 'dropbox' | 'mega' | 's3' | 'webdav';
  color?: string;
  lastSync?: Date;
  status?: 'healthy' | 'syncing' | 'error';
  onSync?: (id: string) => void;
  onDisconnect?: (id: string) => void;
  onOpen?: (id: string) => void;
}

export function DriveCard({ 
  id,
  name, 
  email, 
  usedSpace, 
  totalSpace, 
  type, 
  color = 'bg-blue-500',
  lastSync = new Date(),
  status = 'healthy',
  onSync,
  onDisconnect,
  onOpen
}: DriveCardProps) {
  const usagePercentage = totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0;
  const freeSpace = Math.max(0, totalSpace - usedSpace);
  
  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <Card 
      className="overflow-hidden group border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b from-card to-card/50 cursor-pointer"
      onClick={() => onOpen?.(id)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl text-white shadow-sm ${color} relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {type === 'google' ? <Cloud className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground tracking-tight line-clamp-1">{name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{email}</p>
            </div>
          </div>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" onClick={(e) => { e.stopPropagation(); onSync?.(id); }} title="Sync">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); onDisconnect?.(id); }} title="Disconnect">
              <Unlink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 mt-6">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {usagePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                {formatSize(freeSpace)} free
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{formatSize(usedSpace)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">of {formatSize(totalSpace)}</div>
            </div>
          </div>
          
          <ProgressBar 
            value={usagePercentage} 
            indicatorColor={usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-yellow-500' : color}
            className="h-2.5 bg-muted/50" 
          />
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {status === 'healthy' && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Healthy</span></>}
            {status === 'syncing' && <><RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" /><span className="text-blue-600 dark:text-blue-400">Syncing</span></>}
            {status === 'error' && <><CheckCircle2 className="w-3.5 h-3.5 text-red-500" /><span className="text-red-600 dark:text-red-400">Error</span></>}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {formatDistanceToNow(lastSync, { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
