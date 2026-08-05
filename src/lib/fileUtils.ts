import { Folder, File as FileIcon, ImageIcon, Video, Music, Archive, FileText } from 'lucide-react';
import React from 'react';

export const formatSize = (bytesStr?: string | number) => {
  if (!bytesStr) return '--';
  const bytes = typeof bytesStr === 'string' ? parseInt(bytesStr, 10) : bytesStr;
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getFileIcon = (mimeType: string) => {
  if (!mimeType) return React.createElement(FileIcon, { className: "w-5 h-5 text-slate-500" });
  if (mimeType.includes('folder')) return React.createElement(Folder, { className: "w-5 h-5 text-blue-500 fill-blue-500/20" });
  if (mimeType.includes('image')) return React.createElement(ImageIcon, { className: "w-5 h-5 text-emerald-500" });
  if (mimeType.includes('video')) return React.createElement(Video, { className: "w-5 h-5 text-rose-500" });
  if (mimeType.includes('audio')) return React.createElement(Music, { className: "w-5 h-5 text-amber-500" });
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('rar') || mimeType.includes('tar')) return React.createElement(Archive, { className: "w-5 h-5 text-orange-500" });
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word')) return React.createElement(FileText, { className: "w-5 h-5 text-indigo-500" });
  return React.createElement(FileIcon, { className: "w-5 h-5 text-slate-500" });
};

export const isFolder = (mimeType: string) => mimeType === 'application/vnd.google-apps.folder';
