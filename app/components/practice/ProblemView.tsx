import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import type { SupportedLanguage } from '~/routes/practice';
import { ClientOnly } from '../common/ClientOnly';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

interface ProblemViewProps {
  problem: {
    id: string;
    title: string;
    description: string;
    startingCode: string;
    difficulty: string;
    language: string;
    timeLimit: number;
    hints: string;
  };
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export function ProblemView({ problem, onSubmit, isSubmitting }: ProblemViewProps) {
  const [code, setCode] = useState(problem.startingCode);
  const [showHints, setShowHints] = useState(false);

  const handleSubmit = () => {
    onSubmit(code);
  };

  const hints = JSON.parse(problem?.hints || '[]');
  const difficultyColor = problem.difficulty === 'EASY' ? 'success' :
    problem.difficulty === 'MEDIUM' ? 'warning' : 'destructive';

  // Keyboard shortcuts
  useHotkeys('ctrl+enter, cmd+enter', () => onSubmit(code), { enableOnFormTags: true });
  useHotkeys('ctrl+h, cmd+h', () => setShowHints(prev => !prev), { enableOnFormTags: true });
  useHotkeys('ctrl+r, cmd+r', () => setCode(problem.startingCode), { enableOnFormTags: true });
  useHotkeys('?', () => setShowKeyboardShortcuts(prev => !prev), { enableOnFormTags: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 p-4 h-screen max-w-7xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex justify-between items-center bg-card p-4 rounded-lg shadow-md backdrop-blur-lg border border-purple-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
            >
              {problem.title}
            </motion.span>
            <div className="flex gap-2 mt-1">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Badge variant={difficultyColor}>{problem.difficulty}</Badge>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Badge variant="outline" className="cursor-pointer hover:bg-purple-500/20">
                  ⏰ {problem.timeLimit}s
                </Badge>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col space-y-4"
        >
          <Card className="flex-1 overflow-hidden backdrop-blur-lg border border-purple-500/20">
            <ScrollArea className="h-full p-6">
              <ReactMarkdown className="prose dark:prose-invert max-w-none">
                {problem.description}
              </ReactMarkdown>
              <AnimatePresence>
                {hints.length > 0 && showHints && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-3 border-t pt-4"
                  >
                    <h3 className="text-lg font-semibold">Hints</h3>
                    {hints.map((hint: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 bg-muted rounded-lg border border-border/50 hover:border-purple-500/50 transition-colors"
                      >
                        {hint}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </Card>

          {hints.length > 0 && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => setShowHints(!showHints)}
                className="w-full hover:bg-purple-500/20"
              >
                {showHints ? 'Hide Hints (H)' : 'Show Hints (H)'}
              </Button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col space-y-4"
        >
          <Card className="flex-1 overflow-hidden backdrop-blur-lg border border-purple-500/20">
            <div className="h-full">
              <Editor
                height="100%"
                defaultLanguage={problem.language.toLowerCase()}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  wrappingIndent: 'indent',
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: true,
                  tabSize: 4,
                  insertSpaces: true,
                  autoIndent: 'advanced',
                  formatOnPaste: true,
                  formatOnType: true,
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  autoClosingDelete: 'always',
                  autoSurround: 'brackets',
                  bracketPairColorization: { enabled: true },
                  guides: {
                    bracketPairs: true,
                    indentation: true
                  }
                }}
                onMount={(editor, monaco) => {
                  editor.focus();
                  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: true
                  });
                }}
              />
            </div>
          </Card>
          <div className="flex gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                variant="outline"
                onClick={() => setCode(problem.startingCode)}
                className="w-full hover:bg-purple-500/20"
              >
                Reset Code (R)
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ⚡
                    </motion.div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Solution (⌘/Ctrl + Enter)'
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
