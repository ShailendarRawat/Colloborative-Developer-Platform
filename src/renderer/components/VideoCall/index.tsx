import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../../contexts/RoomContext';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface Participant {
  clientId: number;
  name: string;
  email: string;
  color: string;
  isAudioOn?: boolean;
  isVideoOn?: boolean;
}

export const VideoCall: React.FC<{ roomName: string }> = ({ roomName }) => {
  const { doc, provider } = useRoom();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'video' | 'chat' | 'people'>('video');
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 1. Sync Awareness for Active Participants
  useEffect(() => {
    if (!provider) return;

    const updateAwareness = () => {
      const states = provider.awareness.getStates();
      const list: Participant[] = [];
      states.forEach((state: any, clientId: number) => {
        if (state.user) {
          list.push({
            clientId,
            name: state.user.name || 'Anonymous',
            email: state.user.email || '',
            color: state.user.color || '#3b82f6',
            isAudioOn: state.user.isAudioOn || false,
            isVideoOn: state.user.isVideoOn || false,
          });
        }
      });
      setParticipants(list);
    };

    provider.awareness.on('change', updateAwareness);
    updateAwareness();

    return () => {
      provider.awareness.off('change', updateAwareness);
    };
  }, [provider]);

  // 2. Sync Real-Time In-Room Chat via Yjs Array
  useEffect(() => {
    const yChat = doc.getArray<ChatMessage>('room-chat');

    const updateChat = () => {
      setMessages(yChat.toArray());
    };

    yChat.observe(updateChat);
    updateChat();

    return () => {
      yChat.unobserve(updateChat);
    };
  }, [doc]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const yChat = doc.getArray<ChatMessage>('room-chat');
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sender: user?.email?.split('@')[0] || 'User',
      text: chatInput.trim(),
      timestamp: Date.now(),
    };

    yChat.push([newMsg]);
    setChatInput('');
  };

  // 3. Media Controls (Camera & Mic)
  const toggleCamera = async () => {
    if (isVideoActive) {
      // Turn off camera
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
      }
      setIsVideoActive(false);
      updateLocalMediaState(isAudioMuted, false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    } else {
      // Turn on camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: !isAudioMuted,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoActive(true);
        updateLocalMediaState(isAudioMuted, true);
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access camera. Please check camera permissions.');
      }
    }
  };

  const toggleMic = async () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    } else if (!nextMuted) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    }
    updateLocalMediaState(nextMuted, isVideoActive);
  };

  const updateLocalMediaState = (audioMuted: boolean, videoOn: boolean) => {
    if (provider && user?.email) {
      const currentState = provider.awareness.getLocalState() || {};
      provider.awareness.setLocalState({
        ...currentState,
        user: {
          ...currentState.user,
          isAudioOn: !audioMuted,
          isVideoOn: videoOn,
        },
      });
    }
  };

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#1e1f22] flex flex-col text-white select-none overflow-hidden">
      {/* Top Header Tabs */}
      <div className="h-10 bg-[#141517] flex items-center border-b border-[#2b2d31] shrink-0">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 h-full text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'video'
              ? 'text-white border-b-2 border-blue-500 bg-[#1e1f22]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>📹</span>
          <span>Call</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 h-full text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'chat'
              ? 'text-white border-b-2 border-blue-500 bg-[#1e1f22]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>💬</span>
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full font-bold">
              {messages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('people')}
          className={`flex-1 h-full text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'people'
              ? 'text-white border-b-2 border-blue-500 bg-[#1e1f22]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>👥</span>
          <span>Users</span>
          <span className="bg-emerald-600 text-white text-[10px] px-1.5 rounded-full font-bold">
            {participants.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* 1. Video Call View */}
        {activeTab === 'video' && (
          <div className="w-full h-full flex flex-col p-3 gap-3">
            {/* Video Tiles Grid */}
            <div className="flex-1 grid grid-cols-1 gap-2 overflow-y-auto">
              {/* Local User Tile */}
              <div className="relative bg-[#111214] rounded-lg border border-[#2b2d31] overflow-hidden flex items-center justify-center min-h-[140px]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoActive ? 'block' : 'hidden'}`}
                />
                {!isVideoActive && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-400">Camera is off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] text-white flex items-center gap-1.5">
                  <span>{user?.email?.split('@')[0]} (You)</span>
                  {isAudioMuted ? (
                    <span className="text-red-400" title="Muted">🔇</span>
                  ) : (
                    <span className="text-emerald-400" title="Mic On">🎙️</span>
                  )}
                </div>
              </div>

              {/* Remote Peer Tile / Placeholder */}
              {participants
                .filter((p) => p.email !== user?.email)
                .map((peer) => (
                  <div
                    key={peer.clientId}
                    className="relative bg-[#111214] rounded-lg border border-[#2b2d31] overflow-hidden flex items-center justify-center min-h-[140px]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: peer.color }}
                      >
                        {peer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-300 font-medium">{peer.name}</span>
                      <span className="text-[11px] text-emerald-400">Connected in Room</span>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] text-white flex items-center gap-1.5">
                      <span>{peer.name}</span>
                      {peer.isAudioOn ? (
                        <span className="text-emerald-400">🎙️</span>
                      ) : (
                        <span className="text-gray-400">🔇</span>
                      )}
                    </div>
                  </div>
                ))}

              {participants.filter((p) => p.email !== user?.email).length === 0 && (
                <div className="bg-[#111214]/60 border border-dashed border-[#2b2d31] rounded-lg flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-2xl mb-1">👋</span>
                  <p className="text-xs font-semibold text-gray-300">Invite a peer to code</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Share your Room ID with a classmate to collaborate!
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="h-12 bg-[#141517] rounded-lg border border-[#2b2d31] flex items-center justify-around px-2 shrink-0">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-full text-sm transition ${
                  isAudioMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isAudioMuted ? '🔇' : '🎙️'}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-2 rounded-full text-sm transition ${
                  !isVideoActive
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                title={isVideoActive ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isVideoActive ? '📹' : '🚫'}
              </button>

              <span className="text-[11px] text-gray-400 font-mono">
                {isAudioMuted ? 'Muted' : 'Speaking'}
              </span>
            </div>
          </div>
        )}

        {/* 2. In-Room Real-time Chat */}
        {activeTab === 'chat' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-4">
                  <span className="text-2xl mb-1">💬</span>
                  <p className="text-xs">No messages yet.</p>
                  <p className="text-[11px] text-gray-600">Send a note or code snippet to peers in this room.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender === (user?.email?.split('@')[0] || 'User');
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                        <span className="font-semibold">{m.sender}</span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-lg text-xs break-words ${
                          isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#2b2d31] text-gray-200 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-[#2b2d31] bg-[#141517] flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#1e1f22] text-xs text-white px-3 py-2 rounded border border-[#2b2d31] outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold transition"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* 3. Active Participants List */}
        {activeTab === 'people' && (
          <div className="w-full h-full p-3 overflow-y-auto flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1">
              Active in room ({participants.length})
            </div>
            {participants.map((p) => {
              const isMe = p.email === user?.email;
              return (
                <div
                  key={p.clientId}
                  className="p-2.5 rounded-lg bg-[#141517] border border-[#2b2d31] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white relative"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#141517]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">
                        {p.name} {isMe && '(You)'}
                      </span>
                      <span className="text-[10px] text-gray-400">{p.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{p.isAudioOn ? '🎙️' : '🔇'}</span>
                    <span>{p.isVideoOn ? '📹' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
