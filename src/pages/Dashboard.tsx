import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { DriveCard } from '../components/dashboard/DriveCard';
import { StorageCategoryCard } from '../components/dashboard/StorageCategoryCard';
import { RecentFileItem } from '../components/dashboard/RecentFileItem';
import { StorageChart, StorageChartDatum } from '../components/dashboard/StorageChart';
import { Button } from '../components/ui/Button';
import { Upload, Plus, FolderPlus, ArrowUpRight, Activity, Inbox, ListChecks } from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';
import { Avatar } from '../components/ui/Avatar';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useDriveStore } from '../store/driveStore';
import { useUploadStore } from '../store/uploadStore';
import { useNavigate } from 'react-router-dom';
import { getStorageCategory, getRecentFileType, StorageCategory } from '../lib/fileUtils';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  thumbnailLink?: string;
  webViewLink?: string;
  driveName: string;
  driveId: string;
  owners?: { displayName?: string; photoLink?: string }[];
}

const CATEGORY_META: Record<StorageCategory, { label: string; color: string }> = {
  documents: { label: 'Documents', color: '#3b82f6' },
  images: { label: 'Images', color: '#10b981' },
  videos: { label: 'Videos', color: '#8b5cf6' },
  audio: { label: 'Audio', color: '#f59e0b' },
  archives: { label: 'Archives', color: '#f43f5e' },
  other: { label: 'Other', color: '#6b7280' },
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuthStore();
  const { drives, fetchDrives, disconnectDrive, syncDrive } = useDriveStore();
  const { tasks } = useUploadStore();
  const firstName = user?.name?.split(' ')[0] || 'User';
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recentFiles, setRecentFiles] = useState<DriveFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const loadRecentFiles = useCallback(async () => {
    if (drives.length === 0) {
      setRecentFiles([]);
      return;
    }
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/drives/all/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecentFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to load recent files:', err);
    } finally {
      setFilesLoading(false);
    }
  }, [drives.length]);

  useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  const handleConnectDrive = () => {
    if (drives.length >= 5) {
      alert('Maximum of 5 accounts reached.');
      return;
    }
    // Full-page redirect (not a popup) — popups get blocked/broken on mobile
    // browsers, so the whole tab navigates to Google and back to /drives.
    window.location.href = '/api/drives/google/connect';
  };

  const requireADrive = () => {
    if (drives.length === 0) {
      alert('Connect a drive first to do this.');
      return null;
    }
    return drives[0].id;
  };

  const handleNewFolder = () => {
    const driveId = requireADrive();
    if (!driveId) return;
    const name = prompt('Enter folder name:');
    if (!name) return;
    fetch(`/api/drives/${driveId}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId: 'root' }),
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          navigate(`/drives/${driveId}`);
        } else {
          alert(data.error || 'Failed to create folder.');
        }
      })
      .catch(() => alert('Failed to create folder.'));
  };

  const handleUploadClick = () => {
    const driveId = requireADrive();
    if (!driveId) return;
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const driveId = drives[0]?.id;
    if (!driveId) return;
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      useUploadStore.getState().addTask(file, driveId, 'root');
    });
    e.target.value = '';
  };

  const totalUsedStorage = drives.reduce((acc, d) => acc + (d.used_space || 0), 0);
  const totalStorageCapacity = drives.reduce((acc, d) => acc + (d.total_space || 0), 0);
  const totalUsedGB = (totalUsedStorage / (1024 * 1024 * 1024)).toFixed(1);
  const totalCapacityGB = (totalStorageCapacity / (1024 * 1024 * 1024)).toFixed(1);

  // Real storage breakdown, computed from the files we could see (most recent
  // files across your connected drives). Google Docs/Sheets/Slides don't
  // report a byte size via the API, so they're excluded from the byte totals.
  const { chartData, categoryBreakdown } = useMemo(() => {
    const totals: Record<StorageCategory, number> = {
      documents: 0, images: 0, videos: 0, audio: 0, archives: 0, other: 0,
    };
    for (const f of recentFiles) {
      if (f.mimeType === 'application/vnd.google-apps.folder') continue;
      const bytes = f.size ? parseInt(f.size, 10) : 0;
      totals[getStorageCategory(f.mimeType)] += bytes;
    }
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    const breakdown = (Object.keys(totals) as StorageCategory[]).map(cat => ({
      type: cat,
      label: CATEGORY_META[cat].label,
      size: totals[cat],
      percentage: grandTotal > 0 ? Math.round((totals[cat] / grandTotal) * 1000) / 10 : 0,
    }));
    const chart: StorageChartDatum[] = breakdown
      .filter(b => b.size > 0)
      .map(b => ({ name: b.label, value: b.percentage, color: CATEGORY_META[b.type].color }));
    return { chartData: chart, categoryBreakdown: breakdown };
  }, [recentFiles]);

  const activeUploadTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'canceled');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />

      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-border/50 p-8 sm:p-10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Avatar 
              src={user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}&backgroundColor=transparent`} 
              fallback={user?.name?.charAt(0) || 'U'}
              size="lg" 
              className="w-20 h-20 ring-4 ring-background shadow-xl bg-white"
            />
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-1"
              >
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {firstName}</h1>
                <span className="text-2xl">👋</span>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground text-sm font-medium flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-emerald-500" />
                {drives.length > 0 ? `You have used ${totalUsedGB} GB of your ${totalCapacityGB} GB total storage.` : 'Connect a drive to get started.'}
              </motion.p>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button variant="secondary" onClick={handleNewFolder} className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
              <FolderPlus className="w-4 h-4 text-blue-500" />
              New Folder
            </Button>
            <Button variant="outline" onClick={handleConnectDrive} className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
              <Plus className="w-4 h-4" />
              Connect Drive
            </Button>
            <Button onClick={handleUploadClick} className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white border-0">
              <Upload className="w-4 h-4" />
              Upload File
            </Button>
          </motion.div>
        </div>
        
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Connected Drives */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Connected Drives
            <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">{drives.length}</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/drives')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg group">
            View All <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {drives.map(drive => (
            <DriveCard 
              key={drive.id}
              id={drive.id}
              name={drive.provider === 'google' ? 'Google Drive' : 'Cloud Drive'} 
              email={drive.email} 
              usedSpace={drive.used_space} 
              totalSpace={drive.total_space} 
              type={drive.provider}
              color={drive.provider === 'google' ? 'bg-[#4285F4]' : 'bg-indigo-500'}
              status={drive.status}
              lastSync={new Date(drive.last_sync)}
              onSync={syncDrive}
              onDisconnect={disconnectDrive}
              onOpen={(id) => navigate(`/drives/${id}`)}
            />
          ))}
          {drives.length < 5 && (
            <div onClick={handleConnectDrive} className="rounded-2xl border-2 border-dashed border-border/60 bg-transparent flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/30 hover:border-border transition-all duration-300 group min-h-[220px]">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all duration-300">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground">Connect Drive</h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-[160px]">Add Google Drive, OneDrive, or Dropbox</p>
            </div>
          )}
        </div>
      </section>

      {/* Storage Breakdown & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Breakdown */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-1">Storage Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-4">Based on your most recently modified files.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-1">
              <StorageChart data={chartData} />
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              {categoryBreakdown.map(cat => (
                <StorageCategoryCard key={cat.type} label={cat.label} size={cat.size} percentage={cat.percentage} type={cat.type} />
              ))}
            </div>
          </div>
        </section>

        {/* Active Queue */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Active Tasks</h2>
            {activeUploadTasks.length > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">{activeUploadTasks.length} Active</span>
            )}
          </div>
          {activeUploadTasks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center text-center gap-2">
              <ListChecks className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No active uploads right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeUploadTasks.map(task => {
                const pct = task.progress || 0;
                const formatSize = (bytes: number) => {
                  const mb = bytes / (1024 * 1024);
                  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
                  return `${mb.toFixed(1)} MB`;
                };
                return (
                  <div key={task.id} className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-foreground block truncate">{task.file.name}</span>
                          <span className="text-[11px] text-muted-foreground font-medium capitalize">{task.status}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-blue-600 shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                      <span>{formatSize(task.uploadedBytes)} of {formatSize(task.totalBytes)}</span>
                      {task.speed && task.eta ? <span>{formatSize(task.speed)}/s</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Recent Activity */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Activity</h2>
          <div className="w-full sm:w-auto">
            <Tabs 
              tabs={[
                { id: 'all', label: 'All Files' },
                { id: 'uploads', label: 'Uploads' },
                { id: 'downloads', label: 'Downloads' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>
        
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
          {filesLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading recent files...</div>
          ) : recentFiles.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
              <Inbox className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {drives.length === 0 ? 'Connect a drive to see recent files here.' : 'No files yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentFiles.slice(0, 8).map(file => (
                <RecentFileItem
                  key={file.id}
                  name={file.name}
                  size={file.size ? parseInt(file.size, 10) : 0}
                  modifiedAt={new Date(file.modifiedTime)}
                  type={getRecentFileType(file.mimeType)}
                  driveName={file.driveName}
                  thumbnailUrl={file.thumbnailLink}
                  owner={file.owners?.[0]?.displayName ? { name: file.owners[0].displayName!, avatarUrl: file.owners[0].photoLink || '' } : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
