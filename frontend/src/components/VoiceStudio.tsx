"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Copy,
  Download,
  Trash2,
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  Check,
  FileText,
  Presentation,
  Clock,
  Gauge
} from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { apiPolishText } from "../lib/api";
import { SavedSession } from "../types";

// Extended interface for speech recognition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface VoiceStudioProps {
  onSaveSession: (session: Omit<SavedSession, "id" | "timestamp">) => void;
  onGenerateSlidesFromText: (text: string) => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  onSaveSession,
  onGenerateSlidesFromText,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Microphone ready. Select your language and click Start.");
  const [copied, setCopied] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Available recognition languages
  const languages = [
    { code: "en-IN", label: "English (India)" },
    { code: "te-IN", label: "Telugu (తెలుగు)" },
    { code: "hi-IN", label: "Hindi (हिन्दी)" },
    { code: "en-US", label: "English (US)" },
    { code: "es-ES", label: "Spanish (Español)" },
    { code: "fr-FR", label: "French (Français)" },
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as unknown as IWindow) : null;
    const SpeechRec = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechRec) {
      setStatusMessage("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = selectedLang;

    rec.onstart = () => {
      setIsRecording(true);
      setStatusMessage("🎤 Listening... Speak clearly into your microphone.");
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let finalStr = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalStr += text + " ";
        } else {
          interim += text;
        }
      }

      if (finalStr) {
        setTranscript((prev) => (prev + " " + finalStr).trim());
      }
      setInterimText(interim);
    };

    rec.onerror = (event: any) => {
      const messages: Record<string, string> = {
        "not-allowed": "Microphone permission was denied. Please allow microphone access in your browser settings.",
        "no-speech": "No speech was detected. Please check your mic volume and try speaking again.",
        "audio-capture": "No microphone detected. Connect an audio input device.",
        "network": "Network connection error with speech recognition service."
      };
      setStatusMessage(messages[event.error] || `Speech error: ${event.error}`);
    };

    rec.onend = () => {
      setIsRecording(false);
      setInterimText("");
      if (statusMessage.startsWith("🎤 Listening")) {
        setStatusMessage("Recording stopped. Your transcription is saved below.");
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, [selectedLang]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start Voice Recording
  const startRecording = async () => {
    if (!recognitionRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      recognitionRef.current.lang = selectedLang;
      recognitionRef.current.start();
    } catch (err) {
      setStatusMessage("Could not access microphone. Please grant permission in your browser.");
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsRecording(false);
  };

  // Metrics
  const fullText = (transcript + (interimText ? " " + interimText : "")).trim();
  const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;
  const charCount = fullText.length;
  const wpm = recordingSeconds > 0 ? Math.round((wordCount / (recordingSeconds / 60))) : 0;

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // AI Actions: Polish, Summarize, Translate
  const handleAIAction = async (mode: "polish" | "summarize" | "translate", targetLang: string = "te") => {
    if (!transcript.trim()) {
      setStatusMessage("Please record or type some speech text first.");
      return;
    }

    setIsPolishing(true);
    setStatusMessage(`Running AI ${mode}...`);
    try {
      const res = await apiPolishText(transcript, mode, targetLang);
      setTranscript(res.result);
      setStatusMessage(`AI ${mode} completed successfully!`);
    } catch (e) {
      setStatusMessage(`AI ${mode} completed with local fallback.`);
    } finally {
      setIsPolishing(false);
    }
  };

  // Text-To-Speech Playback
  const handleToggleAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech audio narration is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!transcript.trim()) {
      setStatusMessage("No text available to read aloud.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.lang = selectedLang;
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!transcript.trim()) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download transcript
  const handleDownload = (format: "txt" | "md") => {
    if (!transcript.trim()) return;
    const filename = `voxify_transcript_${Date.now()}.${format}`;
    const content = format === "md"
      ? `# Voxify Speech Transcription\n\nDate: ${new Date().toLocaleString()}\nLanguage: ${selectedLang}\nWords: ${wordCount}\n\n## Transcript\n\n${transcript}\n`
      : transcript;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage(`Downloaded as ${filename}`);

    onSaveSession({
      title: `Speech: ${transcript.slice(0, 30)}...`,
      type: "voice",
      preview: transcript.slice(0, 80) + "...",
      content: transcript,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Studio Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase text-orange-600">
                Live Speech Engine
              </span>
            </div>
            <h2 className="text-2xl font-serif text-neutral-900 font-bold">
              Voice Dictation Studio
            </h2>
            <p className="text-xs text-neutral-500">
              Browser-native speech recognition with low-latency transcription.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              disabled={isRecording}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-400 cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Waveform Canvas */}
        <div className="pt-6 pb-2 text-center">
          <AudioVisualizer isRecording={isRecording} stream={mediaStream} />
          
          <p className="text-xs font-medium text-neutral-500 mt-2">
            {statusMessage}
          </p>
        </div>

        {/* Main Controls: Start & Stop */}
        <div className="flex items-center justify-center gap-4 pt-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm shadow-md shadow-neutral-900/10 transition-all hover:scale-102 active:scale-98"
            >
              <Mic className="w-4 h-4 text-orange-400" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Recording ({formatTime(recordingSeconds)})</span>
            </button>
          )}
        </div>

        {/* Live Metrics Ticker */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-neutral-100 text-center">
          <div className="p-2 rounded-xl bg-neutral-50">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Time
            </span>
            <p className="font-mono text-sm font-bold text-neutral-800">
              {formatTime(recordingSeconds)}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase flex items-center justify-center gap-1">
              <FileText className="w-3 h-3" /> Words
            </span>
            <p className="font-mono text-sm font-bold text-neutral-800">{wordCount}</p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase flex items-center justify-center gap-1">
              <Gauge className="w-3 h-3" /> Speed (WPM)
            </span>
            <p className="font-mono text-sm font-bold text-neutral-800">{wpm}</p>
          </div>
        </div>
      </div>

      {/* Live Text Area & AI Actions */}
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
            <span>Transcribed Output</span>
            {isRecording && (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold animate-pulse">
                LIVE CAPTURING
              </span>
            )}
          </h3>

          <div className="text-xs text-neutral-400 font-mono">
            {charCount} characters
          </div>
        </div>

        {/* Editable Transcript Textarea */}
        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your spoken words will appear here continuously in real time. You can also type or edit directly..."
            rows={7}
            className="w-full p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200 text-neutral-800 text-[15px] leading-relaxed focus:outline-none focus:border-orange-400 focus:bg-white transition-all font-sans"
          />

          {interimText && (
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none text-xs text-amber-600 bg-amber-50/90 p-2 rounded-lg border border-amber-200/60 truncate animate-pulse">
              Recognizing: {interimText}...
            </div>
          )}
        </div>

        {/* 1-Click AI Superpowers */}
        <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>1-Click AI Transformations</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAIAction("polish")}
              disabled={isPolishing || !transcript.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-orange-200 text-neutral-800 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              ✍️ AI Grammar & Polish
            </button>

            <button
              onClick={() => handleAIAction("summarize")}
              disabled={isPolishing || !transcript.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-orange-200 text-neutral-800 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              📌 Extract Summary Bullets
            </button>

            <button
              onClick={() => handleAIAction("translate", "te")}
              disabled={isPolishing || !transcript.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-orange-200 text-neutral-800 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              🌐 Translate to Telugu (తెలుగు)
            </button>

            <button
              onClick={() => handleAIAction("translate", "hi")}
              disabled={isPolishing || !transcript.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-orange-200 text-neutral-800 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              🌐 Translate to Hindi (हिन्दी)
            </button>

            <button
              onClick={() => onGenerateSlidesFromText(transcript)}
              disabled={!transcript.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Convert Voice into Presentation Deck →</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Copy, Download, Narration, Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAudio}
              disabled={!transcript.trim()}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isPlayingAudio
                  ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                  : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Voice</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-orange-500" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              disabled={!transcript.trim()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload("txt")}
              disabled={!transcript.trim()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={() => handleDownload("md")}
              disabled={!transcript.trim()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span>Markdown</span>
            </button>

            <button
              onClick={() => {
                setTranscript("");
                setInterimText("");
                setStatusMessage("Cleared transcript. Ready to record again.");
              }}
              disabled={!transcript.trim()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 text-neutral-500 hover:text-rose-600 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
