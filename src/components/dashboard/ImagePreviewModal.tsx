import { AnimatePresence, motion } from 'motion/react';
import { X as CloseIcon } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImagePreviewModalProps {
  file: any;
  onClose: () => void;
}

export function ImagePreviewModal({ file, onClose }: ImagePreviewModalProps) {
  if (!file) return null;

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return '--';
    const bytes = parseInt(bytesStr, 10);
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 lg:p-8" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full h-full flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 flex items-center gap-4 text-white z-10">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => window.open(file.webViewLink, '_blank')}>
              Open original
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-10 h-10 rounded-full" onClick={onClose}>
              <CloseIcon className="w-6 h-6" />
            </Button>
          </div>
          
          <img 
            src={file.thumbnailLink?.replace('=s220', '=s2000')} 
            alt={file.name} 
            className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
          />
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-white/80">
            <p className="font-medium">{file.name}</p>
            <p className="text-sm opacity-70 mt-1">{formatSize(file.size)}</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
