import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const messageSync = 0;
const messageAwareness = 1;
const messageQueryAwareness = 3;

class WSSharedDoc {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Map<WebSocket, Set<number>>;

  constructor(name: string) {
    this.name = name;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.conns = new Map();

    this.doc.on('update', (update: Uint8Array, origin: any) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      this.conns.forEach((_, conn) => {
        if (conn !== origin && conn.readyState === WebSocket.OPEN) {
          send(conn, message);
        }
      });
    });

    this.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      const changedClients = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);

      this.conns.forEach((_, conn) => {
        if (conn !== origin && conn.readyState === WebSocket.OPEN) {
          send(conn, buff);
        }
      });
    });
  }
}

const docs = new Map<string, WSSharedDoc>();

function getYDoc(docname: string, gc = true): WSSharedDoc {
  let doc = docs.get(docname);
  if (!doc) {
    doc = new WSSharedDoc(docname);
    doc.doc.gc = gc;
    docs.set(docname, doc);
  }
  return doc;
}

function send(conn: WebSocket, message: Uint8Array) {
  if (conn.readyState === WebSocket.OPEN) {
    conn.send(message);
  }
}

export function setupWSConnection(conn: WebSocket, req: http.IncomingMessage) {
  conn.binaryType = 'arraybuffer';
  const rawUrl = req.url || '';
  const docName = rawUrl.slice(1).split('?')[0] || 'default-room';
  const doc = getYDoc(docName);
  const controlledUserIds = new Set<number>();
  doc.conns.set(conn, controlledUserIds);

  // 1. Send sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc.doc);
  send(conn, encoding.toUint8Array(encoder));

  // 2. Send current awareness states
  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        doc.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(conn, encoding.toUint8Array(awarenessEncoder));
  }

  // 3. Handle messages from client
  conn.on('message', (message: ArrayBuffer) => {
    try {
      const u8 = new Uint8Array(message);
      const decoder = decoding.createDecoder(u8);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case messageSync: {
          const replyEncoder = encoding.createEncoder();
          encoding.writeVarUint(replyEncoder, messageSync);
          syncProtocol.readSyncMessage(decoder, replyEncoder, doc.doc, conn);
          if (encoding.length(replyEncoder) > 1) {
            send(conn, encoding.toUint8Array(replyEncoder));
          }
          break;
        }

        case messageAwareness: {
          const update = decoding.readVarUint8Array(decoder);
          // Parse client IDs from awareness update to track them for disconnect cleanup
          try {
            const dec = decoding.createDecoder(update);
            const len = decoding.readVarUint(dec);
            for (let i = 0; i < len; i++) {
              const clientID = decoding.readVarUint(dec);
              decoding.readVarUint(dec); // clock
              decoding.readVarString(dec); // state JSON
              controlledUserIds.add(clientID);
            }
          } catch (e) {
            // Ignore parse errors
          }

          awarenessProtocol.applyAwarenessUpdate(doc.awareness, update, conn);
          break;
        }

        case messageQueryAwareness: {
          const queryEncoder = encoding.createEncoder();
          encoding.writeVarUint(queryEncoder, messageAwareness);
          encoding.writeVarUint8Array(
            queryEncoder,
            awarenessProtocol.encodeAwarenessUpdate(
              doc.awareness,
              Array.from(doc.awareness.getStates().keys())
            )
          );
          send(conn, encoding.toUint8Array(queryEncoder));
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  // 4. Handle client disconnect
  conn.on('close', () => {
    doc.conns.delete(conn);
    if (controlledUserIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(
        doc.awareness,
        Array.from(controlledUserIds),
        null
      );
    }
    if (doc.conns.size === 0) {
      // Clean up empty room doc after 30 seconds if nobody rejoins
      setTimeout(() => {
        if (doc.conns.size === 0) {
          doc.awareness.destroy();
          doc.doc.destroy();
          docs.delete(docName);
        }
      }, 30000);
    }
  });
}

export function startSignalingServer(port: number = 1234): Promise<http.Server | null> {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('Yjs Signaling Server is running.');
    });

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Signaling Server] Port ${port} is already active, reusing existing instance.`);
        resolve(null);
      } else {
        console.warn(`[Signaling Server] Unexpected error on port ${port}:`, err.message);
        resolve(null);
      }
    });

    try {
      const wss = new WebSocketServer({ server });

      wss.on('error', (err) => {
        console.warn('[Signaling Server] WSS error caught:', err.message);
      });

      wss.on('connection', (conn, req) => {
        setupWSConnection(conn, req);
      });

      server.listen(port, () => {
        console.log(`[Signaling Server] Running on ws://localhost:${port}`);
        resolve(server);
      });
    } catch (err: any) {
      console.warn('[Signaling Server] Catch error:', err.message);
      resolve(null);
    }
  });
}
