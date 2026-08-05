import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUploadStore } from '../../store/uploadStore';
import { 
  Upload, X, ChevronUp, ChevronDown, 
  Play, Pause, Trash2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Button } from '../ui/Button';

export function UploadManager() {
  const { tasks, pauseTask, resumeTask, cancelTask, clearCompleted } = useUploadStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (tasks.length === 0) return null;

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'canceled');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  const totalTasks = tasks.length;
  const progressTasks = tasks.filter(t => t.status === 'uploading' || t.status === 'pending');

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 shadow-xl rounded-xl bg-card border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-muted/50 border-b border-border cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          {progressTasks.length > 0 ? (
            <Upload className="w-4 h-4 text-primary animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {progressTasks.length > 0 
              ? `Uploading ${progressTasks.length} ${progressTasks.length === 1 ? 'item' : 'items'}` 
              : `Uploads complete`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              clearCompleted();
              tasks.forEach(t => {
                if (t.status === 'uploading' || t.status === 'paused') cancelTask(t.id);
              });
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="max-h-[60vh] overflow-y-auto p-2 flex flex-col gap-2"
          >
            {tasks.map(task => {
              const formatSize = (bytes: number) => {
                const mb = bytes / (1024 * 1024);
                if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
                return `${mb.toFixed(1)} MB`;
              };
              
              const formatTime = (seconds: number) => {
                if (!isFinite(seconds) || seconds < 0) return 'calculating...';
                if (seconds < 60) return `${Math.ceil(seconds)}s left`;
                const mins = Math.floor(seconds / 60);
                return `${mins}m ${Math.ceil(seconds % 60)}s left`;
              };

              return (
              <div key={task.id} className="flex flex-col p-2 bg-background rounded-lg border border-border/50 text-sm">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium truncate flex-1" title={task.file.name}>
                    {task.file.name}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(task.status === 'uploading' || task.status === 'pending') && (
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => pauseTask(task.id)}>
                        <Pause className="w-3 h-3" />
                      </Button>
                    )}
                    {(task.status === 'paused' || task.status === 'error') && (
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => resumeTask(task.id)}>
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                    {task.status !== 'completed' && task.status !== 'canceled' && (
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => cancelTask(task.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {task.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-destructive" title={task.error} />
                    )}
                  </div>
                </div>
                
                {task.status !== 'completed' && task.status !== 'canceled' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right font-medium">
                        {task.progress}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{formatSize(task.uploadedBytes)} / {formatSize(task.totalBytes)}</span>
                      {task.status === 'uploading' && task.speed && task.eta && (
                        <span>{formatSize(task.speed)}/s • {formatTime(task.eta)}</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground capitalize mt-1">
                  {task.status === 'error' ? task.error : task.status}
                </div>
              </div>
            )})}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
