import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDriveStore } from '../store/driveStore';
import { Button } from '../components/ui/Button';
import { HardDrive, Trash2, Plus, ExternalLink, RefreshCw } from 'lucide-react';

export function ConnectedDrives() {
  const { drives, isLoading, error, fetchDrives, disconnectDrive } = useDriveStore();
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthNotice, setOauthNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  // Backend does a full-page redirect back to /drives?connected=true (or ?error=...)
  // after the Google OAuth flow finishes. Pick that up here and clean the URL.
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setOauthNotice({ type: 'success', message: 'Google Drive connected successfully.' });
      fetchDrives();
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('error')) {
      setOauthNotice({ type: 'error', message: searchParams.get('error') || 'Failed to connect drive.' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchDrives]);

  const handleConnect = () => {
    // Full-page redirect (not a popup) — popups get blocked/broken on mobile
    // browsers, so the whole tab navigates to Google and back.
    window.location.href = '/api/drives/google/connect';
  };

  const handleSync = async (driveId: string) => {
    setIsSyncing(prev => ({ ...prev, [driveId]: true }));
    try {
      await fetch(`/api/drives/${driveId}/sync`, { method: 'POST' });
      await fetchDrives();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(prev => ({ ...prev, [driveId]: false }));
    }
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading && drives.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Drives</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage your connected cloud storage accounts.
          </p>
        </div>
        <Button onClick={handleConnect} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Connect Drive
        </Button>
      </div>

      {oauthNotice && (
        <div
          className={`p-4 rounded-xl text-sm border font-medium ${
            oauthNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-red-50 text-red-600 border-red-100'
          }`}
        >
          {oauthNotice.message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {drives.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border bg-card/50">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Drives Connected</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto font-medium">
            Connect your cloud storage accounts to start managing all your files in one place.
          </p>
          <Button onClick={handleConnect} className="gap-2">
            <Plus className="w-4 h-4" /> Connect your first drive
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drives.map(drive => {
            const usagePercent = drive.total_space ? (drive.used_space / drive.total_space) * 100 : 0;
            return (
              <div key={drive.id} className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm flex flex-col hover:border-blue-500/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {drive.avatar_url ? (
                      <img src={drive.avatar_url} alt={drive.email} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {drive.email[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-foreground">{drive.name || drive.email}</h3>
                      <p className="text-xs font-medium text-muted-foreground">{drive.provider}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to disconnect this drive?')) {
                        disconnectDrive(drive.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-muted-foreground">Storage Usage</span>
                    <span className="text-foreground">{formatSize(drive.used_space)} / {formatSize(drive.total_space)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${drive.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {drive.status === 'healthy' ? 'Connected' : 'Error'}
                  </span>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8 text-muted-foreground"
                      onClick={() => handleSync(drive.id)}
                      disabled={isSyncing[drive.id]}
                    >
                      <RefreshCw className={`w-3 h-3 mr-1.5 ${isSyncing[drive.id] ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button variant="secondary" size="sm" className="text-xs h-8" onClick={() => window.open(`/drives/${drive.id}`, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="w-3 h-3 mr-1.5" /> Open
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
