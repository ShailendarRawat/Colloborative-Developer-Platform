import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useRoom } from '../../contexts/RoomContext';
import { MonacoBinding } from 'y-monaco';

interface CodeEditorProps {
  fileId: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ fileId }) => {
  const { doc, provider, files } = useRoom();
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const bindingRef = useRef<any>(null);

  const currentFile = files.find((f) => f.id === fileId);

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
  };

  useEffect(() => {
    if (!editorInstance || !provider || !fileId) return;

    // Get or create the shared text type for this specific file
    const ytext = doc.getText('file:' + fileId);

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    bindingRef.current = new MonacoBinding(
      ytext,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      provider.awareness
    );

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [doc, provider, editorInstance, fileId]);

  return (
    <div className="w-full h-full bg-[#1e1e1e] overflow-hidden">
      <Editor
        height="100%"
        language={currentFile?.language || 'typescript'}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          automaticLayout: true,
          fontSize: 14,
          tabSize: 2,
        }}
      />
    </div>
  );
};
