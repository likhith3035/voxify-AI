"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Sidebar } from "../components/Sidebar";
import { ChatStudio } from "../components/ChatStudio";
import { SidebarModals, SidebarModalType } from "../components/SidebarModals";
import { checkBackendHealth } from "../lib/api";
import { SavedSession } from "../types";
import { Menu, Plus, Bot } from "lucide-react";

function ChatAppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SavedSession | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [activeModal, setActiveModal] = useState<SidebarModalType>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("Agent");

  useEffect(() => {
    const check = async () => {
      const res = await checkBackendHealth();
      setBackendOnline(res.online);
    };
    check();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("voxify_chat_sessions");
      if (stored) {
        const parsed: SavedSession[] = JSON.parse(stored);
        // Filter out trivial 1-word single test greetings ("hi", "hello", "hey", "test")
        const cleaned = parsed.filter((s) => {
          const t = s.title.replace(/^Chat:\s*/i, "").trim().toLowerCase();
          return !["hi", "hello", "hey", "test"].includes(t);
        });
        setSavedSessions(cleaned);
        localStorage.setItem("voxify_chat_sessions", JSON.stringify(cleaned));
      }
    } catch (_) {}
  }, []);

  const handleSaveSession = (savedData: SavedSession) => {
    setActiveChatId(savedData.id);
    setActiveSession(savedData);

    setSavedSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === savedData.id);
      let updated: SavedSession[];

      if (existingIdx >= 0) {
        // Conversation already exists: update in place without adding duplicate entries!
        updated = [...prev];
        updated[existingIdx] = {
          ...prev[existingIdx],
          title: savedData.title || prev[existingIdx].title,
          preview: savedData.preview,
          content: savedData.content,
          messages: savedData.messages || prev[existingIdx].messages,
          timestamp: savedData.timestamp,
        };
      } else {
        // New meaningful conversation: prepend to recent list
        updated = [savedData, ...prev.filter((s) => s.id !== savedData.id).slice(0, 19)];
      }

      try {
        localStorage.setItem("voxify_chat_sessions", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const handleDeleteSession = (id: string) => {
    setSavedSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem("voxify_chat_sessions", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    if (activeChatId === id) {
      handleNewChat();
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveSession(null);
    setInitialPrompt("");
  };

  const handleSelectSession = (session: SavedSession) => {
    setActiveChatId(session.id);
    setActiveSession(session);
    setInitialPrompt("");
  };

  const handleTriggerPrompt = (promptText: string) => {
    setActiveChatId("chat_" + Date.now());
    setActiveSession(null);
    setInitialPrompt(promptText);
  };

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-white select-none">
      {/* 1. Left Sidebar with All Active Features (Responsive Mobile Drawer on small screens) */}
      <Sidebar
        activeTab={"chat"}
        setActiveTab={() => {}}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onNewSession={handleNewChat}
        savedSessions={savedSessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        savedCount={savedSessions.length}
        onOpenModal={setActiveModal}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* 2. Main AI Chatbot Workspace (Full-Screen Cowork Interface) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
        {/* Sticky Mobile Header (Visible only on mobile screens < 768px) */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-neutral-100 shrink-0 z-20">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-semibold text-sm text-neutral-900 tracking-tight font-sans">
              Voxify AI
            </span>
            <span className="text-[10px] text-neutral-400 font-mono font-medium tracking-wider uppercase">
              Studio
            </span>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className="p-1.5 -mr-1 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
            aria-label="New chat"
            title="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {/* Subtle Floating Right Helper Badge (from reference image) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:block">
          <div
            onClick={() => setActiveModal("connectors")}
            className="w-7 h-9 rounded-l-xl bg-[#85b5ff] shadow-sm flex items-center justify-center cursor-pointer hover:bg-[#6ea4f7] transition-colors"
            title="View system status & connectors"
          >
            <div className="w-3 h-3 border-2 border-white rounded-full" />
          </div>
        </div>

        {/* Chat Studio */}
        <main className="flex-1 overflow-hidden px-3 sm:px-6 md:px-8 py-2 md:py-3 flex flex-col">
          <ChatStudio
            key={activeChatId || "new"}
            sessionId={activeChatId}
            initialPrompt={initialPrompt}
            initialMessages={activeSession?.id === activeChatId ? activeSession.messages || [] : []}
            onSaveSession={handleSaveSession}
            onNewChat={handleNewChat}
            onGenerateSlidesFromText={(text) => {
              handleTriggerPrompt(`Generate an interactive 5-slide educational presentation deck on: ${text}`);
            }}
            onSwitchTab={() => {}}
            onAttachFile={() => {}}
          />
        </main>
      </div>

      {/* 3. Interactive Modals for Sidebar Features (Search, Connectors, Skills, Agents, Scheduled, Knowledge) */}
      <SidebarModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        savedSessions={savedSessions}
        onSelectSession={handleSelectSession}
        onTriggerPrompt={handleTriggerPrompt}
        onSelectAgent={setSelectedAgent}
        onStartVoice={() => {
          // Trigger voice prompt
          handleTriggerPrompt("Explain speech recognition and speech-to-text algorithms step-by-step");
        }}
        backendOnline={backendOnline}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white text-neutral-400 text-sm">Loading AI Chatbot...</div>}>
      <ChatAppContent />
    </Suspense>
  );
}
