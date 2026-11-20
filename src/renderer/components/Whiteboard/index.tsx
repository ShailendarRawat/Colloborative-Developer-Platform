import React, { useState, useEffect } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useYjsDoc } from '../../hooks/useYjsDoc';
import { IndexeddbPersistence } from 'y-indexeddb';

export const Whiteboard: React.FC<{ roomName: string }> = ({ roomName }) => {
  const { doc } = useYjsDoc(roomName);

  useEffect(() => {
    // Add local offline persistence for the Yjs doc
    const provider = new IndexeddbPersistence(roomName, doc);
    return () => {
      provider.destroy();
    };
  }, [doc, roomName]);

  return (
    <div className="w-full h-full border border-gray-300 rounded overflow-hidden relative">
      {/* 
        Note: Tldraw v2 removed direct built-in Yjs bindings from the core package.
        For a production app, you would use the 'useYjsStore' custom hook from 
        the tldraw examples repository to bind Tldraw's internal store to this Y.Doc.
      */}
      <Tldraw persistenceKey={roomName} />
    </div>
  );
};
