import { Terminal as TerminalIcon, XCircle } from 'lucide-react';

interface TerminalProps {
  output: string;
  language: string;
  onClear: () => void;
}

export default function Terminal({ output, language, onClear }: TerminalProps) {
  return (
    <div className="flex flex-col h-full bg-[#0f111a] border-t border-zinc-800">
      <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Terminal</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Language:</span>
            <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-wider">{language}</span>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-all"
          title="Clear Terminal"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800">
        {output ? (
          <pre className="text-zinc-300 whitespace-pre-wrap break-words">
            {output}
          </pre>
        ) : (
          <span className="text-zinc-600 italic">No output yet. Run your code to see results here.</span>
        )}
      </div>
    </div>
  );
}
