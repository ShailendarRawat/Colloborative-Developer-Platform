import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function useYjsDoc(roomName: string) {
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    // Connect to signaling server (defaults to local ws://localhost:1234 or cloud URL)
    const signalingUrl = import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:1234';
    const wsProvider = new WebsocketProvider(signalingUrl, roomName, doc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
    };
  }, [doc, roomName]);

  return { doc, provider };
}
