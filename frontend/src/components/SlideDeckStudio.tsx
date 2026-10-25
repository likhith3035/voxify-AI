"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Copy,
  Sparkles,
  Presentation,
  Check,
  RefreshCw,
  Layers,
  Printer
} from "lucide-react";
import confetti from "canvas-confetti";
import { SlideDeck, SavedSession } from "../types";
import { apiGenerateSlides } from "../lib/api";

interface SlideDeckStudioProps {
  initialTopic?: string;
  onSaveSession: (session: Omit<SavedSession, "id" | "timestamp">) => void;
}

export const SlideDeckStudio: React.FC<SlideDeckStudioProps> = ({
  initialTopic = "",
  onSaveSession,
}) => {
  const [topic, setTopic] = useState(initialTopic || "Artificial Intelligence & Speech Recognition");
  const [deck, setDeck] = useState<SlideDeck | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [numSlides, setNumSlides] = useState(5);

  // Generate slides
  const handleGenerate = async (topicToUse?: string) => {
    const targetTopic = topicToUse || topic;
    if (!targetTopic.trim()) return;

    setIsLoading(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const generatedDeck = await apiGenerateSlides(targetTopic, numSlides);
      setDeck(generatedDeck);
      setCurrentSlideIndex(0);

      onSaveSession({
        title: `Deck: ${generatedDeck.title}`,
        type: "slides",
        preview: `${generatedDeck.slides.length} slides on ${generatedDeck.title}`,
        content: JSON.stringify(generatedDeck, null, 2),
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      handleGenerate(initialTopic);
    } else if (!deck) {
      handleGenerate("Artificial Intelligence & Speech Recognition");
    }
  }, [initialTopic]);

  const currentSlide = deck?.slides[currentSlideIndex];

  // Narration
  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !currentSlide) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${currentSlide.title}. ${currentSlide.narration || currentSlide.content.join(". ")}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.lang = "en-US";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Slide navigation
  const nextSlide = () => {
    if (!deck) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (currentSlideIndex < deck.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      if (currentSlideIndex + 2 === deck.slides.length) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      }
    }
  };

  const prevSlide = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  // Copy presentation outline
  const handleCopy = async () => {
    if (!deck) return;
    let text = `# ${deck.title}\n${deck.subtitle}\n\n`;
    deck.slides.forEach((s) => {
      text += `## Slide ${s.slideNumber}: ${s.title}\n`;
      s.content.forEach((c) => {
        text += `- ${c}\n`;
      });
      text += `> Voiceover: ${s.narration}\n\n`;
    });

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download markdown
  const handleDownload = () => {
    if (!deck) return;
    let md = `# ${deck.title}\n${deck.subtitle}\n\n`;
    deck.slides.forEach((s) => {
      md += `---\n\n### Slide ${s.slideNumber}: ${s.title}\n`;
      s.content.forEach((c) => {
        md += `- ${c}\n`;
      });
      md += `\n**Speaker Script**: ${s.narration}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.toLowerCase().replace(/\s+/g, "_")}_presentation.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header & Topic Generator Bar */}
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase text-amber-700">
                AI Presentation Deck
              </span>
            </div>
            <h2 className="text-2xl font-serif text-neutral-900 font-bold">
              Dynamic Slide Generator
            </h2>
            <p className="text-xs text-neutral-500">
              Generates structured multi-slide decks with animated cards and audio narration.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {["Quantum Computing", "Deep Learning", "Cloud Native"].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setTopic(p);
                  handleGenerate(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Enter any topic to synthesize into a slide deck..."
            className="flex-1 px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-sans"
          />

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !topic.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Deck</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Slide Presentation Stage */}
      {deck && currentSlide && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200/90 shadow-sm relative overflow-hidden transition-all">
          {/* Subtle Top Saffron Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          {/* Slide Top Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-extrabold tracking-wider uppercase">
                {currentSlide.badge || "MODULE"}
              </span>
              <span className="text-xs font-mono font-medium text-neutral-400">
                Slide {currentSlideIndex + 1} of {deck.slides.length}
              </span>
            </div>

            {/* Slide Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeech}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSpeaking
                    ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                    : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                }`}
                title="Listen to slide speaker notes"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Narrate Slide</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 border border-neutral-200 transition-colors"
                title="Print Presentation Slides"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 border border-neutral-200 transition-colors"
                title="Copy Deck to Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleDownload}
                className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 border border-neutral-200 transition-colors"
                title="Download Markdown Deck"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slide Body */}
          <div className="py-8 sm:py-10">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight mb-6">
              {currentSlide.title}
            </h3>

            <div className="space-y-4 mb-8">
              {currentSlide.content.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100 hover:border-amber-200 transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm sm:text-base text-neutral-700 leading-relaxed font-sans">
                    {point}
                  </p>
                </div>
              ))}
            </div>

            {/* Speaker Notes / Voiceover Preview */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
              <Volume2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Speaker Narration Script:
                </p>
                <p className="text-xs text-amber-950/80 leading-relaxed italic">
                  &ldquo;{currentSlide.narration}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Slide Navigation Bottom Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
            <button
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Progress Dots */}
            <div className="flex items-center gap-1.5">
              {deck.slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlideIndex
                      ? "w-8 bg-amber-600"
                      : "w-2 bg-neutral-200 hover:bg-neutral-300"
                  }`}
                  title={`Jump to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === deck.slides.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
