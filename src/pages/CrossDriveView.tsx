import { useState, useEffect, useCallback, useRef } from 'react';
import { useDriveStore } from '../store/driveStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Folder, File as FileIcon, ImageIcon, Video, Music, Archive, FileText, ArrowUpDown, MoreVertical, HardDrive, Trash2, Clock, Star, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { formatSize, formatDate, getFileIcon, isFolder } from '../lib/fileUtils';
import { FileActionModal } from '../components/dashboard/FileActionModal';
import { ImagePreviewModal } from '../components/dashboard/ImagePreviewModal';
import { AnimatePresence, motion } from 'motion/react';
import { X as CloseIcon } from 'lucide-react';

interface CrossDriveViewProps {
  mode: 'recent' | 'starred' | 'trash' | 'shared' | 'all';
}

export function CrossDriveView({ mode }: CrossDriveViewProps) {
  const { drives } = useDriveStore();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedActionFile, setSelectedActionFile] = useState<any | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drives/all/${mode}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data.files || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const getTitle = () => {
    switch (mode) {
      case 'all': return { title: 'All Files', icon: <FileIcon className="w-6 h-6 mr-3 text-blue-500" /> };
      case 'recent': return { title: 'Recent', icon: <Clock className="w-6 h-6 mr-3 text-blue-500" /> };
      case 'starred': return { title: 'Starred', icon: <Star className="w-6 h-6 mr-3 text-amber-500" /> };
      case 'trash': return { title: 'Trash', icon: <Trash2 className="w-6 h-6 mr-3 text-destructive" /> };
      case 'shared': return { title: 'Shared with me', icon: <Users className="w-6 h-6 mr-3 text-emerald-500" /> };
    }
  };

  const { title, icon } = getTitle();

  const handleFileClick = (file: any) => {
    if (file.mimeType && file.mimeType.includes('image') && file.thumbnailLink) {
      setPreviewFile(file);
    } else if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-6">
        {icon}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>

      {/* Main Content Area */}
      <div ref={parentRef} className="flex-1 overflow-auto rounded-xl border border-border/50 bg-card/50 flex flex-col">
        {/* List Header */}
        <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 p-4 border-b border-border bg-card/80 backdrop-blur text-sm font-medium text-muted-foreground">
          <div className="col-span-6 md:col-span-5">Name</div>
          <div className="col-span-3 md:col-span-2 hidden md:block">Location</div>
          <div className="col-span-3 md:col-span-2 hidden md:block">Last Modified</div>
          <div className="col-span-2 md:col-span-1 hidden md:block">Size</div>
          <div className="col-span-6 md:col-span-2 text-right pr-2">Actions</div>
        </div>
        
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center absolute inset-0 text-muted-foreground gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p>Loading files...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center absolute inset-0 text-destructive text-center gap-2">
              <p className="font-semibold">Failed to load files</p>
              <p className="text-sm opacity-80">{error}</p>
              <Button variant="outline" onClick={fetchFiles} className="mt-4">Try Again</Button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center absolute inset-0 text-muted-foreground text-center">
              <div className="w-16 h-16 mb-4 opacity-20 flex justify-center items-center">
                {getTitle().icon}
              </div>
              <p className="font-medium text-foreground">No files found</p>
            </div>
          ) : (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const file = files[virtualRow.index];
                return (
                  <div
                    key={file.id}
                    className="absolute top-0 left-0 w-full px-2"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div 
                      className="group flex items-center grid grid-cols-12 gap-4 px-2 py-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer h-[56px] border border-transparent hover:border-border/50"
                      onClick={() => handleFileClick(file)}
                    >
                      <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden">
                        {file.thumbnailLink ? (
                          <img src={file.thumbnailLink} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file.mimeType)}
                          </div>
                        )}
                        <span className="font-medium truncate text-sm">{file.name}</span>
                      </div>
                      <div className="col-span-3 md:col-span-2 hidden md:flex items-center gap-1 overflow-hidden">
                        <HardDrive className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{file.driveName || 'Unknown'}</span>
                      </div>
                      <div className="col-span-3 md:col-span-2 hidden md:flex items-center text-xs text-muted-foreground">
                        {formatDate(file.modifiedTime)}
                      </div>
                      <div className="col-span-2 md:col-span-1 hidden md:flex items-center text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2 pr-2">
                        {file.owners && file.owners[0] && (
                          <Avatar 
                            src={file.owners[0].photoLink} 
                            fallback={file.owners[0].displayName?.charAt(0) || '?'} 
                            className="w-6 h-6 hidden lg:block"
                            title={file.owners[0].displayName}
                          />
                        )}
                        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setSelectedActionFile(file); }}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FileActionModal 
        isOpen={!!selectedActionFile}
        onClose={() => setSelectedActionFile(null)}
        file={selectedActionFile}
        driveId={selectedActionFile?.driveId || ''}
        onRename={async () => {}} // Disabled for cross-drive view for simplicity
        onDelete={async () => {}} // Disabled for cross-drive view for simplicity
      />

      <ImagePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
