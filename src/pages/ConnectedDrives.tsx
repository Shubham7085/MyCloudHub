// src/pages/ConnectedDrives.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDriveStore } from '../store/driveStore';
import { HardDrive, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function ConnectedDrives() {
  const [searchParams] = useSearchParams();
  const { drives, isLoading, fetchDrives, connectDemoDrive } = useDriveStore();

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      fetchDrives();
    }
  }, [searchParams, fetchDrives]);

  const handleConnect = async (provider: string) => {
    await connectDemoDrive(provider);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Drives</h1>
          <p className="text-sm text-gray-400">Manage your connected cloud storage accounts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchDrives()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleConnect('google')}>
            <Plus className="w-4 h-4 mr-2" /> Connect Drive
          </Button>
        </div>
      </div>

      {drives.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl border-zinc-800 bg-zinc-950/50 text-center">
          <div className="p-4 rounded-full bg-zinc-900 text-zinc-400 mb-4">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold">No Drives Connected</h3>
          <p className="text-sm text-zinc-400 mt-1 mb-6 max-w-sm">
            Connect your cloud storage accounts to start managing all your files in one place.
          </p>
          <Button onClick={() => handleConnect('google')}>
            <Plus className="w-4 h-4 mr-2" /> Connect your first drive
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.map((drive) => (
            <div key={drive.id} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg capitalize">{drive.name}</span>
                <span className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Connected
                </span>
              </div>
              <p className="text-xs text-zinc-400">{drive.email}</p>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, (drive.used_space / drive.total_space) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConnectedDrives;
