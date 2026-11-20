import React, { useRef, useEffect } from 'react';
import { ConsoleLogEntry } from '../../utils/codeRunner';

interface TerminalProps {
  logs: ConsoleLogEntry[];
  isRunning: boolean;
  executionTimeMs: number | null;
  onClear: () => void;
  onClose: () => void;
  fileName?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  logs,
  isRunning,
  executionTimeMs,
  onClear,
  onClose,
  fileName,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-48 w-full bg-[#141414] border-t border-[#2b2d31] flex flex-col font-mono text-xs select-none">
      {/* Terminal Header */}
      <div className="h-8 bg-[#181818] border-b border-[#2b2d31] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-300 tracking-wider uppercase flex items-center gap-1.5">
            <span className="text-emerald-400">⚡</span> Terminal & Output
          </span>

          {fileName && (
            <span className="text-[10px] bg-[#222] text-gray-400 px-2 py-0.5 rounded border border-[#333]">
              {fileName}
            </span>
          )}

          {isRunning && (
            <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Running...
            </span>
          )}

          {!isRunning && executionTimeMs !== null && (
            <span className="text-[10px] text-gray-500">
              Completed in {executionTimeMs}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#252525] transition text-[11px]"
            title="Clear Console Output"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#252525] transition text-sm"
            title="Close Terminal"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Terminal Content Logs */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 text-[11px] select-text">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-1 select-none">
            <span>Terminal ready.</span>
            <span className="text-[10px] text-gray-500">
              Click <b className="text-emerald-400">▶ Run Code</b> in the toolbar to execute your code and see outputs here.
            </span>
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            let badgeColor = 'text-gray-400';
            let prefix = '›';

            if (log.type === 'error') {
              badgeColor = 'text-red-400';
              prefix = '✖';
            } else if (log.type === 'warn') {
              badgeColor = 'text-amber-400';
              prefix = '⚠';
            } else if (log.type === 'info') {
              badgeColor = 'text-sky-400';
              prefix = 'ℹ';
            } else if (log.type === 'result') {
              badgeColor = 'text-emerald-400';
              prefix = '⬅';
            } else if (log.type === 'system') {
              badgeColor = 'text-purple-400';
              prefix = '⚡';
            }

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-gray-600 shrink-0 select-none">[{timeStr}]</span>
                <span className={`shrink-0 select-none ${badgeColor}`}>{prefix}</span>
                <div className={`flex-1 break-all whitespace-pre-wrap ${log.type === 'error' ? 'text-red-300' : 'text-gray-200'}`}>
                  {log.messages.join(' ')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Terminal;
