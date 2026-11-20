import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

describe('1. File Type and Language Resolution Tests', () => {
  function getLanguageFromName(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      default:
        return 'plaintext';
    }
  }

  it('correctly maps TypeScript and TSX files', () => {
    assert.strictEqual(getLanguageFromName('App.tsx'), 'typescript');
    assert.strictEqual(getLanguageFromName('main.ts'), 'typescript');
  });

  it('correctly maps web and scripting files', () => {
    assert.strictEqual(getLanguageFromName('index.html'), 'html');
    assert.strictEqual(getLanguageFromName('styles.css'), 'css');
    assert.strictEqual(getLanguageFromName('package.json'), 'json');
    assert.strictEqual(getLanguageFromName('README.md'), 'markdown');
    assert.strictEqual(getLanguageFromName('script.py'), 'python');
  });

  it('defaults to plaintext for unknown files', () => {
    assert.strictEqual(getLanguageFromName('unknown.xyz'), 'plaintext');
  });
});

describe('2. In-Browser Code Runner & Execution Tests', () => {
  function stripTypeScript(code) {
    let cleaned = code;
    cleaned = cleaned.replace(/^\s*(export\s+)?interface\s+[A-Za-z0-9_]+(\s*<[^>]+>)?\s*\{[\s\S]*?\};?\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*(export\s+)?type\s+[A-Za-z0-9_]+(\s*<[^>]+>)?\s*=[\s\S]*?;?\s*$/gm, '');
    cleaned = cleaned.replace(/:\s*([A-Za-z0-9_<>\[\]|&\s]+)(?=[,)={])/g, '');
    cleaned = cleaned.replace(/\):\s*[A-Za-z0-9_<>\[\]|&\s]+(?=\s*(=>|\{))/g, ')');
    cleaned = cleaned.replace(/\s+as\s+[A-Za-z0-9_<>\[\]]+/g, '');
    return cleaned;
  }

  async function mockRunJS(code) {
    const logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
    };
    const cleaned = stripTypeScript(code);
    const runFn = new Function('console', `
      return (async () => {
        ${cleaned}
      })();
    `);
    const result = await runFn(customConsole);
    return { logs, result };
  }

  it('executes JavaScript / TypeScript arithmetic and logs output', async () => {
    const code = `
      interface User { name: string; age: number; }
      const a: number = 15;
      const b: number = 25;
      console.log('Sum:', a + b);
      return a + b;
    `;
    const { logs, result } = await mockRunJS(code);
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0], 'Sum: 40');
    assert.strictEqual(result, 40);
  });

  it('supports asynchronous execution and promises', async () => {
    const code = `
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
      await delay(10);
      console.log('Async operation complete');
      return 'OK';
    `;
    const { logs, result } = await mockRunJS(code);
    assert.strictEqual(logs[0], 'Async operation complete');
    assert.strictEqual(result, 'OK');
  });

  it('properly validates JSON syntax', () => {
    const valid = '{"platform": "Developer Collab", "version": "1.0"}';
    const parsed = JSON.parse(valid);
    assert.strictEqual(parsed.platform, 'Developer Collab');

    assert.throws(() => {
      JSON.parse('{ invalid json }');
    });
  });
});

describe('3. Yjs Real-Time CRDT State Synchronization Tests', () => {
  it('merges simultaneous edits from two clients without conflicts', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const ytext1 = doc1.getText('file:main.ts');
    const ytext2 = doc2.getText('file:main.ts');

    ytext1.insert(0, 'Hello from Client 1!\n');
    const update1 = Y.encodeStateAsUpdate(doc1);
    Y.applyUpdate(doc2, update1);

    assert.strictEqual(ytext2.toString(), 'Hello from Client 1!\n');

    // Concurrent edits
    ytext1.insert(ytext1.length, 'Client 1 addition.');
    ytext2.insert(ytext2.length, 'Client 2 addition.');

    const update1b = Y.encodeStateAsUpdate(doc1);
    const update2b = Y.encodeStateAsUpdate(doc2);

    Y.applyUpdate(doc2, update1b);
    Y.applyUpdate(doc1, update2b);

    assert.strictEqual(doc1.getText('file:main.ts').toString(), doc2.getText('file:main.ts').toString());
  });

  it('supports synchronized multi-file Map manipulation', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const files1 = doc1.getMap('project-files');
    const files2 = doc2.getMap('project-files');

    files1.set('file-1', { id: 'file-1', name: 'main.ts', language: 'typescript' });
    files1.set('file-2', { id: 'file-2', name: 'App.tsx', language: 'typescript' });

    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    assert.strictEqual(files2.size, 2);
    assert.strictEqual(files2.get('file-1').name, 'main.ts');
    assert.strictEqual(files2.get('file-2').name, 'App.tsx');

    // Delete a file on client 2 and propagate to client 1
    files2.delete('file-1');
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    assert.strictEqual(files1.size, 1);
    assert.strictEqual(files1.has('file-1'), false);
  });

  it('supports real-time chat array append and synchronization', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const chat1 = doc1.getArray('room-chat');
    const chat2 = doc2.getArray('room-chat');

    chat1.push([{ id: 'msg-1', sender: 'Alice', text: 'Hey team!' }]);
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    assert.strictEqual(chat2.length, 1);
    assert.strictEqual(chat2.get(0).sender, 'Alice');
  });

  it('encodes and decodes multi-user presence awareness state', () => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    awareness.setLocalStateField('user', {
      name: 'Shailendar',
      email: 'shailendar@gmail.com',
      color: '#3b82f6',
      isAudioOn: true,
      isVideoOn: false,
    });

    const localState = awareness.getLocalState();
    assert.strictEqual(localState.user.name, 'Shailendar');
    assert.strictEqual(localState.user.email, 'shailendar@gmail.com');
    assert.strictEqual(localState.user.isAudioOn, true);

    awareness.destroy();
    doc.destroy();
  });
});
