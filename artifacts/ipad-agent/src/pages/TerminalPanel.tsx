import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Play, Trash2, Wifi, WifiOff } from "lucide-react";
import { useExecuteTerminalCommand, useGetTerminalStatus } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TerminalPanel() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<{ type: "in" | "out" | "error"; text: string }[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);

  const { data: status } = useGetTerminalStatus({ query: { refetchInterval: 5000 } });
  const execMutation = useExecuteTerminalCommand();

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || execMutation.isPending) return;
    const cmd = command;
    setHistory((prev) => [...prev, { type: "in", text: `$ ${cmd}` }]);
    setCmdHistory((prev) => [cmd, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    setCommand("");

    execMutation.mutate(
      { data: { command: cmd } },
      {
        onSuccess: (data) => {
          if (data.stdout) setHistory((prev) => [...prev, { type: "out", text: data.stdout }]);
          if (data.stderr) setHistory((prev) => [...prev, { type: "error", text: data.stderr }]);
          if (data.exitCode !== 0) setHistory((prev) => [...prev, { type: "error", text: `[Exit ${data.exitCode}]` }]);
        },
        onError: (err: any) => {
          setHistory((prev) => [...prev, { type: "error", text: err.message || "Execution failed" }]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setCommand(cmdHistory[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setCommand(next === -1 ? "" : (cmdHistory[next] ?? ""));
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history, execMutation.isPending]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-emerald-400 font-mono">
      {/* Panel header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Secure Shell</span>
          <span className={cn(
            "ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
            status?.connected ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
          )}>
            {status?.connected ? `SSH · ${status.mode}` : "Local"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {status?.connected
              ? <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              : <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground hidden sm:block">
              {status?.connected ? status.host || "connected" : "offline"}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistory([])} title="Clear">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-4 space-y-0.5 text-sm">
        <div className="text-emerald-600 mb-3 text-xs">
          {`AgentLink Terminal — ${status?.mode?.toUpperCase() ?? "LOCAL"} mode\nType a command and press Enter.\n`}
        </div>
        {history.map((line, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap break-all leading-relaxed",
              line.type === "in"    ? "text-white" :
              line.type === "error" ? "text-red-400" :
                                      "text-emerald-400"
            )}
          >
            {line.text}
          </div>
        ))}
        {execMutation.isPending && (
          <div className="text-emerald-500 animate-pulse text-xs">Executing…</div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border bg-card">
        <span className="text-primary font-bold text-sm select-none">$</span>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 text-emerald-400 font-mono placeholder:text-muted-foreground/40 h-9"
          placeholder="Enter command…"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button
          type="button"
          onClick={handleCommand as any}
          size="icon"
          disabled={execMutation.isPending || !command.trim()}
          className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
        </Button>
      </div>
    </div>
  );
}
