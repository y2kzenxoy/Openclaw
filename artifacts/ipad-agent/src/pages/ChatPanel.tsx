import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Cpu, Wrench } from "lucide-react";
import { useGetChatHistory, useAgentChat, useClearChatHistory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export function ChatPanel() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: history, isLoading } = useGetChatHistory();
  const chatMutation = useAgentChat({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/agent/history"] });
      }
    }
  });
  const clearMutation = useClearChatHistory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/agent/history"] });
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history?.messages, chatMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate({
      data: { message: input, includeTools: true }
    });
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-primary/20 glass-panel">
        <div className="flex items-center gap-3 text-primary">
          <Cpu className="w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-mono uppercase tracking-wider text-glow">Agent Link</h1>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Purge
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 font-mono">Initializing connection...</span>
          </div>
        ) : history?.messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
            <Cpu className="w-16 h-16 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest">Awaiting Input</p>
          </div>
        ) : (
          history?.messages?.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div className="text-[10px] text-muted-foreground mb-1 font-mono px-2">
                {new Date(msg.timestamp).toLocaleTimeString()} • {msg.role.toUpperCase()}
              </div>
              
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary/20 border border-primary/50 text-primary-foreground rounded-tr-sm' 
                  : 'bg-card border border-primary/20 text-foreground rounded-tl-sm'
              }`}>
                {msg.thinking && (
                  <div className="mb-3 p-3 bg-black/50 rounded text-xs font-mono text-muted-foreground border-l-2 border-primary/30">
                    <div className="text-primary/50 mb-1 font-bold">/// INTERNAL LOGIC ///</div>
                    {msg.thinking}
                  </div>
                )}
                
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-primary/20 max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {msg.toolCalls.map((tool, i) => (
                      <div key={i} className="bg-secondary/50 rounded border border-primary/30 text-xs font-mono p-2">
                        <div className="flex items-center gap-2 text-primary mb-1">
                          <Wrench className="w-3 h-3" />
                          <span className="font-bold">{tool.tool}</span>
                        </div>
                        <div className="text-muted-foreground truncate opacity-70">IN: {tool.input}</div>
                        <div className="text-primary/70 line-clamp-2 mt-1">OUT: {tool.output}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {chatMutation.isPending && (
          <div className="flex items-center gap-3 text-primary/70 mr-auto max-w-[85%] p-4 bg-card border border-primary/20 rounded-2xl rounded-tl-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-sm animate-pulse">Processing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card/80 backdrop-blur-md border-t border-primary/20 pb-safe">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command directive..."
            disabled={chatMutation.isPending}
            className="flex-1 bg-black/50"
            autoFocus
          />
          <Button type="submit" disabled={chatMutation.isPending || !input.trim()} variant="terminal" size="icon">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
