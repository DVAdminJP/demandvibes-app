"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPlatformColor, getPlatformLabel } from "@/lib/utils";

interface Campaign {
  id: string;
  campaign_name: string;
  platform: "google" | "meta" | "linkedin";
  status: string;
  spend: number;
  roas: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Which platform is giving me the best ROAS this month?",
  "Where should I reallocate budget to improve performance?",
  "Which campaigns should I pause?",
  "Compare my Google vs Meta performance",
];

interface AIChatProps {
  campaigns: Campaign[];
}

export function AIChat({ campaigns }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function toggleCampaign(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(campaigns.map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const selectedCampaigns = campaigns.filter((c) => selectedIds.has(c.id));
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          // Send only IDs — server fetches and verifies actual campaign data
          campaignIds: campaigns
            .filter((c) => selectedIds.has(c.id))
            .map((c) => c.id),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.delta?.text ?? "";
              fullContent += delta;
              setStreamingContent(fullContent);
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullContent },
      ]);
      setStreamingContent("");
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex h-full">
      {/* Left Panel: Campaign Context */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Campaign Context</h3>
            <span className="text-xs text-gray-400">{selectedIds.size}/{campaigns.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 hover:underline"
            >
              All
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={clearSelection}
              className="text-xs text-gray-500 hover:underline"
            >
              None
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {campaigns.map((c) => {
            const selected = selectedIds.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCampaign(c.id)}
                className={`w-full text-left rounded-lg p-2.5 text-xs transition-colors ${
                  selected
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="flex items-start gap-2">
                  {selected ? (
                    <CheckSquare className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{c.campaign_name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: getPlatformColor(c.platform) + "18",
                          color: getPlatformColor(c.platform),
                        }}
                      >
                        {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
                      </span>
                      <span className="text-gray-400">${c.spend.toLocaleString()}</span>
                      <span className="text-emerald-600 font-medium">{c.roas.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedIds.size > 0 && (
          <div className="p-3 border-t border-gray-100 bg-blue-50">
            <p className="text-xs text-blue-700 font-medium">
              {selectedIds.size} campaign{selectedIds.size > 1 ? "s" : ""} in context
            </p>
          </div>
        )}
      </div>

      {/* Right Panel: Chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Suggested Prompts */}
        {messages.length === 0 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Campaign AI</p>
                <p className="text-xs text-gray-500">Powered by Claude</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Ask me anything about your campaigns. Select specific campaigns on
              the left to include them as context.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-600 leading-relaxed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-gray-200"
                    : "bg-blue-600"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-gray-600" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streamingContent && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-white border border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-1.5 h-4 bg-blue-600 ml-0.5 animate-pulse" />
              </div>
            </div>
          )}

          {loading && !streamingContent && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white border border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-gray-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your campaigns... (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 min-h-[44px]"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 128) + "px";
                }}
              />
            </div>
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-11 w-11 rounded-xl flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI may make mistakes. Always verify recommendations before acting.
          </p>
        </div>
      </div>
    </div>
  );
}
