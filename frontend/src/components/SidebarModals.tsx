"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Bot,
  Cable,
  Wand2,
  Users2,
  Clock,
  BookOpen,
  ExternalLink,
  MessageSquare,
  Mic,
  Presentation,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Key,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { SavedSession } from "../types";

export type SidebarModalType =
  | "search"
  | "connectors"
  | "skills"
  | "agents"
  | "scheduled"
  | "knowledge"
  | "voice_call"
  | null;

interface SidebarModalsProps {
  activeModal: SidebarModalType;
  onClose: () => void;
  savedSessions: SavedSession[];
  onSelectSession: (session: SavedSession) => void;
  onTriggerPrompt: (promptText: string) => void;
  onSelectAgent: (agentName: string) => void;
  onStartVoice: () => void;
  backendOnline: boolean;
}

export const SidebarModals: React.FC<SidebarModalsProps> = ({
  activeModal,
  onClose,
  savedSessions,
  onSelectSession,
  onTriggerPrompt,
  onSelectAgent,
  onStartVoice,
  backendOnline,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState([
    {
      id: "task_1",
      title: "Daily Speech Practice & Pronunciation",
      time: "09:00 AM Daily",
      active: true,
      tag: "Speech",
    },
    {
      id: "task_2",
      title: "Weekly Concept Review & Slide Export",
      time: "Sundays at 6:00 PM",
      active: true,
      tag: "Study",
    },
    {
      id: "task_3",
      title: "Sync Knowledge Base to Local Notes",
      time: "Every Friday at 11:00 PM",
      active: false,
      tag: "Backup",
    },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "groq" | "openai">("gemini");
  const [keyInput, setKeyInput] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<string | null>(null);

  const handleActivateKey = async () => {
    if (!keyInput.trim()) return;
    setIsActivating(true);
    setKeyStatusMsg(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, key: keyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setKeyStatusMsg(
          `Connected! The chatbot will now use ${selectedProvider.toUpperCase()} for live dynamic answers.`
        );
        setKeyInput("");
      } else {
        setKeyStatusMsg(data.error || "Failed to activate key.");
      }
    } catch (e: any) {
      setKeyStatusMsg("Could not connect to backend: " + e.message);
    } finally {
      setIsActivating(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  const handleCopyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setScheduledTasks((prev) => [
      ...prev,
      {
        id: "task_" + Date.now(),
        title: newTaskTitle.trim(),
        time: newTaskTime.trim() || "Daily at 10:00 AM",
        active: true,
        tag: "Custom",
      },
    ]);
    setNewTaskTitle("");
    setNewTaskTime("");
  };

  const toggleTask = (id: string) => {
    setScheduledTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const removeTask = (id: string) => {
    setScheduledTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-[6px] transition-all animate-in fade-in duration-200 pb-[env(safe-area-inset-bottom)]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[620px] bg-white rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-[#e5e5e5] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. SEARCH MODAL (Ctrl+K Command Palette) */}
        {/* ========================================================= */}
        {activeModal === "search" && (
          <div className="flex flex-col h-full">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#f0f0f0] flex items-center gap-2 sm:gap-3">
              <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-0.5 sm:ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations, topics, or ask an explanation..."
                autoFocus
                className="flex-1 bg-transparent text-[16px] sm:text-[15px] outline-none text-neutral-900 placeholder-[#8e8e8e] font-sans"
              />
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-neutral-400 bg-[#f4f4f4] px-1.5 py-0.5 rounded border border-neutral-200">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-7 sm:h-7 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-left text-xs">
              {searchQuery.trim() && (
                <div>
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Action
                  </div>
                  <div
                    onClick={() => {
                      onTriggerPrompt(`Explain ${searchQuery.trim()} in simple terms with examples`);
                      onClose();
                    }}
                    className="p-3.5 rounded-[18px] bg-[#f4f4f4] hover:bg-[#ececec] border border-neutral-200/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-neutral-900 font-medium text-[13px]">
                      <Sparkles className="w-4 h-4 text-neutral-700" />
                      <span>Explain &quot;{searchQuery}&quot; step-by-step</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              )}

              {/* Recent Conversations */}
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                  Recent Conversations
                </div>
                {savedSessions.length === 0 ? (
                  <p className="text-neutral-400 py-1 text-[12px]">No chat history recorded yet.</p>
                ) : (
                  <div className="space-y-1">
                    {savedSessions
                      .filter((s) =>
                        s.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((session) => (
                        <div
                          key={session.id}
                          onClick={() => {
                            onSelectSession(session);
                            onClose();
                          }}
                          className="flex items-center justify-between p-3 rounded-[16px] hover:bg-[#f7f7f7] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="text-neutral-800 font-medium text-[13px] truncate">
                              {session.title.replace("Chat: ", "")}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {session.timestamp}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Suggested Explanations */}
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                  Suggested Explanations
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Speech Recognition Models",
                    "Photosynthesis in Plants",
                    "Binary Search Algorithm",
                    "Neural Networks",
                    "Operating Systems Kernel",
                    "Quantum Computing",
                  ].map((topic, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        onTriggerPrompt(`Explain ${topic} in simple English with steps and examples`);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-full border border-[#e5e5e5] hover:border-neutral-400 bg-white hover:bg-[#f7f7f7] cursor-pointer transition-all text-neutral-700 text-xs font-medium"
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. CONNECTORS MODAL (Cowork Minimalist Aesthetics) */}
        {/* ========================================================= */}
        {activeModal === "connectors" && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center">
                  <Cable className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-neutral-900 leading-none">
                    Connectors & Live Models
                  </h3>
                  <p className="text-[11.5px] text-neutral-400 mt-1">
                    Manage real-time AI models, speech dictation, and knowledge feeds
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-left text-xs">
              {/* Live AI Model Activator (Clean Segmented Box) */}
              <div className="p-5 rounded-[22px] bg-[#f8f8f8] border border-neutral-200/70">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neutral-800" />
                    <h4 className="font-semibold text-[13.5px] text-neutral-900">
                      Live AI Engine (ChatGPT, Gemini, Groq)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-full">
                    Dynamic Responses
                  </span>
                </div>
                <p className="text-neutral-500 text-[12px] leading-relaxed mb-3.5">
                  Connect your personal API key to receive intelligent, real-time dynamic answers generated by Google Gemini, Groq, or OpenAI.
                </p>

                {/* Segmented Provider Pill Bar */}
                <div className="flex p-1 bg-[#eaeaea] rounded-full gap-1 mb-3">
                  {[
                    { id: "gemini" as const, label: "Google Gemini", tag: "Free Tier" },
                    { id: "groq" as const, label: "Groq Llama 3.3", tag: "Ultra Fast" },
                    { id: "openai" as const, label: "OpenAI GPT-4o", tag: "Paid" },
                  ].map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        setKeyStatusMsg(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-full text-xs transition-all flex items-center justify-center gap-1.5 ${
                        selectedProvider === provider.id
                          ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                          : "text-neutral-600 hover:text-neutral-900 font-medium"
                      }`}
                    >
                      <span>{provider.label}</span>
                    </button>
                  ))}
                </div>

                {/* Input Bar Styled like Prompt Box */}
                <div className="flex items-center gap-2 p-1.5 pl-3.5 bg-white rounded-[16px] border border-neutral-200 shadow-2xs focus-within:border-neutral-400 transition-colors">
                  <Key className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={
                      selectedProvider === "gemini"
                        ? "Paste Google Gemini API Key (AIzaSy...)"
                        : selectedProvider === "groq"
                        ? "Paste Groq API Key (gsk_...)"
                        : "Paste OpenAI API Key (sk-...)"
                    }
                    className="flex-1 bg-transparent text-xs text-neutral-900 outline-none font-mono placeholder:font-sans placeholder:text-neutral-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleActivateKey();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleActivateKey}
                    disabled={!keyInput.trim() || isActivating}
                    className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium text-xs transition-colors shrink-0 shadow-2xs"
                  >
                    {isActivating ? "Connecting..." : "Activate"}
                  </button>
                </div>

                {keyStatusMsg && (
                  <div
                    className={`mt-3 p-3 rounded-xl flex items-center gap-2.5 text-[12px] ${
                      keyStatusMsg.includes("Connected")
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-800"
                    }`}
                  >
                    {keyStatusMsg.includes("Connected") ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{keyStatusMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2.5 px-0.5">
                  <span>Get your key:</span>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-700 underline hover:text-black flex items-center gap-1 font-medium"
                    >
                      Google AI Studio (Gemini) <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span className="text-neutral-300">•</span>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-700 underline hover:text-black flex items-center gap-1 font-medium"
                    >
                      Groq Cloud <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Connector 1: Speech Engine */}
              <div className="p-4 rounded-[20px] bg-white border border-[#e5e5e5] hover:border-neutral-400 transition-all flex items-center justify-between">
                <div className="flex gap-3.5 items-center">
                  <div className="w-9 h-9 rounded-2xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13.5px] text-neutral-900">
                      Web Speech Dictation
                    </h4>
                    <p className="text-neutral-500 text-[11.5px] mt-0.5">
                      Browser microphone dictation with English, Telugu, and Hindi support.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready
                </span>
              </div>

              {/* Connector 2: Python Backend */}
              <div className="p-4 rounded-[20px] bg-white border border-[#e5e5e5] hover:border-neutral-400 transition-all flex items-center justify-between">
                <div className="flex gap-3.5 items-center">
                  <div className="w-9 h-9 rounded-2xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13.5px] text-neutral-900">
                      Python Flask REST Engine
                    </h4>
                    <p className="text-neutral-500 text-[11.5px] mt-0.5">
                      Runs locally at <code>127.0.0.1:5000</code> with <code>/api/chat</code> and <code>/api/ai-explain</code>.
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono shrink-0 ${
                    backendOnline
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      : "text-amber-700 bg-amber-50 border border-amber-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      backendOnline ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {backendOnline ? "Online" : "Fallback"}
                </span>
              </div>

              {/* Connector 3: Wikipedia Knowledge API */}
              <div className="p-4 rounded-[20px] bg-white border border-[#e5e5e5] hover:border-neutral-400 transition-all flex items-center justify-between">
                <div className="flex gap-3.5 items-center">
                  <div className="w-9 h-9 rounded-2xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13.5px] text-neutral-900">
                      Wikipedia Knowledge Graph
                    </h4>
                    <p className="text-neutral-500 text-[11.5px] mt-0.5">
                      Factual academic summaries and verified encyclopedia references.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. SKILLS MODAL */}
        {/* ========================================================= */}
        {activeModal === "skills" && (
          <div className="flex flex-col h-full">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-neutral-900 leading-none">
                    AI Chatbot Skills
                  </h3>
                  <p className="text-[11.5px] text-neutral-400 mt-1">
                    Preconfigured workflows for speech explanation, slides, and study
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-left text-xs">
              {[
                {
                  title: "Speech to Explanation",
                  desc: "Listen to spoken concepts from the mic and generate a 5-step structured explanation.",
                  icon: Mic,
                  action: () => {
                    onClose();
                    onStartVoice();
                  },
                  btnText: "Start Voice",
                },
                {
                  title: "Educational Concept Breakdown",
                  desc: "Produce introduction, step-by-step logic, key principles, real-world examples, and conclusion.",
                  icon: Sparkles,
                  action: () => {
                    onTriggerPrompt("Explain Machine Learning algorithms step-by-step with real-world examples");
                    onClose();
                  },
                  btnText: "Run Explainer",
                },
                {
                  title: "Voice to Presentation Slides",
                  desc: "Synthesize any topic or spoken notes into an interactive slide presentation with audio narration.",
                  icon: Presentation,
                  action: () => {
                    onTriggerPrompt("Generate a 5-slide educational presentation deck on Photosynthesis");
                    onClose();
                  },
                  btnText: "Build Slides",
                },
                {
                  title: "Wikipedia Fact Verification",
                  desc: "Cross-reference concept explanations against live academic encyclopedic records.",
                  icon: BookOpen,
                  action: () => {
                    onTriggerPrompt("What is the scientific definition and history of Speech Recognition?");
                    onClose();
                  },
                  btnText: "Query",
                },
              ].map((skill, idx) => {
                const Icon = skill.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-[20px] bg-white border border-[#e5e5e5] hover:border-neutral-400 flex items-center justify-between transition-all group"
                  >
                    <div className="flex gap-3.5 items-center max-w-[70%]">
                      <div className="w-9 h-9 rounded-2xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[13.5px] text-neutral-900">
                          {skill.title}
                        </h4>
                        <p className="text-neutral-500 text-[11.5px] mt-0.5 leading-relaxed">
                          {skill.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={skill.action}
                      className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-medium transition-colors shrink-0 shadow-2xs"
                    >
                      {skill.btnText}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. AGENTS MODAL */}
        {/* ========================================================= */}
        {activeModal === "agents" && (
          <div className="flex flex-col h-full">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center">
                  <Users2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-neutral-900 leading-none">
                    Specialized AI Agents
                  </h3>
                  <p className="text-[11.5px] text-neutral-400 mt-1">
                    Select a dedicated agent profile tailored to your study task
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 text-left text-xs">
              {[
                {
                  name: "Agent (Default)",
                  role: "General Study Copilot",
                  desc: "Answers questions, explains science and engineering concepts, and formats text cleanly.",
                },
                {
                  name: "Voice Copilot",
                  role: "Speech & Dictation Specialist",
                  desc: "Prioritizes low-latency voice intake, cleans up speech disfluencies, and speaks responses aloud.",
                },
                {
                  name: "Presentation Architect",
                  role: "Slide Deck Specialist",
                  desc: "Transforms lectures, notes, or spoken words into structured presentation outlines.",
                },
                {
                  name: "STEM Explainer",
                  role: "Code & Math Tutor",
                  desc: "Specialized in algorithm complexity, Python snippets, equations, and technical viva preparation.",
                },
              ].map((agent, i) => (
                <div
                  key={i}
                  className="p-4 rounded-[20px] bg-white border border-[#e5e5e5] hover:border-neutral-400 flex items-center justify-between transition-all cursor-pointer group"
                  onClick={() => {
                    onSelectAgent(agent.name);
                    onClose();
                  }}
                >
                  <div className="flex gap-3.5 items-center max-w-[75%]">
                    <div className="w-9 h-9 rounded-2xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[13.5px] text-neutral-900">
                          {agent.name}
                        </h4>
                        <span className="text-[10px] text-neutral-600 bg-[#f4f4f4] border border-neutral-200 px-2 py-0.5 rounded-full font-mono">
                          {agent.role}
                        </span>
                      </div>
                      <p className="text-neutral-500 text-[11.5px] mt-1 leading-relaxed">
                        {agent.desc}
                      </p>
                    </div>
                  </div>
                  <button className="px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-colors shrink-0">
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. SCHEDULED TASKS MODAL */}
        {/* ========================================================= */}
        {activeModal === "scheduled" && (
          <div className="flex flex-col h-full">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-neutral-900 leading-none">
                    Scheduled Tasks & Reminders
                  </h3>
                  <p className="text-[11.5px] text-neutral-400 mt-1">
                    Set automated speech study sessions and sync routines
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-left text-xs">
              <div className="space-y-2.5">
                {scheduledTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-[20px] border border-[#e5e5e5] hover:border-neutral-300 bg-white flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          t.active
                            ? "bg-neutral-900 border-neutral-900 text-white"
                            : "border-neutral-300"
                        }`}
                      >
                        {t.active ? <Check className="w-3 h-3 text-white" /> : null}
                      </button>
                      <div>
                        <h4
                          className={`font-semibold text-[13.5px] ${
                            t.active ? "text-neutral-900" : "text-neutral-400 line-through"
                          }`}
                        >
                          {t.title}
                        </h4>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {t.time}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTask(t.id)}
                      className="w-7 h-7 rounded-full hover:bg-rose-50 text-neutral-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                      title="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddTask} className="pt-3 border-t border-[#f0f0f0] flex gap-2">
                <div className="flex-1 flex items-center bg-[#f4f4f4] rounded-[16px] px-3.5 py-1.5 border border-neutral-200 focus-within:border-neutral-400 transition-colors">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Schedule a study reminder or practice session..."
                    className="w-full bg-transparent text-xs text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. KNOWLEDGE BASE MODAL */}
        {/* ========================================================= */}
        {activeModal === "knowledge" && (
          <div className="flex flex-col h-full">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] text-neutral-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-neutral-900 leading-none">
                    Knowledge Base & Saved Explanations
                  </h3>
                  <p className="text-[11.5px] text-neutral-400 mt-1">
                    Your personal library of spoken notes and academic explanations
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-left text-xs">
              {savedSessions.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <div className="w-12 h-12 rounded-2xl bg-[#f4f4f4] text-neutral-400 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-[14px] text-neutral-800">No saved explanations yet</p>
                  <p className="text-[12px] mt-1 text-neutral-400 max-w-xs mx-auto">
                    Speak or ask any topic in the chatbot, and its structured 5-part explanation will be saved here automatically.
                  </p>
                </div>
              ) : (
                savedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4.5 rounded-[20px] bg-white border border-[#e5e5e5] hover:border-neutral-400 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-semibold text-[13.5px] text-neutral-900 truncate max-w-[80%]">
                        {session.title.replace("Chat: ", "")}
                      </h4>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {session.timestamp}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-[12px] line-clamp-2 leading-relaxed mb-3.5">
                      {session.preview || session.content.slice(0, 140)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectSession(session);
                          onClose();
                        }}
                        className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white font-medium text-xs transition-colors shadow-2xs"
                      >
                        Open in Chat
                      </button>
                      <button
                        onClick={() => handleCopyText(session.id, session.content)}
                        className="px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-neutral-200 text-neutral-700 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        {copiedId === session.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
