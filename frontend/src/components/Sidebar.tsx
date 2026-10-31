"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Trash2,
  Cable,
  Wand2,
  Users2,
  Clock,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Radio,
  X
} from "lucide-react";
import { ActiveTab, SavedSession } from "../types";
import { SidebarModalType } from "./SidebarModals";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  onNewSession: () => void;
  savedSessions?: SavedSession[];
  onSelectSession?: (session: SavedSession) => void;
  onDeleteSession?: (id: string) => void;
  savedCount?: number;
  onOpenModal: (modal: SidebarModalType) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  onNewSession,
  savedSessions = [],
  onSelectSession,
  onDeleteSession,
  onOpenModal,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const [showMoreChats, setShowMoreChats] = useState(false);

  const closeMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const defaultItems: { label: string; icon: any; modalKey: SidebarModalType }[] = [
    { label: "Live Voice Call", icon: Radio, modalKey: "voice_call" },
    { label: "Connectors", icon: Cable, modalKey: "connectors" },
    { label: "Skills", icon: Wand2, modalKey: "skills" },
    { label: "Agents", icon: Users2, modalKey: "agents" },
    { label: "Scheduled tasks", icon: Clock, modalKey: "scheduled" },
    { label: "Knowledge base", icon: BookOpen, modalKey: "knowledge" },
  ];

  // Listen for Ctrl+K / Cmd+K to open search palette from anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenModal("search");
        closeMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenModal]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-30 flex flex-col bg-white border-r border-[#f0f0f0] transition-transform md:transition-all duration-300 select-none shadow-2xl md:shadow-none pt-[max(0.25rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "w-72 md:w-16" : "w-72 md:w-64"}`}
      >
        {/* Top Header: Voxify AI Brand & Collapse / Close Icon */}
        <div className={`h-16 flex items-center ${collapsed ? "justify-between px-4 md:justify-center md:flex-col md:gap-1 md:py-2 md:px-1" : "justify-between px-4"}`}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-sm ring-1 ring-black/5 flex-shrink-0 cursor-pointer"
              onClick={() => {
                if (collapsed) setCollapsed(false);
              }}
            >
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`flex flex-col ${collapsed ? "md:hidden" : ""}`}>
              <span className="font-semibold text-[15.5px] text-neutral-900 tracking-tight font-sans leading-tight">
                Voxify AI
              </span>
              <span className="text-[10px] text-neutral-400 font-mono font-medium">
                studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`hidden md:block p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors ${collapsed ? "mt-1" : ""}`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close X Button */}
            <button
              onClick={closeMobile}
              className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input Bar (Matching Image 2 - Fully Functional Ctrl+K) */}
        {(!collapsed || mobileOpen) && (
          <div className={`px-3 mb-3 ${collapsed ? "md:hidden" : ""}`}>
            <div
              onClick={() => {
                onOpenModal("search");
                closeMobile();
              }}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-neutral-500 text-xs hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
              title="Search conversations and topics (Ctrl+K)"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <span>Search</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Ctrl+K
              </span>
            </div>
          </div>
        )}

        {/* Primary "+ New chat" Button */}
        <div className="px-3 mb-3">
          <button
            onClick={() => {
              onNewSession();
              closeMobile();
            }}
            className={`w-full flex items-center gap-2 py-2 px-3 rounded-full bg-[#f3f3f3] hover:bg-[#e9e9e9] text-neutral-800 font-medium text-xs transition-colors ${
              collapsed ? "md:justify-center md:px-0 md:rounded-xl" : ""
            }`}
            title="New chat"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-600" />
            {(!collapsed || mobileOpen) && <span className={collapsed ? "md:hidden" : ""}>New chat</span>}
          </button>
        </div>

      {/* Recent Chats Section: Invisible Scrollbar */}
      <div className="flex-1 px-2 overflow-y-auto no-scrollbar space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {(!collapsed || mobileOpen) && savedSessions.length > 0 && (
          <div className={`px-3 py-1.5 text-xs font-medium text-neutral-400 ${collapsed ? "md:hidden" : ""}`}>
            Recent chats
          </div>
        )}

        {/* Saved Chat History Items (Max 5 with Collapsible Drawer) */}
        {(showMoreChats ? savedSessions : savedSessions.slice(0, 5)).map((session) => (
          <div
            key={session.id}
            className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
            onClick={() => {
              onSelectSession?.(session);
              closeMobile();
            }}
          >
            <div className="flex items-center gap-2.5 truncate">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              {(!collapsed || mobileOpen) && (
                <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>
                  {session.title.replace("Chat: ", "").replace("...", "")}
                </span>
              )}
            </div>

            {(!collapsed || mobileOpen) && onDeleteSession && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-400 hover:text-rose-600 transition-opacity ${collapsed ? "md:hidden" : ""}`}
                title="Delete chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Collapsible toggle for chats exceeding 5 */}
        {(!collapsed || mobileOpen) && savedSessions.length > 5 && (
          <button
            type="button"
            onClick={() => setShowMoreChats(!showMoreChats)}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer my-0.5 ${collapsed ? "md:hidden" : ""}`}
            title={showMoreChats ? "Collapse older chats" : "Show all saved chats"}
          >
            <span>
              {showMoreChats
                ? "Show fewer chats"
                : `+${savedSessions.length - 5} more chats`}
            </span>
            {showMoreChats ? (
              <ChevronUp className="w-3 h-3 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            )}
          </button>
        )}

        {/* Navigation Items Separator */}
        <div className="my-1 border-t border-[#f2f2f2]" />

        {/* Fully Interactive Cowork Nav Menu */}
        {defaultItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => {
                onOpenModal(item.modalKey);
                closeMobile();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer ${
                collapsed ? "md:justify-center md:px-0" : ""
              }`}
              title={`Open ${item.label}`}
            >
              <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
              {(!collapsed || mobileOpen) && <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>}
            </div>
          );
        })}
      </div>

      {/* Footer Credits: Developed by Deepika Valli Palla */}
      <div className="p-3 border-t border-[#f0f0f0] mt-auto shrink-0 bg-white">
        {!collapsed || mobileOpen ? (
          <div className={`p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-left ${collapsed ? "md:hidden" : ""}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-neutral-500" />
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Credits
              </span>
            </div>
            <p className="text-[11.5px] font-medium text-neutral-700 leading-snug">
              This web is developed by{" "}
              <span className="font-semibold text-neutral-900 block mt-0.5">
                Deepika Valli Palla
              </span>
            </p>
          </div>
        ) : null}

        {collapsed && (
          <div
            className="hidden md:flex w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 items-center justify-center mx-auto transition-colors cursor-default"
            title="This web is developed by Deepika Valli Palla"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
          </div>
        )}
      </div>
    </aside>
  </>
  );
};
