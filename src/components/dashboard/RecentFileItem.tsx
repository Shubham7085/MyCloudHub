import { File, FileText, Image as ImageIcon, Video, Folder, MoreHorizontal, Download, Share2, Star } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';

interface RecentFileProps {
  name: string;
  size: number;
  modifiedAt: Date;
  type: 'folder' | 'document' | 'image' | 'video' | 'other';
  driveName: string;
  thumbnailUrl?: string;
  owner?: { name: string; avatarUrl: string };
  isStarred?: boolean;
  onClick?: () => void;
}

export function RecentFileItem({ 
  name, 
  size, 
  modifiedAt, 
  type, 
  driveName,
  thumbnailUrl,
  owner,
  isStarred = false,
  onClick
}: RecentFileProps) {
  const getIcon = () => {
    switch (type) {
      case 'folder': return <Folder className="w-5 h-5 text-blue-500 fill-blue-500/20" />;
      case 'document': return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card onClick={onClick} className="group cursor-pointer hover:bg-muted/30 transition-all duration-200 border-transparent hover:border-border/60 shadow-none hover:shadow-sm">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          {thumbnailUrl ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border/50">
              <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-muted/80 rounded-lg shrink-0 flex items-center justify-center group-hover:bg-background transition-colors border border-transparent group-hover:border-border/50">
              {getIcon()}
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{name}</h4>
              {isStarred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
              <span className="truncate max-w-[120px] bg-muted px-1.5 py-0.5 rounded-md font-medium text-foreground/70">{driveName}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="shrink-0">{formatDistanceToNow(modifiedAt, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-6 shrink-0 pl-4 w-48">
          {owner && (
            <div className="hidden sm:flex items-center gap-2">
              <Avatar src={owner.avatarUrl} fallback={owner.name.charAt(0)} size="sm" className="w-6 h-6" />
            </div>
          )}
          <span className="text-sm font-medium text-muted-foreground hidden sm:block w-16 text-right">
            {formatSize(size)}
          </span>
          
          {/* Default view */}
          <div className="flex items-center justify-end w-8 group-hover:hidden transition-all">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
               <MoreHorizontal className="w-4 h-4" />
             </Button>
          </div>
          
          {/* Hover actions */}
          <div className="items-center justify-end gap-1 hidden group-hover:flex w-auto transition-all animate-in fade-in slide-in-from-right-2 duration-200">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
