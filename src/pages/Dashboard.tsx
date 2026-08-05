import { DriveCard } from '../components/dashboard/DriveCard';
import { StorageCategoryCard } from '../components/dashboard/StorageCategoryCard';
import { RecentFileItem } from '../components/dashboard/RecentFileItem';
import { StorageChart } from '../components/dashboard/StorageChart';
import { Button } from '../components/ui/Button';
import { Upload, Plus, Download, FolderPlus, ArrowUpRight, Activity } from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';
import { useState, useEffect } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useDriveStore } from '../store/driveStore';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuthStore();
  const { drives, isLoading, fetchDrives, disconnectDrive, syncDrive } = useDriveStore();
  const firstName = user?.name?.split(' ')[0] || 'User';
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        fetchDrives();
      } else if (event.data?.type === 'OAUTH_ERROR') {
        alert(event.data.payload || 'Failed to connect drive');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchDrives]);

  const handleConnectDrive = () => {
    if (drives.length >= 5) {
      alert('Maximum of 5 accounts reached.');
      return;
    }
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      '/api/drives/google/connect',
      'Connect Google Drive',
      `width=${width},height=${height},left=${left},top=${top},popup=true`
    );
  };

  const totalUsedStorage = drives.reduce((acc, d) => acc + (d.used_space || 0), 0);
  const totalStorageCapacity = drives.reduce((acc, d) => acc + (d.total_space || 0), 0);
  const totalUsedGB = (totalUsedStorage / (1024 * 1024 * 1024)).toFixed(1);
  const totalCapacityGB = (totalStorageCapacity / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
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
            <Button variant="secondary" className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
              <FolderPlus className="w-4 h-4 text-blue-500" />
              New Folder
            </Button>
            <Button variant="outline" onClick={handleConnectDrive} className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
              <Plus className="w-4 h-4" />
              Connect Drive
            </Button>
            <Button className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white border-0">
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
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg group">
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
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-5">Storage Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-1">
              <StorageChart />
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              <StorageCategoryCard label="Documents" size={12.4 * 1024 * 1024 * 1024} percentage={28} type="documents" />
              <StorageCategoryCard label="Images" size={24.8 * 1024 * 1024 * 1024} percentage={55} type="images" />
              <StorageCategoryCard label="Videos" size={5.2 * 1024 * 1024 * 1024} percentage={12} type="videos" />
              <StorageCategoryCard label="Audio" size={1.1 * 1024 * 1024 * 1024} percentage={2} type="audio" />
              <StorageCategoryCard label="Archives" size={0.8 * 1024 * 1024 * 1024} percentage={1.5} type="archives" />
              <StorageCategoryCard label="Other" size={0.9 * 1024 * 1024 * 1024} percentage={1.5} type="other" />
            </div>
          </div>
        </section>

        {/* Active Queue */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Active Tasks</h2>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">2 Active</span>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Upload className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">Project_Assets.zip</span>
                    <span className="text-[11px] text-muted-foreground font-medium">To: Work Drive</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600">45%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '45%' }}
                  transition={{ duration: 1 }}
                  className="h-full bg-blue-600 rounded-full" 
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>1.2 GB of 2.8 GB</span>
                <span>~3 mins left (12 MB/s)</span>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Download className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">Q3_Financial_Report.pdf</span>
                    <span className="text-[11px] text-muted-foreground font-medium">From: Personal Drive</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">82%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '82%' }}
                  transition={{ duration: 1 }}
                  className="h-full bg-emerald-600 rounded-full" 
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>18 MB of 22 MB</span>
                <span>Few seconds left</span>
              </div>
            </div>
          </div>
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
          <div className="divide-y divide-border/60">
            <RecentFileItem 
              name="Q4 Marketing Strategy.pdf" 
              size={2450000} 
              modifiedAt={new Date(Date.now() - 1000 * 60 * 5)} 
              type="document" 
              driveName="Work Drive"
              isStarred={true}
              owner={{ name: "Alex", avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=transparent" }}
            />
            <RecentFileItem 
              name="Brand Assets 2024" 
              size={0} 
              modifiedAt={new Date(Date.now() - 1000 * 60 * 60 * 2)} 
              type="folder" 
              driveName="Personal Drive" 
              owner={{ name: "Alex", avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=transparent" }}
            />
            <RecentFileItem 
              name="Hero_Banner_V2.png" 
              size={4800000} 
              modifiedAt={new Date(Date.now() - 1000 * 60 * 60 * 24)} 
              type="image" 
              driveName="Work Drive" 
              thumbnailUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
              owner={{ name: "Sarah", avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=transparent" }}
            />
            <RecentFileItem 
              name="Team Meeting Recording.mp4" 
              size={345000000} 
              modifiedAt={new Date(Date.now() - 1000 * 60 * 60 * 48)} 
              type="video" 
              driveName="Project Backup" 
              owner={{ name: "Alex", avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=transparent" }}
            />
            <RecentFileItem 
              name="Client Notes - Oct 24.docx" 
              size={120000} 
              modifiedAt={new Date(Date.now() - 1000 * 60 * 60 * 72)} 
              type="document" 
              driveName="Work Drive" 
              owner={{ name: "Alex", avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=transparent" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
