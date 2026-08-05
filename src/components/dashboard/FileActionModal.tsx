import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Edit2, Download, Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FileActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: any;
  driveId: string;
  onRename: (fileId: string, newName: string) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
}

export function FileActionModal({ isOpen, onClose, file, driveId, onRename, onDelete }: FileActionModalProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(file.webViewLink || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === file.name) {
      setIsRenaming(false);
      return;
    }
    await onRename(file.id, newName);
    setIsRenaming(false);
    onClose();
  };

  const handleDelete = async () => {
    await onDelete(file.id);
    setIsDeleting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-lg truncate pr-4">{file.name}</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {!isRenaming && !isDeleting && (
              <>
                <Button 
                  variant="outline" 
                  className="justify-start w-full"
                  onClick={() => window.open(`/api/drives/${driveId}/files/${file.id}/download`, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start w-full"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start w-full"
                  onClick={() => {
                    setNewName(file.name);
                    setIsRenaming(true);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Rename
                </Button>
                <Button 
                  variant="destructive" 
                  className="justify-start w-full"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </>
            )}

            {isRenaming && (
              <div className="flex flex-col gap-4">
                <Input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleRename()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsRenaming(false)}>Cancel</Button>
                  <Button onClick={handleRename}>Save</Button>
                </div>
              </div>
            )}

            {isDeleting && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">Are you sure you want to delete this {file.mimeType.includes('folder') ? 'folder' : 'file'}? It will be moved to trash.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsDeleting(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete}>Confirm Delete</Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
