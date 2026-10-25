"use client";

import React from "react";
import {
  Clock,
  Mic,
  Presentation,
  Image as ImageIcon,
  Video,
  Copy,
  Trash2,
  Check,
  Download
} from "lucide-react";
import { SavedSession, ActiveTab } from "../types";

interface SavedSessionsProps {
  sessions: SavedSession[];
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onSelectSession: (tab: ActiveTab, content: string) => void;
}

export const SavedSessions: React.FC<SavedSessionsProps> = ({
  sessions,
  onDeleteSession,
  onClearAll,
  onSelectSession,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const getIcon = (type: SavedSession["type"]) => {
    switch (type) {
      case "voice":
        return <Mic className="w-4 h-4 text-orange-500" />;
      case "slides":
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case "vision":
        return <ImageIcon className="w-4 h-4 text-rose-500" />;
      case "video":
        return <Video className="w-4 h-4 text-red-500" />;
    }
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-500">
              Session History
            </span>
          </div>
          <h2 className="text-2xl font-serif text-neutral-900 font-bold">
            Saved Transcripts & Decks
          </h2>
          <p className="text-xs text-neutral-500">
            Stored locally in your browser so your transcripts and slides are never lost.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-neutral-200/90 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800">No saved sessions yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Start a voice recording, synthesize slides, or analyze an image to automatically log your work here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-white border border-neutral-200/90 hover:border-orange-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(s.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-neutral-900 mb-0.5">
                    {s.title}
                  </h4>
                  <p className="text-xs text-neutral-500 line-clamp-2 max-w-lg mb-1">
                    {s.preview}
                  </p>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {s.timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleCopy(s.id, s.content)}
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs transition-colors"
                  title="Copy session content"
                >
                  {copiedId === s.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => onDeleteSession(s.id)}
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs transition-colors"
                  title="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
