import { AnimatePresence, motion } from 'motion/react';
import { X as CloseIcon, ExternalLink, File as FileIcon } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PreviewableFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  driveId?: string;
}

interface FilePreviewModalProps {
  file: PreviewableFile | null;
  onClose: () => void;
}

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

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file) return null;

  const isImage = file.mimeType?.includes('image');
  const isVideo = file.mimeType?.includes('video');
  // Streamed in-app through our own backend, so the browser never has to
  // bounce through drive.google.com directly (which pops Google's account
  // chooser on phones signed into multiple accounts).
  const streamUrl = file.driveId ? `/api/drives/${file.driveId}/files/${file.id}/stream` : undefined;

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
            {file.webViewLink && (
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-2" onClick={() => window.open(file.webViewLink, '_blank')}>
                <ExternalLink className="w-4 h-4" />
                Open in Drive
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-10 h-10 rounded-full" onClick={onClose}>
              <CloseIcon className="w-6 h-6" />
            </Button>
          </div>

          {isImage ? (
            <img
              src={streamUrl || file.thumbnailLink?.replace('=s220', '=s2000')}
              alt={file.name}
              className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
            />
          ) : isVideo && streamUrl ? (
            <video
              src={streamUrl}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-sm shadow-2xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/80">
              <FileIcon className="w-16 h-16" />
              <p>Preview isn't available for this file type.</p>
              {file.webViewLink && (
                <Button variant="secondary" className="gap-2" onClick={() => window.open(file.webViewLink, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                  Open in Drive instead
                </Button>
              )}
            </div>
          )}

          <div className="absolute bottom-4 left-0 right-0 text-center text-white/80">
            <p className="font-medium">{file.name}</p>
            <p className="text-sm opacity-70 mt-1">{formatSize(file.size)}</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
