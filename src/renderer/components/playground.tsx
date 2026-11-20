import React, { useState, useEffect } from 'react';
import { useRoom } from '../contexts/RoomContext';
import { CodeEditor } from './CodeEditor';
import { Whiteboard } from './Whiteboard';
import { Terminal } from './Terminal';
import { runCodeSnippet, ConsoleLogEntry } from '../utils/codeRunner';

export function Playground() {
  const { roomId, doc, files, activeFileId, setActiveFileId, openTabs, closeFileTab } = useRoom();
  const [viewMode, setViewMode] = useState<'editor' | 'whiteboard'>('editor');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<ConsoleLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleRunCode = async () => {
    if (!activeFileId || !activeFile) return;
    setIsRunning(true);
    setIsTerminalOpen(true);
    const code = doc.getText('file:' + activeFileId).toString();
    const result = await runCodeSnippet(code, activeFile.language);
    setTerminalLogs((prev) => [...prev, ...result.logs]);
    setExecutionTime(result.executionTimeMs);
    setIsRunning(false);
  };

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to Run Code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, activeFile, doc]);

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
    <div className="flex-1 h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* Top Bar: Tabs & View Mode Switcher */}
      <div className="h-10 bg-[#181818] border-b border-[#2b2d31] flex items-center justify-between shrink-0 select-none">
        {/* Open File Tabs */}
        <div className="flex-1 h-full flex items-center overflow-x-auto no-scrollbar">
          {viewMode === 'editor' &&
            openTabs.map((tabId) => {
              const file = files.find((f) => f.id === tabId);
              if (!file) return null;
              const isActive = activeFileId === tabId;
              const badge = getFileBadge(file.name);

              return (
                <div
                  key={tabId}
                  onClick={() => setActiveFileId(tabId)}
                  className={`h-full flex items-center gap-2 px-3 border-r border-[#2b2d31] cursor-pointer text-xs transition ${
                    isActive
                      ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500 font-medium'
                      : 'bg-[#141414] text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span>{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFileTab(tabId);
                    }}
                    className="ml-1 text-gray-400 hover:text-white rounded p-0.5 hover:bg-gray-700 text-xs"
                    title="Close tab"
                  >
                    ×
                  </button>
                </div>
              );
            })}

          {viewMode === 'whiteboard' && (
            <div className="h-full flex items-center px-4 bg-[#1e1e1e] text-white border-t-2 border-t-blue-500 text-xs font-medium">
              🎨 Collaborative Whiteboard
            </div>
          )}
        </div>

        {/* Actions & View Switcher */}
        <div className="flex items-center gap-2 px-3 border-l border-[#2b2d31] h-full">
          {viewMode === 'editor' && activeFileId && (
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-2.5 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium flex items-center gap-1 transition shadow-sm"
              title="Run Code (Cmd+Enter or Ctrl+Enter)"
            >
              <span>{isRunning ? '⏳' : '▶'}</span>
              <span>Run</span>
            </button>
          )}

          {viewMode === 'editor' && (
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
                isTerminalOpen
                  ? 'bg-[#35373c] text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Toggle Terminal"
            >
              <span>💻</span>
              <span>Terminal</span>
            </button>
          )}

          <div className="w-px h-4 bg-[#2b2d31] my-auto" />

          <button
            onClick={() => setViewMode('editor')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              viewMode === 'editor'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setViewMode('whiteboard')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              viewMode === 'whiteboard'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Whiteboard
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        {viewMode === 'editor' ? (
          <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
            <div className="flex-1 w-full relative overflow-hidden">
              {activeFileId && activeFile ? (
                <CodeEditor fileId={activeFileId} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                  <span className="text-3xl">📂</span>
                  <p className="text-sm">No file is currently open.</p>
                  <p className="text-xs text-gray-600">Select a file from the sidebar explorer to start editing.</p>
                </div>
              )}
            </div>

            {/* Terminal Drawer */}
            {isTerminalOpen && (
              <Terminal
                logs={terminalLogs}
                isRunning={isRunning}
                executionTimeMs={executionTime}
                onClear={() => setTerminalLogs([])}
                onClose={() => setIsTerminalOpen(false)}
                fileName={activeFile?.name}
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full">
            <Whiteboard roomName={roomId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Playground;
