import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from './AuthContext';
import { ProjectFile } from '../types/files';

interface RoomContextType {
  roomId: string;
  doc: Y.Doc;
  provider: WebsocketProvider | null;
  files: ProjectFile[];
  createFile: (name: string) => void;
  deleteFile: (id: string) => void;
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  openTabs: string[];
  openFileTab: (id: string) => void;
  closeFileTab: (id: string) => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

const DEFAULT_FILES: ProjectFile[] = [
  { id: 'file-main-ts', name: 'main.ts', language: 'typescript', createdAt: Date.now() },
  { id: 'file-app-tsx', name: 'App.tsx', language: 'typescript', createdAt: Date.now() + 1 },
  { id: 'file-styles-css', name: 'styles.css', language: 'css', createdAt: Date.now() + 2 },
  { id: 'file-readme-md', name: 'README.md', language: 'markdown', createdAt: Date.now() + 3 },
];

export function getLanguageFromName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    default:
      return 'plaintext';
  }
}

export const RoomProvider: React.FC<{ roomId: string; children: React.ReactNode }> = ({
  roomId,
  children,
}) => {
  const { user } = useAuth();
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>(['file-main-ts', 'file-app-tsx']);
  const [activeFileId, setActiveFileId] = useState<string | null>('file-main-ts');

  useEffect(() => {
    const signalingUrl = import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:1234';
    const wsProvider = new WebsocketProvider(signalingUrl, roomId, doc);
    setProvider(wsProvider);

    // Set user awareness (name, email, color)
    if (user?.email) {
      const colors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
      const userColor = colors[Math.abs(user.email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];
      wsProvider.awareness.setLocalStateField('user', {
        name: user.email.split('@')[0],
        email: user.email,
        color: userColor,
      });
    }

    // Yjs Map for Files
    const yFilesMap = doc.getMap<ProjectFile>('project-files');

    const updateFilesFromYjs = () => {
      const loaded: ProjectFile[] = [];
      yFilesMap.forEach((file) => {
        loaded.push(file);
      });
      if (loaded.length > 0) {
        loaded.sort((a, b) => a.createdAt - b.createdAt);
        setFiles(loaded);
      }
    };

    const handleSync = (isSynced: boolean) => {
      if (!isSynced) return;
      const loaded: ProjectFile[] = [];
      yFilesMap.forEach((file) => loaded.push(file));

      if (loaded.length === 0) {
        // Initialize default files if map is empty
        DEFAULT_FILES.forEach((f) => {
          yFilesMap.set(f.id, f);
          const ytext = doc.getText('file:' + f.id);
          if (ytext.toString().length === 0) {
            if (f.name === 'main.ts') {
              ytext.insert(0, '// Welcome to ' + roomId + '\nconsole.log("Hello from collaborative main.ts!");\n');
            } else if (f.name === 'App.tsx') {
              ytext.insert(0, 'export default function App() {\n  return <h1>Collaborative Platform</h1>;\n}\n');
            } else if (f.name === 'styles.css') {
              ytext.insert(0, 'body {\n  font-family: sans-serif;\n  background: #111;\n  color: #fff;\n}\n');
            } else if (f.name === 'README.md') {
              ytext.insert(0, '# ' + roomId + '\nReal-time collaborative project workspace.\n');
            }
          }
        });
        setFiles(DEFAULT_FILES);
      } else {
        loaded.sort((a, b) => a.createdAt - b.createdAt);
        setFiles(loaded);
      }
    };

    wsProvider.on('synced', handleSync);
    yFilesMap.observe(updateFilesFromYjs);
    updateFilesFromYjs();

    return () => {
      wsProvider.off('synced', handleSync);
      yFilesMap.unobserve(updateFilesFromYjs);
      wsProvider.destroy();
    };
  }, [doc, roomId, user]);

  const createFile = (name: string) => {
    if (!name.trim()) return;
    const yFilesMap = doc.getMap<ProjectFile>('project-files');
    const id = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newFile: ProjectFile = {
      id,
      name: name.trim(),
      language: getLanguageFromName(name.trim()),
      createdAt: Date.now(),
    };
    yFilesMap.set(id, newFile);

    // Automatically open in tab and activate
    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveFileId(id);
  };

  const deleteFile = (id: string) => {
    const yFilesMap = doc.getMap<ProjectFile>('project-files');
    yFilesMap.delete(id);

    setOpenTabs((prev) => prev.filter((t) => t !== id));
    if (activeFileId === id) {
      const remaining = openTabs.filter((t) => t !== id);
      setActiveFileId(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const openFileTab = (id: string) => {
    if (!openTabs.includes(id)) {
      setOpenTabs((prev) => [...prev, id]);
    }
    setActiveFileId(id);
  };

  const closeFileTab = (id: string) => {
    const remaining = openTabs.filter((t) => t !== id);
    setOpenTabs(remaining);
    if (activeFileId === id) {
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };

  return (
    <RoomContext.Provider
      value={{
        roomId,
        doc,
        provider,
        files,
        createFile,
        deleteFile,
        activeFileId,
        setActiveFileId,
        openTabs,
        openFileTab,
        closeFileTab,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
