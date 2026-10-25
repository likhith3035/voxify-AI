"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Mic } from "lucide-react";

interface NavbarProps {
  backendOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ backendOnline = false }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/75 border-b border-orange-100/60 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo (Sarvam-inspired typography) */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-neutral-900 font-sans">
            voxify<span className="text-orange-500">.</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-neutral-600">
          <Link
            href="/studio?tab=chat"
            className="transition-colors hover:text-orange-600"
          >
            AI Chatbot
          </Link>
          <Link
            href="/studio?tab=voice"
            className="transition-colors hover:text-orange-600"
          >
            Voice Studio
          </Link>
          <Link
            href="/studio?tab=slides"
            className="transition-colors hover:text-orange-600"
          >
            AI Slide Deck
          </Link>
          <Link
            href="/studio?tab=vision"
            className="transition-colors hover:text-orange-600"
          >
            Vision Lab
          </Link>
          <Link
            href="/studio?tab=video"
            className="transition-colors hover:text-orange-600"
          >
            YouTube Synthesizer
          </Link>
        </nav>

        {/* Right CTA & Go to Dashboard (Matching Image 1) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50/80 border border-orange-200/60 text-xs font-medium text-orange-900">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            {backendOnline ? "Python API Connected" : "Local Smart Engine"}
          </div>

          <Link
            href="/studio"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold shadow-sm transition-all hover:scale-102 active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
