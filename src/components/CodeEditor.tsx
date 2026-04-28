import React, { useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Socket } from 'socket.io-client';
import { Play } from 'lucide-react';
import { simulateCodeExecution } from '../services/geminiService';

interface CodeEditorProps {
  socket: Socket | null;
  roomId: string;
  initialCode: string;
  initialLanguage: string;
  onRun: (output: string) => void;
}

export default function CodeEditor({ socket, roomId, initialCode, initialLanguage, onRun }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [isRunning, setIsRunning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isRemoteUpdate = React.useRef(false);

  useEffect(() => {
    isRemoteUpdate.current = true;
    setCode(initialCode);
    setTimeout(() => { isRemoteUpdate.current = false; }, 50);
  }, [initialCode]);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  const defaultSnippets: Record<string, string> = {
    javascript: `// JavaScript Example\nconsole.log("Hello, World!");\n\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("Developer"));`,
    python: `# Python Example\nprint("Hello, World!")\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Developer"))`,
    cpp: `// C++ Example\n#include <iostream>\n#include <string>\n\nstd::string greet(std::string name) {\n    return "Hello, " + name + "!";\n}\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    std::cout << greet("Developer") << std::endl;\n    return 0;\n}`,
    java: `// Java Example\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        System.out.println(greet("Developer"));\n    }\n\n    public static String greet(String name) {\n        return "Hello, " + name + "!";\n    }\n}`,
  };

  const languages = [
    { name: 'JavaScript', value: 'javascript' },
    { name: 'Python', value: 'python' },
    { name: 'C++', value: 'cpp' },
    { name: 'Java', value: 'java' },
  ];

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && !isRemoteUpdate.current) {
      setCode(value);
      socket?.emit('code:change', { roomId, code: value });
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket?.emit('language:change', { roomId, language: newLang });
    
    // Also update code with snippet if it's currently default
    if (code === defaultSnippets[language] || code === '// Start coding here...') {
      const newSnippet = defaultSnippets[newLang] || '// Start coding here...';
      setCode(newSnippet);
      socket?.emit('code:change', { roomId, code: newSnippet });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      if (language === 'javascript') {
        const response = await fetch('/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language }),
        });
        const data = await response.json();
        onRun(data.output);
      } else {
        // Use Gemini to simulate execution for other languages
        const output = await simulateCodeExecution(code, language);
        if (output.startsWith('Simulation Error:')) {
          onRun(output);
        } else {
          onRun(`[${language.toUpperCase()} SIMULATION] Output:\n${output}`);
        }
      }
    } catch (error: any) {
      onRun(`Error: Failed to execute code. ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900">
      {/* Editor Toolbar */}
      <div className="h-10 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/80 gap-4">
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className={`flex items-center gap-2 px-3 py-1 ${
            isRunning ? 'bg-emerald-600/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
          } text-white text-xs font-medium rounded-md transition-colors shadow-sm`}
        >
          <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
          {isRunning ? 'Running...' : 'Run'}
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] rounded px-2 py-0.5 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-zinc-200 text-[10px] font-medium rounded hover:bg-zinc-800 transition-all"
          >
            {isCopied ? 'Copied!' : 'Copy Code'}
          </button>
          <div className="w-px h-3 bg-zinc-800" />
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider opacity-50">Editor</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            padding: { top: 10 },
            smoothScrolling: true,
            cursorSmoothCaretAnimation: "on",
            lineNumbersMinChars: 3,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
