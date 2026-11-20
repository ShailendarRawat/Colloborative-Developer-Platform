import React, { useState } from 'react';
import { SidebarOne, Organization } from './components/sidebarOne';
import { SidebarTwo } from './components/sidebarTwo';
import { Playground } from './components/playground';
import { ScreenShare } from './components/ScreenShare';
import { VideoCall } from './components/VideoCall';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { useAuth } from './contexts/AuthContext';
import { RoomProvider } from './contexts/RoomContext';
import './App.css';

const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    name: 'JUET',
    icon: 'J',
    projects: [
      { id: 'p1', name: 'Developer Platform' },
      { id: 'p2', name: 'College Website' },
      { id: 'p3', name: 'Coding Club' },
    ],
  },
  {
    id: '2',
    name: 'Developer Hub',
    icon: 'D',
    projects: [
      { id: 'p4', name: 'Mobile App' },
      { id: 'p5', name: 'API Server' },
    ],
  },
  {
    id: '3',
    name: 'CodeXa',
    icon: 'C',
    projects: [
      { id: 'p6', name: 'Frontend Suite' },
      { id: 'p7', name: 'Collab Engine' },
    ],
  },
];

function CollabWorkspace({ roomId, onLeaveRoom }: { roomId: string; onLeaveRoom: () => void }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>(DEFAULT_ORGANIZATIONS);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('1');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('p1');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const selectedOrganization = organizations.find((org) => org.id === selectedOrgId);

  // Global keyboard shortcuts (Cmd+B to toggle sidebar, ? for help)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowHelpModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowHelpModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateOrg = () => {
    const name = prompt('Enter organization name:');
    if (name?.trim()) {
      const newOrg: Organization = {
        id: 'org-' + Date.now(),
        name: name.trim(),
        icon: name.trim().charAt(0).toUpperCase(),
        projects: [{ id: 'proj-' + Date.now(), name: 'General' }],
      };
      setOrganizations((prev) => [...prev, newOrg]);
      setSelectedOrgId(newOrg.id);
    }
  };

  return (
    <RoomProvider roomId={roomId}>
      <div className="flex flex-col h-screen w-full bg-[#111214] text-white overflow-hidden select-none">
        {/* Top Navbar */}
        <header className="h-12 bg-[#1e1f22] border-b border-[#2b2d31] px-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-gray-400 hover:text-white text-lg p-1 rounded hover:bg-[#313338] transition"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              ☰
            </button>
            <h1 className="font-bold text-sm tracking-wide text-white">Developer Collab Platform</h1>
            
            <div className="flex items-center gap-2 bg-[#111214] px-2.5 py-1 rounded-md border border-[#2b2d31] text-xs">
              <span className="text-gray-400">Room:</span>
              <span className="font-mono text-blue-400 font-semibold">{roomId}</span>
              <button
                onClick={handleCopyRoomId}
                className="text-gray-400 hover:text-white transition ml-1"
                title="Copy Room ID"
              >
                {copied ? '✓ Copied' : '📋'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Screen Share button */}
            <ScreenShare />

            {/* Help / Shortcuts Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-7 h-7 rounded bg-[#2b2d31] hover:bg-[#35373c] text-gray-300 hover:text-white flex items-center justify-center text-xs font-bold transition"
              title="Keyboard Shortcuts & Help (?)"
            >
              ?
            </button>

            {/* Toggle Video/Chat Panel */}
            <button
              onClick={() => setIsVideoPanelOpen(!isVideoPanelOpen)}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                isVideoPanelOpen
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#2b2d31] text-gray-300 hover:bg-[#35373c] hover:text-white'
              }`}
            >
              <span>📹</span>
              <span>{isVideoPanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
            </button>

            {/* Leave Room Button */}
            <button
              onClick={onLeaveRoom}
              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
            >
              Leave Room
            </button>

            {/* User Avatar badge */}
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white ml-1">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 flex w-full h-[calc(100vh-48px)] overflow-hidden">
          {/* Week 6 & 9: SidebarOne (Organizations) */}
          {!isSidebarCollapsed && (
            <SidebarOne
              organizations={organizations}
              selectedOrganizationId={selectedOrgId}
              onOrganizationSelect={setSelectedOrgId}
              onCreateOrganization={handleCreateOrg}
            />
          )}

          {/* Week 6 & 9: SidebarTwo (Projects & Collaborative Files) */}
          {!isSidebarCollapsed && (
            <SidebarTwo
              organization={selectedOrganization}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
            />
          )}

          {/* Week 6 & 9: Playground (Multi-Tab Monaco Editor + Whiteboard) */}
          <Playground />

          {/* Week 10: Video Call & Real-Time Communication Sidebar */}
          {isVideoPanelOpen && (
            <div className="w-80 h-full border-l border-[#2b2d31] shrink-0">
              <VideoCall roomName={roomId} />
            </div>
          )}
        </div>

        {/* Shortcuts & Documentation Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#2b2d31] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⌨️</span>
                  <h3 className="font-bold text-base text-white">Platform Shortcuts & Help</h3>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-400 hover:text-white rounded p-1 hover:bg-[#2b2d31] text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-[#141517] border border-[#2b2d31]/50">
                  <span className="text-gray-300">Execute Active Code</span>
                  <kbd className="px-2 py-1 rounded bg-[#2b2d31] text-gray-200 font-mono text-[11px] border border-[#35373c]">Cmd/Ctrl + Enter</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#141517] border border-[#2b2d31]/50">
                  <span className="text-gray-300">Toggle Explorer & Sidebars</span>
                  <kbd className="px-2 py-1 rounded bg-[#2b2d31] text-gray-200 font-mono text-[11px] border border-[#35373c]">Cmd/Ctrl + B</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#141517] border border-[#2b2d31]/50">
                  <span className="text-gray-300">Close Open Modal / Dialog</span>
                  <kbd className="px-2 py-1 rounded bg-[#2b2d31] text-gray-200 font-mono text-[11px] border border-[#35373c]">Escape</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#141517] border border-[#2b2d31]/50">
                  <span className="text-gray-300">Toggle Help & Shortcuts</span>
                  <kbd className="px-2 py-1 rounded bg-[#2b2d31] text-gray-200 font-mono text-[11px] border border-[#35373c]">?</kbd>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-blue-300 text-[11px] leading-relaxed">
                💡 <b>Real-time Sync:</b> Any file created in the Explorer, text typed in the Monaco editor, or drawing drawn on the Whiteboard is synchronized to all peers in room <span className="font-mono font-bold text-white">#{roomId}</span>.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoomProvider>
  );
}

function App() {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);

  if (!user) {
    return <Login />;
  }

  if (!roomId) {
    return <Dashboard onJoinRoom={setRoomId} />;
  }

  return <CollabWorkspace roomId={roomId} onLeaveRoom={() => setRoomId(null)} />;
}

export default App;
