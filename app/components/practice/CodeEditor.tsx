import Editor, {type  Monaco } from '@monaco-editor/react';
import  { type editor } from 'monaco-editor';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import  { type ProgrammingLanguage } from './LanguageSelector';

interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

const languageMap: Record<ProgrammingLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
};

const EDITOR_CONFIG = {
  AUTOSAVE_DELAY: 1000,
  UNDO_LIMIT: 100,
  MAX_FILE_SIZE: 100000, // 100KB
  MIN_WORD_LENGTH: 3,
};

const LANGUAGE_CONFIGS: Record<ProgrammingLanguage, {
  tabSize: number;
  wordPattern?: RegExp;
  brackets?: [string, string][];
  autoClosingPairs?: { open: string; close: string }[];
}> = {
  python: {
    tabSize: 4,
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  },
  javascript: { tabSize: 2 },
  typescript: { tabSize: 2 },
  java: { tabSize: 4 },
  cpp: { tabSize: 4 },
};

export function CodeEditor({
  code,
  language,
  onChange,
  readOnly = false,
  height = '400px',
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [lastSavedCode, setLastSavedCode] = useState(code);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [monacoRef, setMonacoRef] = useState<Monaco | null>(null);

  const languageConfig = useMemo(() => LANGUAGE_CONFIGS[language], [language]);

  const debouncedSave = useCallback(
    (newCode: string) => {
      // Clear any existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set a new timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        setLastSavedCode(newCode);
        setIsAutoSaving(false);
        localStorage.setItem(`code_backup_${language}`, newCode);
      }, EDITOR_CONFIG.AUTOSAVE_DELAY);
    },
    [language]
  );

  useEffect(() => {
    if (!readOnly && code !== lastSavedCode && editorReady) {
      setIsAutoSaving(true);
      debouncedSave(code);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [code, language, lastSavedCode, readOnly, editorReady]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor;
    setMonacoRef(monacoInstance);

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChange?.(value);
      localStorage.setItem(`code_backup_${language}`, value);
    });

    const backup = localStorage.getItem(`code_backup_${language}`);
    if (backup && !code) {
      editor.setValue(backup);
    }

    setEditorReady(true);
  }, [code, language, onChange]);

  useEffect(() => {
    if (editorRef.current && monacoRef) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.editor.setModelLanguage(model, languageMap[language] || 'plaintext');

        editorRef.current.updateOptions({
          tabSize: languageConfig.tabSize,
          ...(languageConfig.wordPattern && { wordPattern: languageConfig.wordPattern }),
        });
      }
    }
  }, [language, languageConfig, monacoRef]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        className={`border border-gray-700 rounded-lg overflow-hidden ${
          isAutoSaving ? 'border-blue-500/50' : ''
        }`}
      >
        <Editor
          height={height}
          defaultLanguage={languageMap[language] || 'plaintext'}
          defaultValue={code}
          onChange={(value) => onChange?.(value || '')}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              Loading editor...
            </div>
          }
          options={{
            readOnly,
          }}
          className="w-full"
        />
      </div>
      {isAutoSaving && (
        <div
          className="absolute top-2 right-2 text-xs text-blue-400 bg-gray-800/90 px-2 py-1 rounded"
        >
          Saving...
        </div>
      )}
    </div>
  );
}
