"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Sparkles,
  ExternalLink,
  Presentation,
  Mic,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import { apiExploreTopic } from "../lib/api";
import { ExploreResponse, SavedSession } from "../types";

interface KnowledgeHubProps {
  onSaveSession: (session: Omit<SavedSession, "id" | "timestamp">) => void;
  onGenerateSlides: (topic: string) => void;
  onOpenVoiceWithTopic: (topic: string) => void;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({
  onSaveSession,
  onGenerateSlides,
  onOpenVoiceWithTopic,
}) => {
  const [topic, setTopic] = useState("Machine Learning");
  const [data, setData] = useState<ExploreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (topicToSearch?: string) => {
    const t = topicToSearch || topic;
    if (!t.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiExploreTopic(t);
      setData(res);

      onSaveSession({
        title: `Explore: ${res.topic}`,
        type: "vision",
        preview: res.explanation.slice(0, 80) + "...",
        content: res.explanation,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!data) {
      handleSearch("Speech Recognition");
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-blue-700">
            Knowledge Graph & Wikimedia
          </span>
        </div>
        <h2 className="text-2xl font-serif text-neutral-900 font-bold mb-1">
          Topic Explorer & Media Hub
        </h2>
        <p className="text-xs text-neutral-500">
          Search any academic subject to pull verified encyclopedic overviews, historical Wikimedia Commons media, and educational tutorials.
        </p>

        {/* Input Form */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search concepts (e.g. Natural Language Processing, Transformer Models)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-sans"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading || !topic.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Explore</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explorer Results */}
      {data && (
        <div className="space-y-6">
          {/* Main Article Card */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  ENCYCLOPEDIA EXTRACT
                </span>
                <h3 className="text-xl font-serif font-bold text-neutral-900">
                  {data.topic}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onGenerateSlides(data.topic)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors"
                >
                  <Presentation className="w-3.5 h-3.5 text-amber-600" />
                  <span>Build Slides</span>
                </button>

                <button
                  onClick={() => onOpenVoiceWithTopic(data.topic)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 text-xs font-semibold transition-colors"
                >
                  <Mic className="w-3.5 h-3.5 text-orange-600" />
                  <span>Dictate Notes</span>
                </button>
              </div>
            </div>

            <p className="text-sm sm:text-base text-neutral-700 leading-relaxed font-sans">
              {data.explanation}
            </p>
          </div>

          {/* Wikimedia Commons Gallery */}
          {data.images && data.images.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <h4 className="font-semibold text-sm text-neutral-900">
                  Wikimedia Commons Archival Media
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-square flex flex-col justify-end"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumbnail}
                      alt={img.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="relative z-10 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                      <p className="text-[11px] font-medium truncate">{img.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Curated Video Search Tutorials */}
          {data.videos && data.videos.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
              <h4 className="font-semibold text-sm text-neutral-900">
                Recommended Study Guides & YouTube Links
              </h4>
              <div className="space-y-2">
                {data.videos.map((vid, idx) => (
                  <a
                    key={idx}
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-800 transition-colors"
                  >
                    <span>{vid.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
