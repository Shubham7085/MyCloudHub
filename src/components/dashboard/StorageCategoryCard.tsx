import { FileText, Image, Video, Music, Archive, File } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { motion } from 'motion/react';

interface StorageCategoryCardProps {
  label: string;
  size: number;
  percentage: number;
  type: 'documents' | 'images' | 'videos' | 'audio' | 'archives' | 'other';
  onClick?: () => void;
}

export function StorageCategoryCard({ label, size, percentage, type, onClick }: StorageCategoryCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'documents': return <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case 'images': return <Image className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'videos': return <Video className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case 'audio': return <Music className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case 'archives': return <Archive className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      default: return <File className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'documents': return 'bg-blue-500/10';
      case 'images': return 'bg-emerald-500/10';
      case 'videos': return 'bg-purple-500/10';
      case 'audio': return 'bg-amber-500/10';
      case 'archives': return 'bg-rose-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card onClick={onClick} className="border-border/60 hover:border-border transition-colors group cursor-pointer hover:shadow-md">
      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${getBgColor()} group-hover:scale-110 transition-transform duration-300`}>
              {getIcon()}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground tracking-tight">{label}</h4>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{formatSize(size)}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">{percentage}%</span>
        </div>
        
        <div className="mt-4 w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${getBgColor().replace('/10', '')}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
