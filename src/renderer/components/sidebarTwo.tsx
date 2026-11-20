import React, { useState } from 'react';
import { useRoom } from '../contexts/RoomContext';

type Project = {
  id: string;
  name: string;
};

type Organization = {
  id: string;
  name: string;
  icon: string;
  projects: Project[];
};

type SidebarTwoProps = {
  organization: Organization | undefined;
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
};

export function SidebarTwo({ organization, selectedProjectId, onSelectProject }: SidebarTwoProps) {
  const { files, createFile, deleteFile, activeFileId, openFileTab } = useRoom();
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      createFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const getFileBadge = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) return { label: '⚛', color: 'text-blue-400' };
    if (name.endsWith('.ts') || name.endsWith('.js')) return { label: 'TS', color: 'text-blue-500' };
    if (name.endsWith('.css')) return { label: '#', color: 'text-sky-400' };
    if (name.endsWith('.html')) return { label: '<>', color: 'text-orange-400' };
    if (name.endsWith('.json')) return { label: '{}', color: 'text-amber-300' };
    if (name.endsWith('.md')) return { label: 'M↓', color: 'text-indigo-400' };
    return { label: '📄', color: 'text-gray-400' };
  };

  return (
    <aside className="min-w-0 w-64 h-full bg-[#1e1f22] text-white flex flex-col border-r border-[#2b2d31] select-none">
      {/* Organization header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#2b2d31] shrink-0">
        <h2 className="font-semibold text-sm truncate">{organization?.name || 'Workspace'}</h2>
        <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
          Sync Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Projects Section */}
        <div className="p-2 border-b border-[#2b2d31]/60">
          <div className="px-2 py-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
            Projects
          </div>
          <div className="flex flex-col gap-0.5">
            {organization?.projects.map((project) => {
              const isSelected = selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject?.(project.id)}
                  className={`w-full px-2.5 py-1.5 rounded-md flex items-center gap-2 text-left text-xs transition ${
                    isSelected
                      ? 'bg-[#35373c] text-white font-medium'
                      : 'text-gray-300 hover:bg-[#2b2d31] hover:text-white'
                  }`}
                >
                  <span className="text-gray-400 font-mono">#</span>
                  <span className="truncate">{project.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Files Section */}
        <div className="p-2">
          <div className="px-2 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Project Files
            </span>
            <button
              onClick={() => setIsCreatingFile(true)}
              className="text-gray-400 hover:text-white text-base hover:bg-[#35373c] w-5 h-5 flex items-center justify-center rounded"
              title="Add New File"
            >
              +
            </button>
          </div>

          {isCreatingFile && (
            <form onSubmit={handleCreateSubmit} className="px-2 mb-2">
              <input
                type="text"
                autoFocus
                placeholder="e.g. utils.ts"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => {
                  if (!newFileName.trim()) setIsCreatingFile(false);
                }}
                className="w-full bg-[#111214] text-xs text-white px-2 py-1.5 rounded border border-blue-500 outline-none"
              />
            </form>
          )}

          <div className="flex flex-col gap-0.5">
            {files.map((file) => {
              const isActive = activeFileId === file.id;
              const badge = getFileBadge(file.name);
              return (
                <div
                  key={file.id}
                  onClick={() => openFileTab(file.id)}
                  className={`group w-full px-2.5 py-1.5 rounded-md flex items-center justify-between cursor-pointer text-xs transition ${
                    isActive
                      ? 'bg-[#35373c] text-white font-medium'
                      : 'text-gray-300 hover:bg-[#2b2d31] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-[11px] font-mono font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="truncate">{file.name}</span>
                  </div>

                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 px-1 text-xs"
                      title="Delete file"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SidebarTwo;
