import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { ProgrammingLanguage } from './LanguageSelector';

interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

const languageMap: Record<ProgrammingLanguage, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
};

const EDITOR_CONFIG = {
  AUTOSAVE_DELAY: 1000,
  UNDO_LIMIT: 100,
  MAX_FILE_SIZE: 100000, // 100KB
  MIN_WORD_LENGTH: 3,
};

const LANGUAGE_CONFIGS: Record<ProgrammingLanguage, {
  tabSize: number,
  wordPattern?: RegExp,
  brackets?: [string, string][],
  autoClosingPairs?: { open: string, close: string }[],
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
  csharp: { tabSize: 4 },
  go: { tabSize: 4 },
  rust: { tabSize: 4 },
  ruby: { tabSize: 2 },
  php: { tabSize: 4 },
  swift: { tabSize: 4 },
  kotlin: { tabSize: 4 },
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
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const [editorReady, setEditorReady] = useState(false);

  const languageConfig = useMemo(() => LANGUAGE_CONFIGS[language], [language]);

  const debouncedSave = useCallback(
    debounce((newCode: string) => {
      setLastSavedCode(newCode);
      setIsAutoSaving(false);
      localStorage.setItem(`code_backup_${language}`, newCode);
    }, EDITOR_CONFIG.AUTOSAVE_DELAY),
    [language]
  );

  useEffect(() => {
    if (!readOnly && code !== lastSavedCode && editorReady) {
      setIsAutoSaving(true);
      debouncedSave(code);
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [code, language, lastSavedCode, readOnly, editorReady, debouncedSave]);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      readOnly,
      wordWrap: 'on',
      wrappingIndent: 'indent',
      automaticLayout: true,

      renderWhitespace: 'selection',
      renderControlCharacters: false,
      renderIndentGuides: false,
      renderLineHighlight: 'line',
      renderValidationDecorations: 'editable',
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false,
      },

      formatOnPaste: true,
      formatOnType: true,
      snippetSuggestions: 'inline',
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      bracketPairColorization: { enabled: true },
      'semanticHighlighting.enabled': true,
      tabSize: languageConfig.tabSize,
      wordBasedSuggestions: true,
      wordWrapBreakAfterCharacters: '\t})]?|&,;',
      wordWrapBreakBeforeCharacters: '{([+',
      
      maxUndoLimit: EDITOR_CONFIG.UNDO_LIMIT,
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      setLastSavedCode(code);
      setIsAutoSaving(false);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument').run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.copyLinesDownAction').run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeySlash, () => {
      editor.getAction('editor.action.commentLine').run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketLeft, () => {
      editor.getAction('editor.fold').run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketRight, () => {
      editor.getAction('editor.unfold').run();
    });

    if (language === 'python') {
      monaco.languages.registerDocumentFormattingEditProvider('python', {
        provideDocumentFormattingEdits: (model) => {
          const text = model.getValue();
          const formatted = text.split('\n').map(line => {
            const trimmed = line.trimEnd();
            const indent = line.length - line.trimLeft().length;
            const spaces = ' '.repeat(Math.floor(indent / 4) * 4);
            return spaces + trimmed;
          }).join('\n');
          
          return [{
            range: model.getFullModelRange(),
            text: formatted,
          }];
        }
      });

      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: (model, position) => {
          const suggestions = [
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'def ${1:name}(${2:params}):\n\t${0}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Function definition'
            },
            {
              label: 'class',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'class ${1:name}:\n\tdef __init__(self):\n\t\t${0}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Class definition'
            },
          ];

          return { suggestions };
        }
      });
    }

    const backup = localStorage.getItem(`code_backup_${language}`);
    if (backup && !code) {
      editor.setValue(backup);
    }

    setEditorReady(true);
  }, [code, language, languageConfig.tabSize, readOnly]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, languageMap[language] || 'plaintext');
        
        editorRef.current.updateOptions({
          tabSize: languageConfig.tabSize,
          wordPattern: languageConfig.wordPattern,
        });
      }
    }
  }, [language, languageConfig]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className={`border border-gray-700 rounded-lg overflow-hidden ${isAutoSaving ? 'border-blue-500/50' : ''}`}>
        <Editor
          height={height}
          defaultLanguage={languageMap[language] || 'plaintext'}
          defaultValue={code}
          onChange={(value) => onChange?.(value || '')}
          onMount={handleEditorDidMount}
          loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
          options={{
            readOnly,
          }}
          className="w-full"
        />
      </div>
      {isAutoSaving && (
        <div className="absolute top-2 right-2 text-xs text-blue-400 bg-gray-800/90 px-2 py-1 rounded">
          Saving...
        </div>
      )}
    </div>
  );
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced as T & { cancel: () => void };
}
