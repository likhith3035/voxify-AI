"use client";

import React from "react";
import Link from "next/link";
import { Mic, ArrowRight, Sparkles, Presentation, Image as ImageIcon, Video, Bot } from "lucide-react";

export const SarvamHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-16 md:pb-32">
      {/* Radiant Saffron/Amber Aura Background (Image 1 Sarvam AI) */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[580px] rounded-full blur-3xl opacity-80"
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.58), rgba(251, 146, 60, 0.38), rgba(254, 215, 170, 0.18), transparent 70%)"
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Sovereign Decorative Flourish Motif */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-12 h-px bg-gradient-to-r from-transparent to-amber-400" />
          <svg
            className="w-8 h-8 text-amber-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
          </svg>
          <span className="w-12 h-px bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        {/* Sovereign Platform Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/70 border border-orange-300/60 text-orange-950 text-xs sm:text-sm font-semibold tracking-wide mb-6 backdrop-blur-sm shadow-xs">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>India&apos;s Sovereign Voice &amp; Multimodal AI Platform</span>
        </div>

        {/* Large Headline (Sarvam-inspired Serif) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight text-neutral-900 leading-[1.12] mb-6">
          AI for all from India.<br />
          <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700">
            Powered by Your Voice.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-neutral-600 leading-relaxed font-normal mb-10">
          Built on real-time browser speech recognition and frontier-class models. Turn spoken thoughts into written prose, interactive presentation slide decks, visual diagram breakdowns, and YouTube syntheses.
        </p>

        {/* Pill Action Buttons (Matching Image 1: Dark pill & Outlined pill) */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <Link
            href="/studio?tab=chat"
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-base shadow-lg shadow-neutral-900/10 transition-all hover:scale-102 active:scale-98"
          >
            <Bot className="w-5 h-5 text-orange-400" />
            <span>Launch AI Chatbot</span>
          </Link>

          <Link
            href="/studio?tab=voice"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/80 hover:bg-white text-neutral-800 font-medium text-base border border-neutral-200/80 shadow-xs hover:border-orange-300 transition-all backdrop-blur-xs"
          >
            <Mic className="w-5 h-5 text-amber-600" />
            <span>Open Voice Studio</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 ml-1" />
          </Link>
        </div>

        {/* Capability Cards Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left mb-16">
          <Link 
            href="/studio?tab=chat"
            className="p-5 rounded-2xl bg-white/70 border border-orange-100/70 hover:border-orange-300 hover:bg-white transition-all shadow-xs group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-neutral-900 mb-1">AI Chatbot Copilot</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">Conversational AI with voice dictation &amp; read-aloud voiceover.</p>
            </div>
            <span className="text-xs font-semibold text-orange-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Chat now &rarr;
            </span>
          </Link>

          <Link 
            href="/studio?tab=voice"
            className="p-5 rounded-2xl bg-white/70 border border-orange-100/70 hover:border-orange-300 hover:bg-white transition-all shadow-xs group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-neutral-900 mb-1">Voice Studio</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">Real-time multi-language transcription with live audio waveform.</p>
            </div>
            <span className="text-xs font-semibold text-amber-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Record voice &rarr;
            </span>
          </Link>

          <Link 
            href="/studio?tab=slides"
            className="p-5 rounded-2xl bg-white/70 border border-orange-100/70 hover:border-orange-300 hover:bg-white transition-all shadow-xs group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Presentation className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-neutral-900 mb-1">AI Slide Deck</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">Turn voice notes or topics into interactive animated slides.</p>
            </div>
            <span className="text-xs font-semibold text-rose-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Build deck &rarr;
            </span>
          </Link>

          <Link 
            href="/studio?tab=vision"
            className="p-5 rounded-2xl bg-white/70 border border-orange-100/70 hover:border-orange-300 hover:bg-white transition-all shadow-xs group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-neutral-900 mb-1">Vision Diagram Lab</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">Upload homework diagrams or charts for instant breakdown.</p>
            </div>
            <span className="text-xs font-semibold text-purple-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Analyze image &rarr;
            </span>
          </Link>
        </div>

        {/* Sarvam-style Trust Banner (Image 1 Bottom Ticker) */}
        <div className="pt-10 border-t border-orange-100/80 text-center">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-8">
            INDIA BUILDS WITH VOXIFY &middot; TRUSTED PLATFORM
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all font-bold text-neutral-700 text-sm tracking-wider">
            <span>CRED</span>
            <span>DECENTRO</span>
            <span>IDFC FIRST Bank</span>
            <span>Infosys</span>
            <span>LIC</span>
            <span>Mahindra FINANCE</span>
            <span>SBI</span>
          </div>
        </div>
      </div>
    </section>
  );
};
