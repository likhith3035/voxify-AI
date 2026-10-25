"use client";

import React, { useState } from "react";
import {
  Video,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Copy,
  Check,
  Presentation,
  ExternalLink
} from "lucide-react";
import { apiExplainVideo } from "../lib/api";
import { SavedSession } from "../types";

interface VideoSynthesizerProps {
  onSaveSession: (session: Omit<SavedSession, "id" | "timestamp">) => void;
  onGenerateSlides: (topic: string) => void;
  initialUrl?: string;
}

export const VideoSynthesizer: React.FC<VideoSynthesizerProps> = ({
  onSaveSession,
  onGenerateSlides,
  initialUrl = "",
}) => {
  const [url, setUrl] = useState(initialUrl || "https://www.youtube.com/watch?v=k2P_amTZ21o");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      handleSynthesize(initialUrl);
    }
  }, [initialUrl]);

  const handleSynthesize = async (urlToUse?: string) => {
    const targetUrl = urlToUse || url;
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiExplainVideo(targetUrl);
      setVideoId(res.video_id);
      setExplanation(res.explanation);

      onSaveSession({
        title: `YouTube: ${res.video_id}`,
        type: "video",
        preview: res.explanation.slice(0, 80) + "...",
        content: res.explanation,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !explanation) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = explanation.replace(/[#*`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopy = async () => {
    if (!explanation) return;
    await navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-red-700">
            Video Intelligence
          </span>
        </div>
        <h2 className="text-2xl font-serif text-neutral-900 font-bold mb-1">
          YouTube Video Synthesizer
        </h2>
        <p className="text-xs text-neutral-500">
          Paste any educational or tutorial YouTube link to extract transcripts, chapters, and core lessons.
        </p>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
            className="flex-1 px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all font-sans"
          />

          <button
            onClick={() => handleSynthesize()}
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-red-400" />
                <span>Synthesize Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Embedded Player & Analysis Grid */}
      {(videoId || explanation) && (
        <div className="space-y-6">
          {videoId && (
            <div className="p-4 rounded-3xl bg-white border border-neutral-200/90 shadow-xs">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-neutral-100 shadow-2xs">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {explanation && (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Synthesized Video Breakdown
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSpeech}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold transition-all ${
                      isSpeaking
                        ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                        : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-red-500" />}
                    <span>{isSpeaking ? "Stop Voice" : "Narrate"}</span>
                  </button>

                  <button
                    onClick={() => onGenerateSlides(`Video Lesson: ${videoId}`)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors"
                  >
                    <Presentation className="w-3.5 h-3.5 text-amber-600" />
                    <span>Create Slide Deck</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 border border-neutral-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-sm text-neutral-700 leading-relaxed font-sans whitespace-pre-wrap">
                {explanation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
