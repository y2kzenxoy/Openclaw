import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Play, RefreshCw, Power, PowerOff } from "lucide-react";
import { useExecuteTerminalCommand, useGetTerminalStatus } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TerminalPanel() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<{type: 'in'|'out'|'error', text: string}[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // Poll status every 5 seconds
  const { data: status } = useGetTerminalStatus({
    query: { refetchInterval: 5000 }
  });

  const execMutation = useExecuteTerminalCommand();

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || execMutation.isPending) return;

    const cmd = command;
    setHistory(prev => [...prev, { type: 'in', text: `$ ${cmd}` }]);
    setCommand("");

    execMutation.mutate(
      { data: { command: cmd } },
      {
        onSuccess: (data) => {
          if (data.stdout) {
            setHistory(prev => [...prev, { type: 'out', text: data.stdout }]);
          }
          if (data.stderr) {
            setHistory(prev => [...prev, { type: 'error', text: data.stderr }]);
          }
          if (data.exitCode !== 0) {
            setHistory(prev => [...prev, { type: 'error', text: `[Process exited with code ${data.exitCode}]` }]);
          }
        },
        onError: (err: any) => {
          setHistory(prev => [...prev, { type: 'error', text: err.message || 'Execution failed' }]);
        }
      }
    );
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history, execMutation.isPending]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-black text-primary font-mono">
      {/* Header */}
      <header className="h-16 flex flex-shrink-0 items-center justify-between px-6 border-b border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-5 h-5 text-primary" />
          <h1 className="text-lg uppercase tracking-widest text-glow">Secure Shell</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            {status?.connected ? (
              <><Power className="w-4 h-4 text-green-500 animate-pulse" /><span className="text-green-500">CONNECTED</span></>
            ) : (
              <><PowerOff className="w-4 h-4 text-red-500" /><span className="text-red-500">OFFLINE</span></>
            )}
            <span className="opacity-50 ml-2">[{status?.mode || 'local'}]</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setHistory([])} title="Clear Terminal">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 text-sm md:text-base"
        style={{ textShadow: "0 0 5px rgba(0,255,65,0.4)" }}
      >
        <div className="text-primary/60 mb-4 whitespace-pre-wrap">
          {`iPad OS Agent Terminal v1.0.0
Authentication successful.
Environment: ${status?.mode?.toUpperCase() || 'UNKNOWN'}
`}
        </div>
        
        {history.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${
            line.type === 'in' ? 'text-white' : 
            line.type === 'error' ? 'text-red-500' : 'text-primary'
          }`}>
            {line.text}
          </div>
        ))}
        {execMutation.isPending && (
          <div className="animate-pulse opacity-70">Executing...</div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-primary/30 bg-black pb-safe">
        <form onSubmit={handleCommand} className="flex items-center gap-2">
          <span className="text-primary font-bold pl-2">$</span>
          <Input 
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-2 text-primary"
            placeholder="Enter command..."
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <Button type="submit" variant="terminal" size="icon" disabled={execMutation.isPending}>
            <Play className="w-4 h-4 fill-current" />
          </Button>
        </form>
      </div>
    </div>
  );
}
