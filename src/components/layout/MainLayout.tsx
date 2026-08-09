import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDriveStore } from '../../store/driveStore';
import { useUploadStore } from '../../store/uploadStore';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { drives, fetchDrives } = useDriveStore();
  const navigate = useNavigate();
  const fabFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleFabClick = () => {
    if (drives.length === 0) {
      navigate('/drives');
      return;
    }
    fabFileInputRef.current?.click();
  };

  const handleFabFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const driveId = drives[0]?.id;
    if (!driveId) return;
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      useUploadStore.getState().addTask(file, driveId, 'root');
    });
    e.target.value = '';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-black">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Topbar setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Mobile FAB — quick-uploads to your first connected drive, or takes
            you to Connected Drives if you don't have one yet. */}
        <input ref={fabFileInputRef} type="file" multiple className="hidden" onChange={handleFabFilesSelected} />
        <div className="md:hidden fixed bottom-6 right-6 z-20">
          <Button
            size="icon"
            onClick={handleFabClick}
            title={drives.length === 0 ? 'Connect a drive' : 'Quick upload'}
            className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all text-white border-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
