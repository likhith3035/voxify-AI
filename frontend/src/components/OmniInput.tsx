"use client";

import React, { useState } from "react";
import {
  Mic,
  ArrowUp,
  Paperclip,
  ChevronDown,
  Presentation,
  Video,
  Image as ImageIcon,
  Sparkles,
  Bot
} from "lucide-react";
import { ActiveTab } from "../types";

interface OmniInputProps {
  onQuickAction: (tab: ActiveTab, promptText?: string) => void;
  onStartVoice: () => void;
  onAttachFile: (file: File) => void;
}

export const OmniInput: React.FC<OmniInputProps> = ({
  onQuickAction,
  onStartVoice,
  onAttachFile,
}) => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("Voxify Ultra");
  const [modelDropdown, setModelDropdown] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    // Route smartly: if it looks like a YouTube link, go to video tab
    if (prompt.includes("youtube.com") || prompt.includes("youtu.be")) {
      onQuickAction("video", prompt);
    } else {
      // Direct question or topic goes straight to AI Chatbot!
      onQuickAction("chat", prompt);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAttachFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto text-center pt-8 pb-12">
      {/* Cowork-style Warm Serif Heading */}
      <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-neutral-900 mb-8 font-normal">
        Let&apos;s get to work.
      </h2>

      {/* Central Intelligent OmniInput Box */}
      <div className="relative bg-white rounded-3xl border border-neutral-200/90 shadow-sm hover:border-orange-300 transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 p-3 sm:p-4 text-left">
        {/* Model Selector Tag */}
        <div className="relative inline-block mb-2">
          <button
            type="button"
            onClick={() => setModelDropdown(!modelDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs font-medium text-neutral-700 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-orange-500" />
            <span>{model}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {modelDropdown && (
            <div className="absolute left-0 mt-1.5 w-44 rounded-xl bg-white border border-neutral-200 shadow-lg py-1.5 z-20 text-xs">
              <button
                onClick={() => { setModel("Voxify Ultra"); setModelDropdown(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-orange-50 hover:text-orange-600 font-medium"
              >
                Voxify Ultra (OpenAI / Synthesizer)
              </button>
              <button
                onClick={() => { setModel("Voxify Flash"); setModelDropdown(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-orange-50 hover:text-orange-600 font-medium"
              >
                Voxify Flash (Browser Fast)
              </button>
            </div>
          )}
        </div>

        {/* Input Textarea / Input */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a topic for presentation slides, paste a YouTube URL, or click mic to dictate..."
            rows={2}
            className="w-full resize-none bg-transparent outline-none text-neutral-800 placeholder-neutral-400 text-[15px] leading-relaxed mb-3"
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            {/* Attachment Button */}
            <div className="flex items-center gap-2">
              <label 
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 cursor-pointer transition-colors"
                title="Attach image or diagram for vision analysis"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                Supports speech, slide decks, images & YouTube
              </span>
            </div>

            {/* Right Buttons: Mic + Submit */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onStartVoice}
                className="p-2 rounded-xl text-neutral-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                title="Start Voice Studio recording"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!prompt.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${
                  prompt.trim()
                    ? "bg-neutral-900 hover:bg-neutral-800 scale-100 active:scale-95"
                    : "bg-neutral-300 cursor-not-allowed scale-95"
                }`}
                title="Generate"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <p className="text-center text-[11px] text-neutral-400 mt-3 mb-10">
        AI synthesized knowledge. Powered by browser speech recognition & Python REST API.
      </p>

      {/* Cowork-style Bento Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {/* Card 1 */}
        <div
          onClick={() => onQuickAction("voice")}
          className="p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Mic className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm text-neutral-900 mb-1">
            Voice Dictation
          </h4>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Record voice with live waveform, AI grammar polish & translation.
          </p>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onQuickAction("slides")}
          className="p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Presentation className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm text-neutral-900 mb-1">
            AI Presentation Deck
          </h4>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Turn any voice or topic into an interactive slide presentation with audio.
          </p>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onQuickAction("vision")}
          className="p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ImageIcon className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm text-neutral-900 mb-1">
            Diagram & Vision Lab
          </h4>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Upload homework diagrams or flowcharts for instant conceptual breakdown.
          </p>
        </div>
      </div>
    </div>
  );
};
