import React, { memo } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../contexts/ThemeContext';

const CodeEditor = ({ code, language, onChange, onMount, options = {} }) => {
  const { isDarkMode } = useTheme();
  const handleEditorChange = (value) => {
    onChange(value);
  };

  const beforeMount = (monaco) => {
    monaco.editor.defineTheme('syntax-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string', foreground: 'a5f3fc' },
        { token: 'keyword', foreground: '818cf8' },
        { token: 'comment', foreground: '334155' },
        { token: 'function', foreground: '34d399' },
        { token: 'number', foreground: 'fb923c' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#334155',
        'editorCursor.foreground': '#6366f1',
      },
    });

    monaco.editor.defineTheme('syntax-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string', foreground: '0891b2' },
        { token: 'keyword', foreground: '4f46e5' },
        { token: 'comment', foreground: '94a3b8' },
        { token: 'function', foreground: '059669' },
        { token: 'number', foreground: 'ea580c' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editor.selectionBackground': '#e2e8f0',
        'editorCursor.foreground': '#4f46e5',
      },
    });
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        theme={isDarkMode ? 'syntax-dark' : 'syntax-light'}
        onChange={handleEditorChange}
        onMount={onMount}
        beforeMount={beforeMount}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          minimap: { enabled: false },
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          roundedSelection: true,
          cursorStyle: 'line',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          renderValidationDecorations: 'off',
          'semanticHighlighting.enabled': false,
          ...options,
        }}
      />
    </div>
  );
};

CodeEditor.displayName = 'CodeEditor';

export default memo(CodeEditor);
