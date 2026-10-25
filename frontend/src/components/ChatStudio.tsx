"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Bot,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  ChevronDown,
  GitFork,
  Bug,
  Code2,
  Sparkles,
  Download,
  FileDown,
  Printer,
  Headphones,
  Radio,
  ExternalLink
} from "lucide-react";
import { ChatMessage, SavedSession, ActiveTab } from "../types";
import { apiSendChatMessage, apiStreamChatMessage } from "../lib/api";

interface ChatStudioProps {
  initialPrompt?: string;
  initialMessages?: ChatMessage[];
  sessionId?: string | null;
  onSaveSession: (session: SavedSession) => void;
  onNewChat?: () => void;
  onGenerateSlidesFromText: (text: string) => void;
  onSwitchTab: (tab: ActiveTab, promptText?: string) => void;
  onAttachFile: (file: File) => void;
}

export const ChatStudio: React.FC<ChatStudioProps> = ({
  initialPrompt = "",
  initialMessages = [],
  sessionId = null,
  onSaveSession,
  onNewChat,
  onGenerateSlidesFromText,
  onSwitchTab,
  onAttachFile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const sessionIdRef = useRef<string | null>(sessionId);
  const firstPromptRef = useRef<string>(
    initialMessages.find((m) => m.role === "user")?.content || ""
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [agentDropdown, setAgentDropdown] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("Agent");

  // Feature 2: Hands-Free Voice Mode state & ref
  const [isHandsFree, setIsHandsFree] = useState(false);
  const isHandsFreeRef = useRef(false);

  // Feature 5: Export dropdown state
  const [exportDropdown, setExportDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef("");

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
  }, [isHandsFree]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      const userFirst = initialMessages.find((m) => m.role === "user");
      if (userFirst) {
        firstPromptRef.current = userFirst.content;
      }
    }
  }, [sessionId, initialMessages]);

  const handleLocalNewChat = () => {
    setMessages([]);
    setInput("");
    sessionIdRef.current = null;
    firstPromptRef.current = "";
    onNewChat?.();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const toggleVoiceInput = () => {
    const win = typeof window !== "undefined" ? (window as any) : null;
    const SpeechRec = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsRecording(false);
      baseInputRef.current = "";
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";

      baseInputRef.current = input.trim();

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalStr += text + " ";
          } else {
            interimStr += text;
          }
        }

        const base = baseInputRef.current ? baseInputRef.current + " " : "";
        const combined = `${base}${finalStr}${interimStr}`.replace(/\s+/g, " ").trim();
        setInput(combined);
      };

      rec.onerror = (e: any) => {
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Speech recognition error:", e.error);
        }
        setIsRecording(false);
        baseInputRef.current = "";
      };

      rec.onend = () => {
        setIsRecording(false);
        baseInputRef.current = "";
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      setIsRecording(false);
      baseInputRef.current = "";
    }
  };

  const handleCopyCode = async (index: number, codeText: string) => {
    await navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (messages.length === 0) return;
    let md = `# Voxify AI Study Transcript\n\n`;
    md += `*Exported on: ${new Date().toLocaleString()}*\n\n---\n\n`;
    messages.forEach((m) => {
      const author = m.role === "user" ? "👤 You" : `🤖 Voxify AI (${m.engine || "LLM"})`;
      md += `### ${author} [${m.timestamp || ""}]\n\n${m.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `voxify-chat-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setExportDropdown(false);
  };

  const handleCopyAllTranscript = async () => {
    if (messages.length === 0) return;
    let text = `VOXIFY AI STUDY TRANSCRIPT\nDate: ${new Date().toLocaleString()}\n\n`;
    messages.forEach((m) => {
      text += `[${m.role === "user" ? "YOU" : "VOXIFY AI"}]:\n${m.content}\n\n`;
    });
    await navigator.clipboard.writeText(text);
    setExportDropdown(false);
    alert("Full conversation transcript copied to clipboard!");
  };

  // Hands-free continuous loop controller
  const startListeningHandsFree = () => {
    const win = typeof window !== "undefined" ? (window as any) : null;
    const SpeechRec = win?.SpeechRecognition || win?.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";

      let accumulatedFinal = "";
      let lastSpokenText = "";
      let silenceTimer: any = null;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalStr += text + " ";
          } else {
            interimStr += text;
          }
        }

        accumulatedFinal = finalStr;
        const currentFull = `${finalStr}${interimStr}`.replace(/\s+/g, " ").trim();
        lastSpokenText = currentFull;
        setInput(currentFull);

        if (silenceTimer) clearTimeout(silenceTimer);
        if (currentFull) {
          silenceTimer = setTimeout(() => {
            if (isHandsFreeRef.current && lastSpokenText.trim()) {
              try { rec.stop(); } catch (_) {}
              handleSend(lastSpokenText.trim());
            }
          }, 1400);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Hands-free speech recognition error:", e.error);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        if (silenceTimer) clearTimeout(silenceTimer);
        const toSend = (accumulatedFinal || lastSpokenText).trim();
        if (toSend && isHandsFreeRef.current && !isLoading) {
          handleSend(toSend);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const speakHandsFreeResponse = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[#*`_]/g, "")
      .replace(/```[\s\S]*?```/g, "Code example available on screen.");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.lang = "en-US";

    setSpeakingId(id);

    utterance.onend = () => {
      setSpeakingId(null);
      if (isHandsFreeRef.current) {
        setTimeout(() => {
          startListeningHandsFree();
        }, 400);
      }
    };

    utterance.onerror = () => {
      setSpeakingId(null);
      if (isHandsFreeRef.current) {
        setTimeout(() => {
          startListeningHandsFree();
        }, 400);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleHandsFree = () => {
    const nextState = !isHandsFree;
    setIsHandsFree(nextState);
    isHandsFreeRef.current = nextState;

    if (!nextState) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsRecording(false);
      setSpeakingId(null);
    } else {
      startListeningHandsFree();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || isLoading) return;

    if (content.includes("youtube.com") || content.includes("youtu.be")) {
      onSwitchTab("video", content);
      return;
    }

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantId = "ast_" + Date.now();
    const initialAssistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyForApi = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let accumulatedContent = "";
      let capturedEngine = "";

      await apiStreamChatMessage(
        historyForApi,
        content,
        (delta, engine) => {
          if (engine) capturedEngine = engine;
          if (delta) {
            accumulatedContent += delta;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: accumulatedContent, engine: capturedEngine || msg.engine }
                  : msg
              )
            );
          }
        },
        () => {
          // Stream completed
          const finalAssistantMsg: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: accumulatedContent,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isStreaming: false,
            engine: capturedEngine,
          };

          const fullHistory = [...messages, userMsg, finalAssistantMsg];

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, isStreaming: false, engine: capturedEngine || msg.engine }
                : msg
            )
          );
          setIsLoading(false);

          if (!sessionIdRef.current) {
            sessionIdRef.current = "chat_" + Date.now();
          }
          if (!firstPromptRef.current) {
            firstPromptRef.current = content;
          }

          // Don't clutter recent chats with single 1-word trivial greetings like "hi", "hello"
          const trimmedPrompt = content.trim().toLowerCase();
          const isTrivial =
            fullHistory.length <= 2 &&
            ["hi", "hello", "hey", "test", "hlo", "hii"].includes(trimmedPrompt);

          if (!isTrivial) {
            const rawTitle = firstPromptRef.current.slice(0, 36).trim();
            const sessionTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

            onSaveSession({
              id: sessionIdRef.current,
              title: sessionTitle,
              type: "chat",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              preview: accumulatedContent.slice(0, 80) + "...",
              content: accumulatedContent,
              messages: fullHistory,
            });
          }

          // Hands-free voice response
          if (isHandsFreeRef.current && accumulatedContent.trim()) {
            speakHandsFreeResponse(assistantId, accumulatedContent);
          }
        },
        (err) => {
          console.error("Streaming error:", err);
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content || "Could not generate response. Please try again.", isStreaming: false }
                : msg
            )
          );
        }
      );
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const toggleSpeech = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.lang = "en-US";
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAttachFile(e.target.files[0]);
    }
  };

  // Helper to render markdown bold, inline code, lists, and headings cleanly
  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\[.*?\]\(https?:\/\/.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
        const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/.*?)\)$/);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium inline-flex items-center gap-0.5 transition-colors"
            >
              {label}
              <ExternalLink className="w-3 h-3 inline opacity-70 ml-0.5" />
            </a>
          );
        }
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-neutral-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic text-neutral-800">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="font-mono text-xs bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderTextMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={"ul-" + elements.length} className="my-2.5 space-y-1.5 pl-5 list-disc marker:text-neutral-400">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        elements.push(<div key={"sp-" + index} className="h-2" />);
        return;
      }

      if (trimmed.startsWith("#### ")) {
        flushList();
        elements.push(
          <h5 key={"h5-" + index} className="font-semibold text-[15px] text-neutral-900 mt-3.5 mb-1 tracking-tight">
            {renderInlineMarkdown(trimmed.replace(/^####\s+/, ""))}
          </h5>
        );
        return;
      }

      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h4 key={"h4-" + index} className="font-semibold text-[16px] text-neutral-900 mt-4 mb-1.5 tracking-tight">
            {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
          </h4>
        );
        return;
      }

      if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <h3 key={"h3-" + index} className="font-semibold text-[17px] text-neutral-900 mt-5 mb-2 tracking-tight">
            {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        currentList.push(trimmed.replace(/^[-*]\s+/, ""));
        return;
      }

      flushList();
      elements.push(
        <p key={"p-" + index} className="my-1.5 leading-[1.75]">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });

    flushList();
    return <div className="space-y-0.5">{elements}</div>;
  };

  const renderFormattedContent = (content: string, isStreaming?: boolean) => {
    // Split into code blocks and normal text blocks
    const codeBlockRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
    const parts: { type: "text" | "code"; lang?: string; code?: string; content?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: "code", lang: match[1] || "code", code: match[2].trimEnd() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.slice(lastIndex) });
    }

    let codeBlockCount = 0;
    return (
      <div className="space-y-2">
        {parts.map((part, pIdx) => {
          if (part.type === "code" && part.code !== undefined) {
            const currentCodeIndex = codeBlockCount++;
            const langLabel = (part.lang || "code").toUpperCase();
            return (
              <div
                key={"code-" + pIdx}
                className="my-3.5 rounded-2xl overflow-hidden border border-neutral-800 bg-[#141414] text-neutral-100 shadow-sm font-sans"
              >
                {/* Code Header Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#1f1f1f] border-b border-neutral-800/80 text-[11px]">
                  <span className="font-mono text-neutral-400 font-semibold tracking-wider">
                    {langLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(currentCodeIndex, part.code!)}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors py-0.5 px-2 rounded-md hover:bg-neutral-800"
                    title="Copy code to clipboard"
                  >
                    {copiedCodeIndex === currentCodeIndex ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy code</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Code Content */}
                <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-neutral-200 no-scrollbar">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }

          // Normal markdown text
          return <div key={"txt-" + pIdx}>{renderTextMarkdown(part.content || "")}</div>;
        })}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-neutral-900 animate-pulse align-middle" />
        )}
      </div>
    );
  };

  // ------------------------------------------------------------------
  // 1. EMPTY STATE: 1:1 Pixel Match to Image 2 (Cowork)
  // ------------------------------------------------------------------
  if (messages.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto py-2 sm:py-8 px-1 sm:px-0 text-center select-none font-sans">
        {/* Cowork Serif Title */}
        <h2 className="text-2xl sm:text-4xl md:text-[42px] font-serif tracking-tight text-neutral-900 mb-3 sm:mb-8 font-normal">
          Let&apos;s get to work.
        </h2>

        {/* Cowork Prompt Box */}
        <div className="w-full bg-[#f4f4f4] rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 text-left shadow-2xs">
          {/* Top Row: Agent Pill with Dropdown */}
          <div className="relative inline-block mb-1">
            <button
              type="button"
              onClick={() => setAgentDropdown(!agentDropdown)}
              className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium hover:text-neutral-900 px-1 py-0.5 rounded transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-neutral-600" />
              <span>{selectedAgent}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {agentDropdown && (
              <div className="absolute left-0 mt-1.5 w-44 rounded-xl bg-white border border-neutral-200 shadow-lg py-1 z-30 text-xs">
                <button
                  onClick={() => { setSelectedAgent("Agent"); setAgentDropdown(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 font-medium text-neutral-800"
                >
                  Agent
                </button>
                <button
                  onClick={() => { setSelectedAgent("Voice Copilot"); setAgentDropdown(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 font-medium text-neutral-800"
                >
                  Voice Copilot
                </button>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex flex-col"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                isRecording
                  ? "🎙️ Listening... Speak any topic you want explained"
                  : "Speak or ask any topic to explain (e.g. Speech Recognition, Photosynthesis)..."
              }
              rows={2}
              className="w-full resize-none bg-transparent outline-none text-neutral-900 placeholder-[#8e8e8e] text-[14px] sm:text-[15px] leading-relaxed mb-2 sm:mb-3 font-sans"
            />

            <div className="flex items-center justify-end pt-1">

              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-1.5 rounded-lg transition-all ${
                    isRecording
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50"
                  }`}
                  title={isRecording ? "Listening... click to stop" : "Voice dictation"}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white transition-all ${
                    input.trim()
                      ? "bg-neutral-800 hover:bg-neutral-900 scale-100"
                      : "bg-[#7c7c7c]"
                  }`}
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>

        <p className="text-[11px] sm:text-[12px] text-[#9a9a9a] text-center mt-2.5 sm:mt-3 mb-3.5 sm:mb-8 font-sans">
          AI can make mistakes. Please double-check responses.
        </p>

        {/* 3 Quick Action Cards: Geared to Speech & Multimodal Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 text-left w-full">
          <div
            onClick={() => {
              if (!isRecording) {
                toggleVoiceInput();
              }
            }}
            className="p-3.5 sm:p-5 rounded-[16px] sm:rounded-[18px] bg-white border border-[#e5e5e5] hover:border-neutral-400 transition-all cursor-pointer group"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 mb-1.5 sm:mb-3 group-hover:text-rose-600 transition-colors" />
            <h4 className="font-semibold text-[13px] sm:text-[14px] text-neutral-900 mb-0.5 sm:mb-1">
              Speech Explainer
            </h4>
            <p className="text-[11.5px] sm:text-[12px] text-[#666666] leading-snug sm:leading-relaxed">
              Click to speak any topic and get an instant educational breakdown
            </p>
          </div>

          <div
            onClick={() => handleSend("Explain speech recognition and machine learning in simple English with real-world examples")}
            className="p-3.5 sm:p-5 rounded-[16px] sm:rounded-[18px] bg-white border border-[#e5e5e5] hover:border-neutral-400 transition-all cursor-pointer group"
          >
            <Bug className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 mb-1.5 sm:mb-3 group-hover:text-amber-600 transition-colors" />
            <h4 className="font-semibold text-[13px] sm:text-[14px] text-neutral-900 mb-0.5 sm:mb-1">
              Concept Deep Dive
            </h4>
            <p className="text-[11.5px] sm:text-[12px] text-[#666666] leading-snug sm:leading-relaxed">
              Explain speech recognition models with steps, concepts, and summary
            </p>
          </div>

          <div
            onClick={() => handleSend("Explain photosynthesis step-by-step with analogies and real-world examples")}
            className="p-3.5 sm:p-5 rounded-[16px] sm:rounded-[18px] bg-white border border-[#e5e5e5] hover:border-neutral-400 transition-all cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 mb-1.5 sm:mb-3 group-hover:text-indigo-600 transition-colors" />
            <h4 className="font-semibold text-[13px] sm:text-[14px] text-neutral-900 mb-0.5 sm:mb-1">
              Interactive Learning
            </h4>
            <p className="text-[11.5px] sm:text-[12px] text-[#666666] leading-snug sm:leading-relaxed">
              Explain a scientific topic with step-by-step analogies and key takeaways
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. ACTIVE CONVERSATION STATE: NO BOXES, PURE EDITORIAL TYPOGRAPHY
  // ------------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-full bg-white font-sans">
      {/* Top Bar with Voice, Export, and New Chat */}
      <div className="py-2 sm:py-2.5 flex items-center justify-between border-b border-neutral-100 mb-2 sm:mb-4 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Bot className="w-4 h-4 text-neutral-600" />
          <span className="font-semibold text-xs text-neutral-800">
            Chat
          </span>
        </div>

        {/* Action Controls: Voice, Export, and New Chat */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-end">
          {/* Feature 2: Hands-Free Voice Mode Toggle */}
          <button
            type="button"
            onClick={toggleHandsFree}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all ${
              isHandsFree
                ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 animate-pulse"
                : "bg-[#f3f3f3] hover:bg-[#e9e9e9] text-neutral-700"
            }`}
            title={isHandsFree ? "Click to stop hands-free voice mode" : "Enable continuous hands-free voice mode"}
          >
            <Headphones className={`w-3.5 h-3.5 ${isHandsFree ? "text-white" : "text-neutral-600"}`} />
            <span>{isHandsFree ? "Voice On" : "Voice"}</span>
          </button>

          {/* Feature 5: Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportDropdown(!exportDropdown)}
              disabled={messages.length === 0}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e9e9e9] disabled:opacity-40 disabled:hover:bg-[#f3f3f3] text-neutral-700 text-[11px] sm:text-xs font-medium transition-colors"
              title="Export conversation"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden xs:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {exportDropdown && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white border border-neutral-200 shadow-xl py-1.5 z-40 text-xs">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-neutral-100 font-medium text-neutral-800 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-neutral-500" />
                  <span>Download Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyAllTranscript}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-neutral-100 font-medium text-neutral-800 transition-colors"
                >
                  <Copy className="w-4 h-4 text-neutral-500" />
                  <span>Copy Full Transcript</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportDropdown(false);
                    window.print();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-neutral-100 font-medium text-neutral-800 transition-colors"
                >
                  <Printer className="w-4 h-4 text-neutral-500" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLocalNewChat}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e9e9e9] text-neutral-700 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer"
            title="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </div>

      {/* Messages Stream: 100% UNBOXED, NO CARD, NO BUBBLES, INVISIBLE SCROLLBAR */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 sm:space-y-8 pb-4 sm:pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {messages.map((m) => {
          const isUser = m.role === "user";

          if (isUser) {
            // User message: Completely UNBOXED, clean modern text with subtle 'You' label
            return (
              <div key={m.id} className="flex flex-col items-end my-3 sm:my-4">
                <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                  You
                </div>
                <div className="max-w-[92%] sm:max-w-[85%] text-neutral-900 text-[15px] sm:text-[16px] leading-[1.65] font-normal tracking-[-0.01em]">
                  {m.content}
                </div>
              </div>
            );
          }

          // Assistant message: NO BOX! NO BORDER! NO BACKGROUND CONTAINER!
          // Text flows freely on the canvas with refined typography
          return (
            <div key={m.id} className="flex flex-col items-start my-4 sm:my-6">
              {/* Header with bot indicator */}
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5 flex-wrap">
                <div className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-semibold text-neutral-900 tracking-tight">
                  Voxify AI
                </span>
                {m.engine && (
                  <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono">
                    {m.engine}
                  </span>
                )}
                <span className="text-[11px] text-neutral-400 font-mono">
                  {m.timestamp}
                </span>
              </div>

              {/* Natural Formatted Text directly on page with code blocks & live streaming cursor */}
              <div className="w-full text-[#111827] text-[15px] sm:text-[15.5px] leading-[1.75] sm:leading-[1.8] font-normal tracking-[-0.01em] pl-0 sm:pl-8">
                {renderFormattedContent(m.content, m.isStreaming)}
              </div>

              {/* Minimalist Action Buttons right beneath the answer */}
              <div className="flex items-center gap-4 mt-2.5 sm:mt-3 pl-0 sm:pl-8 text-xs text-neutral-400">
                <button
                  onClick={() => toggleSpeech(m.id, m.content)}
                  className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                  title="Narrate response"
                >
                  {speakingId === m.id ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      <span className="text-rose-600 font-medium">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Read aloud</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopy(m.id, m.content)}
                  className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                  title="Copy response"
                >
                  {copiedId === m.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {isLoading && (!messages.length || !messages[messages.length - 1]?.content) && (
          <div className="flex gap-2.5 items-center text-neutral-500 text-xs pl-0 sm:pl-8 py-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-600" />
            <span className="text-neutral-600 font-medium">Voxify AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Docked Prompt Bar (Clean Cowork style, matching empty state) */}
      <div className="pt-2 sm:pt-3 pb-1 sm:pb-2 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-[#f4f4f4] rounded-[20px] sm:rounded-[24px] px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 transition-all focus-within:ring-1 focus-within:ring-neutral-300"
        >

          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-1 sm:p-1.5 rounded-lg transition-all ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse"
                : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50"
            }`}
            title={isRecording ? "Listening... click to stop" : "Voice dictation"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording
                ? "🎙️ Listening... Speak any topic"
                : "Ask any topic to explain..."
            }
            className="flex-1 px-1.5 sm:px-2 py-1 bg-transparent outline-none text-neutral-900 placeholder-[#8e8e8e] text-[14px] sm:text-[15px] font-sans"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-800 hover:bg-neutral-900 disabled:bg-[#7c7c7c] text-white flex items-center justify-center transition-all disabled:cursor-not-allowed shadow-2xs shrink-0"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
