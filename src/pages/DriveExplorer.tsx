import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useUploadStore } from '../store/uploadStore';
import { useDropzone } from 'react-dropzone';
import { 
  ChevronRight, 
  Folder, 
  File, 
  LayoutGrid, 
  List as ListIcon, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Music, 
  Archive, 
  HardDrive,
  FileIcon,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Upload
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { useDriveStore } from '../store/driveStore';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  iconLink?: string;
  thumbnailLink?: string;
  owners?: { displayName: string; photoLink?: string }[];
  webViewLink?: string;
}

interface Breadcrumb {
  id: string;
  name: string;
}

import { FileActionModal } from '../components/dashboard/FileActionModal';
import { formatSize, formatDate, getFileIcon, isFolder } from '../lib/fileUtils';
import { FilePreviewModal, PreviewableFile } from '../components/dashboard/FilePreviewModal';
import { AnimatePresence, motion } from 'motion/react';
import { X as CloseIcon } from 'lucide-react';

export function DriveExplorer() {
  const { id: driveId } = useParams<{ id: string }>();
  const location = useLocation();
  const { drives, fetchDrives } = useDriveStore();
  
  const drive = drives.find(d => d.id === driveId);

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard can deep-link straight into a folder or a pre-filtered view
  // (e.g. tapping "Videos" in Storage Breakdown) by passing router state.
  const navState = location.state as { initialFolder?: Breadcrumb; initialFilter?: 'all' | 'images' | 'videos' | 'documents' | 'audio' | 'archives' | 'other' } | null;
  const [folderStack, setFolderStack] = useState<Breadcrumb[]>(
    navState?.initialFolder ? [{ id: 'root', name: 'My Drive' }, navState.initialFolder] : [{ id: 'root', name: 'My Drive' }]
  );
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'documents' | 'audio' | 'archives' | 'other'>(
    navState?.initialFilter || 'all'
  );

  const [selectedActionFile, setSelectedActionFile] = useState<DriveFile | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  const currentFolder = folderStack[folderStack.length - 1];
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (drives.length === 0) fetchDrives();
  }, [drives.length, fetchDrives]);

  const handleRename = async (fileId: string, newName: string) => {
    try {
      const res = await fetch(`/api/drives/${driveId}/files/${fileId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Rename failed');
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const res = await fetch(`/api/drives/${driveId}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Delete failed');
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = useCallback(async (pageToken?: string) => {
    if (!driveId) return;
    
    try {
      if (!pageToken) setLoading(true);
      else setIsFetchingNextPage(true);
      
      const res = await fetch(`/api/drives/${driveId}/files?folderId=${currentFolder.id}&sortBy=${sortBy}&sortDir=${sortDir}&filter=${filter}${pageToken ? `&pageToken=${pageToken}` : ''}`, { credentials: 'include' });
      
      if (!res.ok) throw new Error('Failed to fetch files');
      
      const data = await res.json();
      
      if (pageToken) {
        setFiles(prev => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }
      setNextPageToken(data.nextPageToken || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setIsFetchingNextPage(false);
    }
  }, [driveId, currentFolder.id, sortBy, sortDir, filter]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleNavigateToFolder = (folderId: string, folderName: string) => {
    setFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    setFolderStack(prev => prev.slice(0, index + 1));
  };

  const handleSortChange = (newSort: 'name' | 'date' | 'size' | 'type') => {
    if (sortBy === newSort) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
      setSortDir('asc');
    }
  };

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => viewMode === 'list' ? 64 : 200,
    overscan: 5,
  });

  // Infinite scroll
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && nextPageToken && !isFetchingNextPage && !loading) {
        fetchFiles(nextPageToken);
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [nextPageToken, isFetchingNextPage, loading, fetchFiles]);

  const handleFileClick = (file: DriveFile) => {
    if (isFolder(file.mimeType)) {
      handleNavigateToFolder(file.id, file.name);
    } else if (file.mimeType.includes('image') || file.mimeType.includes('video')) {
      setPreviewFile({ ...file, driveId });
    } else {
      window.open(file.webViewLink, '_blank');
    }
  };

  const uploadTasks = useUploadStore(s => s.tasks);
  const seenCompletedUploads = useRef<Set<string>>(new Set());

  // If an upload targeting the folder we're currently looking at finishes,
  // refresh the listing so the new file actually shows up without the user
  // having to leave and come back.
  useEffect(() => {
    const relevantlyCompleted = uploadTasks.filter(
      t => t.status === 'completed' && t.driveId === driveId && t.folderId === currentFolder.id && !seenCompletedUploads.current.has(t.id)
    );
    if (relevantlyCompleted.length > 0) {
      relevantlyCompleted.forEach(t => seenCompletedUploads.current.add(t.id));
      fetchFiles();
    }
  }, [uploadTasks, driveId, currentFolder.id, fetchFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!driveId) return;
    acceptedFiles.forEach(file => {
      useUploadStore.getState().addTask(file, driveId, currentFolder.id);
    });
  }, [driveId, currentFolder.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true } as any);

  if (!drive) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading drive information...</div>
      </div>
    );
  }

  return (
    <div {...getRootProps()} className="h-[calc(100vh-4rem)] flex flex-col max-w-7xl mx-auto p-4 md:p-6 lg:p-8 relative">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-primary border-dashed rounded-xl flex items-center justify-center">
          <div className="bg-background/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
            <Upload className="w-12 h-12 text-primary mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold">Drop files here</h2>
            <p className="text-muted-foreground mt-2">Upload to {currentFolder.name}</p>
          </div>
        </div>
      )}
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center text-sm text-muted-foreground mb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              Drives
            </Link>
            <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
            <span className="flex items-center gap-2 text-foreground font-medium mr-1 border-r border-border pr-2 py-0.5">
              <Avatar src={drive.avatar_url} fallback={drive.name.charAt(0)} className="w-5 h-5" />
              {drive.email}
            </span>
            
            {folderStack.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                <button 
                  onClick={() => handleNavigateToBreadcrumb(index)}
                  className={`hover:text-foreground transition-colors truncate max-w-[150px] ${index === folderStack.length - 1 ? 'text-foreground font-medium' : ''}`}
                >
                  {folder.name}
                </button>
                {index < folderStack.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-foreground truncate">{currentFolder.name}</h1>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Filters */}
          <div className="hidden lg:flex bg-muted/50 rounded-lg p-1 border border-border/50">
            {(['all', 'images', 'videos', 'documents', 'audio', 'archives', 'other'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => {
              const name = prompt('Enter folder name:');
              if (name) {
                fetch(`/api/drives/${driveId}/folders`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, parentId: currentFolder.id }),
                  credentials: 'include'
                }).then(res => res.json()).then(data => {
                  if (data.success) {
                    setFiles(prev => [data.folder, ...prev]);
                  }
                });
              }
            }}>
              <Folder className="w-4 h-4" />
              New Folder
            </Button>
            <div className="relative">
              <input 
                type="file" 
                id="file-upload"
                className="hidden" 
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []) as File[];
                  files.forEach(file => {
                    useUploadStore.getState().addTask(file, driveId!, currentFolder.id);
                  });
                  e.target.value = '';
                }}
              />
              <label htmlFor="file-upload">
                <Button asChild size="sm" variant="default" className="gap-2 cursor-pointer">
                  <span>
                    <Upload className="w-4 h-4" />
                    Upload
                  </span>
                </Button>
              </label>
            </div>
            <div className="flex items-center border border-border/50 rounded-lg p-1 bg-muted/50">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode('grid')} 
                className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sorting Header (List View Only) */}
      {viewMode === 'list' && !loading && files.length > 0 && (
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-2">
          <div className="col-span-6 md:col-span-5 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSortChange('name')}>
            Name {sortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
          </div>
          <div className="col-span-3 md:col-span-3 hidden md:flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSortChange('date')}>
            Last Modified {sortBy === 'date' && <ArrowUpDown className="w-3 h-3" />}
          </div>
          <div className="col-span-3 md:col-span-2 hidden md:flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSortChange('size')}>
            Size {sortBy === 'size' && <ArrowUpDown className="w-3 h-3" />}
          </div>
          <div className="col-span-3 md:col-span-2 flex items-center justify-end">Actions</div>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={parentRef} className="flex-1 overflow-auto rounded-xl border border-border/50 bg-card/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p>Loading files...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-destructive text-center gap-2">
            <p className="font-semibold">Failed to load files</p>
            <p className="text-sm opacity-80">{error}</p>
            <Button variant="outline" onClick={() => fetchFiles()} className="mt-4">Try Again</Button>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground text-center">
            <Folder className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium text-foreground">This folder is empty</p>
            <p className="text-sm mt-1">Files uploaded to this folder will appear here.</p>
          </div>
        ) : (
          <div 
            className={viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4 content-start relative"
              : "relative w-full h-[64px]" /* Dummy height for relative container in list mode to let virtualizer work */
            }
            style={viewMode === 'list' ? { height: `${rowVirtualizer.getTotalSize()}px` } : {}}
          >
            {viewMode === 'list' ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
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
                      <div className="col-span-8 md:col-span-5 flex items-center gap-3 overflow-hidden">
                        {file.thumbnailLink ? (
                          <img src={file.thumbnailLink} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file.mimeType)}
                          </div>
                        )}
                        <span className="font-medium truncate text-sm">{file.name}</span>
                      </div>
                      <div className="col-span-3 hidden md:flex items-center text-xs text-muted-foreground">
                        {formatDate(file.modifiedTime)}
                      </div>
                      <div className="col-span-2 hidden md:flex items-center text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </div>
                      <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2">
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
              })
            ) : (
              files.map(file => (
                <div 
                  key={file.id}
                  className="group flex flex-col bg-card border border-border/50 hover:border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="relative aspect-[4/3] bg-muted/30 flex items-center justify-center overflow-hidden border-b border-border/30">
                    {file.thumbnailLink ? (
                      <img src={file.thumbnailLink} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="transform group-hover:scale-110 transition-transform duration-300">
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                    {isFolder(file.mimeType) && (
                      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur rounded p-1">
                        <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate text-foreground flex-1" title={file.name}>{file.name}</p>
                      <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 -mt-1 -mr-1" onClick={(e) => { e.stopPropagation(); setSelectedActionFile(file); }}>
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(file.modifiedTime)}</span>
                      {!isFolder(file.mimeType) && <span>{formatSize(file.size)}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isFetchingNextPage && (
              <div className="col-span-full py-6 flex justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
      <FileActionModal 
        isOpen={!!selectedActionFile}
        onClose={() => setSelectedActionFile(null)}
        file={selectedActionFile}
        driveId={driveId!}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
