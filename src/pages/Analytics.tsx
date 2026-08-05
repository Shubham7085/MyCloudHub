import { useState, useEffect } from 'react';
import { useDriveStore } from '../store/driveStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { File, Search, Trash2, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

import { formatSize } from '../lib/fileUtils';

export function Analytics() {
  const { drives } = useDriveStore();
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const scanForDuplicates = async () => {
    setLoading(true);
    setScanned(true);
    try {
      const res = await fetch('/api/drives/analytics/duplicates', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data.duplicates || []);
      }
    } catch (err) {
      console.error('Failed to scan duplicates', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSpace = drives.reduce((acc, d) => acc + (d.total_space || 0), 0);
  const usedSpace = drives.reduce((acc, d) => acc + (d.used_space || 0), 0);
  const freeSpace = totalSpace - usedSpace;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Storage Analytics</h1>
        <p className="text-muted-foreground mt-2">Insights and optimization for your connected drives.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatSize(totalSpace)}</div>
            <p className="text-sm text-muted-foreground mt-1">Across {drives.length} drives</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/10 to-transparent">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Used Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatSize(usedSpace)}</div>
            <p className="text-sm text-muted-foreground mt-1">{Math.round((usedSpace / (totalSpace || 1)) * 100)}% of total</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Free Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatSize(freeSpace)}</div>
            <p className="text-sm text-muted-foreground mt-1">Available for new files</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Usage by Drive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {drives.map(drive => {
            const usagePercent = Math.round(((drive.used_space || 0) / (drive.total_space || 1)) * 100);
            return (
              <div key={drive.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <img src={drive.avatar_url || '/google-drive-icon.png'} alt="" className="w-6 h-6 rounded-full" onError={(e) => { e.currentTarget.src = 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{drive.email}</span>
                    <span className="text-sm text-muted-foreground shrink-0">{formatSize(drive.used_space || 0)} / {formatSize(drive.total_space || 0)}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${usagePercent > 90 ? 'bg-destructive' : usagePercent > 75 ? 'bg-amber-500' : 'bg-primary'}`} 
                      style={{ width: `${Math.max(usagePercent, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {drives.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No connected drives.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Duplicate File Finder</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Scan connected drives for duplicate files to free up space.</p>
          </div>
          <Button onClick={scanForDuplicates} disabled={loading} className="gap-2">
            <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scanning...' : 'Scan Now'}
          </Button>
        </CardHeader>
        <CardContent>
          {!scanned ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
              <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-medium text-lg">Ready to scan</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">Click "Scan Now" to search across all your connected drives for identical files taking up unnecessary space.</p>
            </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-muted-foreground font-medium">Analyzing drive contents...</p>
            </div>
          ) : duplicates.length > 0 ? (
            <div className="space-y-4">
              {duplicates.map((group, idx) => (
                <div key={idx} className="p-4 border border-border/50 bg-muted/10 rounded-lg">
                  <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs font-semibold bg-destructive/10 text-destructive px-2 py-1 rounded">
                      {formatSize(group.size)} wasted
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between text-sm bg-background p-2 rounded border border-border/50">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <File className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1" title={file.driveName}>{file.driveName}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive h-8 px-2 shrink-0">
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-green-500 font-medium">
              Great news! No duplicate files were found across your drives.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
