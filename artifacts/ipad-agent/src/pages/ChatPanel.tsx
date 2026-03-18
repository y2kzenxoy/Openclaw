import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Cpu, ChevronDown, ChevronRight, Search, FileText, Code, AlertCircle, Wrench, Clock } from "lucide-react";
import { useGetChatHistory, useAgentChat, useClearChatHistory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  onStatusChange?: (status: "idle" | "working" | "error") => void;
}

/* ── Tool-call badge colour by tool name ─── */
function getToolBadgeClass(tool: string): string {
  const t = tool.toLowerCase();
  if (t.includes("search") || t.includes("web")) return "badge-search";
  if (t.includes("file") || t.includes("read") || t.includes("write")) return "badge-file";
  if (t.includes("code") || t.includes("run") || t.includes("exec") || t.includes("terminal")) return "badge-code";
  if (t.includes("error") || t.includes("fail")) return "badge-error";
  return "badge-tool";
}

function getToolIcon(tool: string) {
  const t = tool.toLowerCase();
  if (t.includes("search") || t.includes("web")) return <Search className="w-3 h-3" />;
  if (t.includes("file")) return <FileText className="w-3 h-3" />;
  if (t.includes("code") || t.includes("exec")) return <Code className="w-3 h-3" />;
  if (t.includes("error")) return <AlertCircle className="w-3 h-3" />;
  return <Wrench className="w-3 h-3" />;
}

/* ── Collapsible tool call card ─────────── */
function ToolCallCard({ tool, input, output }: { tool: string; input: string; output: string }) {
  const [open, setOpen] = useState(false);
  const badgeClass = getToolBadgeClass(tool);

  return (
    <div className={cn("rounded-md text-xs border overflow-hidden", badgeClass)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition-opacity"
      >
        {getToolIcon(tool)}
        <span className="font-semibold font-mono uppercase tracking-wide flex-1 truncate">{tool}</span>
        <Clock className="w-3 h-3 opacity-50" />
        {open ? <ChevronDown className="w-3 h-3 opacity-60" /> : <ChevronRight className="w-3 h-3 opacity-60" />}
      </button>
      {open && (
        <div className="border-t border-current/20 px-3 py-2 space-y-2 bg-black/20">
          <div>
            <p className="opacity-50 mb-0.5">INPUT</p>
            <p className="font-mono break-all opacity-80">{input}</p>
          </div>
          <div>
            <p className="opacity-50 mb-0.5">OUTPUT</p>
            <p className="font-mono break-all opacity-80 line-clamp-4">{output}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Thinking trace ─────────────────────── */
function ThinkingTrace({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent/40 transition-colors"
      >
        <Cpu className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono">Thinking trace</span>
        {open ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>
      {open && (
        <div className="px-3 py-2 text-xs font-mono text-muted-foreground bg-muted/30 border-t border-border whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
}

/* ── Main panel ─────────────────────────── */
export function ChatPanel({ onStatusChange }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading } = useGetChatHistory();
  const chatMutation = useAgentChat({
    mutation: {
      onMutate: () => onStatusChange?.("working"),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/agent/history"] });
        onStatusChange?.("idle");
      },
      onError: () => onStatusChange?.("error"),
    },
  });
  const clearMutation = useClearChatHistory({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/agent/history"] }),
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history?.messages, chatMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    chatMutation.mutate({ data: { message: input, includeTools: true } });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Session sidebar — desktop only */}
      <div className="hidden lg:flex flex-col w-52 xl:w-64 border-r border-border bg-sidebar flex-shrink-0">
        <div className="px-3 py-3 border-b border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sessions</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {/* Current session */}
          <div className="mx-2 my-1 px-3 py-2.5 rounded-md bg-primary/10 border border-primary/20 cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <span className="dot-green dot-pulse" />
              <span className="text-xs font-medium text-foreground truncate">Main Session</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {history?.messages?.slice(-1)[0]?.content?.slice(0, 40) || "No messages yet"}
            </p>
          </div>
        </div>
        {/* Token usage */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Context usage</span>
            <span>{history?.messages?.length ?? 0} msgs</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(((history?.messages?.length ?? 0) / 40) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            {chatMutation.isPending ? (
              <>
                <span className="dot-green dot-pulse" />
                <span className="text-xs text-muted-foreground">Agent processing…</span>
              </>
            ) : (
              <>
                <span className="dot-yellow" />
                <span className="text-xs text-muted-foreground">Agent idle</span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear history
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : history?.messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Agent ready</p>
                <p className="text-sm text-muted-foreground mt-1">Ask me anything about your iPad or web tasks.</p>
              </div>
            </div>
          ) : (
            history?.messages?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Meta */}
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  {msg.role !== "user" && <span className="dot-green" />}
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {msg.role === "user" ? "You" : "Agent"} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  )}
                >
                  {/* Thinking trace */}
                  {msg.thinking && <ThinkingTrace text={msg.thinking} />}

                  {/* Content */}
                  <div className="prose prose-invert prose-sm prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-primary max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Tool calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Tools used ({msg.toolCalls.length})
                      </p>
                      {msg.toolCalls.map((tc, i) => (
                        <ToolCallCard key={i} tool={tc.tool} input={tc.input} output={tc.output} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Pending indicator */}
          {chatMutation.isPending && (
            <div className="flex items-start gap-3 mr-auto max-w-[85%]">
              <div className="bg-card border border-border rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 bg-card border-t border-border">
          <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the agent anything…"
              disabled={chatMutation.isPending}
              className="flex-1 bg-background border-border h-11"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={chatMutation.isPending || !input.trim()}
              className="h-11 w-11 px-0 bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
