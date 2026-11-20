import { startSignalingServer } from './y-server.js';

const port = Number(process.env.PORT) || 1234;

startSignalingServer(port)
  .then(() => {
    console.log(`[Signaling Server] Yjs Real-Time Collaboration Server Ready on port ${port}`);
  })
  .catch((err) => {
    console.error('[Signaling Server] Failed to start:', err);
  });
