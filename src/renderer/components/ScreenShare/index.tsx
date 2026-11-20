import React, { useState } from 'react';

export const ScreenShare: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const loadSources = async () => {
    if (window.electronAPI && typeof window.electronAPI.getDesktopSources === 'function') {
      try {
        const desktopSources = await window.electronAPI.getDesktopSources();
        if (desktopSources && desktopSources.length > 0) {
          setSources(desktopSources);
          setIsModalOpen(true);
          return;
        }
      } catch (err) {
        console.warn('Electron desktopCapturer error, falling back to getDisplayMedia:', err);
      }
    }

    // Fallback: standard web getDisplayMedia (works everywhere: browser & desktop)
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setStream(mediaStream);
    } catch (e: any) {
      if (e.name !== 'NotAllowedError') {
        console.error('Screen sharing error:', e);
        alert('Could not start screen sharing: ' + (e.message || e));
      }
    }
  };

  const selectSource = async (sourceId: string) => {
    setIsModalOpen(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId
          }
        } as any
      });
      setStream(mediaStream);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative flex items-center">
      <button 
        onClick={loadSources}
        className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] hover:text-white text-gray-300 rounded text-xs font-semibold transition flex items-center gap-1.5"
      >
        <span>🖥️</span>
        <span>Share Screen</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded shadow-xl w-full max-w-4xl flex flex-col h-[80vh]">
            <h2 className="text-xl font-bold mb-4">Select a Screen or Window to Share</h2>
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4">
              {sources.map(s => (
                <div 
                  key={s.id} 
                  className="flex flex-col items-center bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600 transition"
                  onClick={() => selectSource(s.id)}
                >
                  <img src={s.thumbnail} alt={s.name} className="w-full h-auto mb-2 object-contain" />
                  <span className="text-sm truncate w-full text-center">{s.name}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white align-self-end"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {stream && (
        <div className="fixed bottom-4 right-4 w-64 bg-black border border-gray-700 rounded shadow-xl overflow-hidden group">
          <video 
            autoPlay 
            className="w-full h-full object-cover" 
            ref={video => {
              if (video) video.srcObject = stream;
            }}
          />
          <button 
            className="absolute top-2 right-2 bg-red-600 text-white rounded px-2 opacity-0 group-hover:opacity-100 transition"
            onClick={() => {
              stream.getTracks().forEach(t => t.stop());
              setStream(null);
            }}
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
};
