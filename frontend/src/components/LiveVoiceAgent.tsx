"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Languages,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Bot,
  User,
  Radio,
  Copy,
  Check,
  Zap,
  AlertCircle,
  Send,
} from "lucide-react";
import { apiStreamChatMessage } from "../lib/api";

interface LiveVoiceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToChat?: (transcript: { role: string; content: string }[]) => void;
}

interface TranscriptTurn {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
}

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "Indian English (en-IN)", promptLang: "Indian English" },
  { code: "en-US", label: "US English (en-US)", promptLang: "English" },
  { code: "hi-IN", label: "Hindi (hi-IN)", promptLang: "Hindi and English (Hinglish)" },
  { code: "te-IN", label: "Telugu (te-IN)", promptLang: "Telugu and English" },
];

export const LiveVoiceAgent: React.FC<LiveVoiceAgentProps> = ({
  isOpen,
  onClose,
  onSaveToChat,
}) => {
  const [agentState, setAgentState] = useState<"connecting" | "listening" | "thinking" | "speaking" | "muted">("connecting");
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveUserSpeech, setLiveUserSpeech] = useState("");
  const [liveAgentSpeech, setLiveAgentSpeech] = useState("");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isAgentSpeakingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const hasPermissionErrorRef = useRef<boolean>(false);
  const speechQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // 1. Initial Call Connect & Cleanup
  useEffect(() => {
    if (!isOpen) {
      handleEndCall();
      return;
    }

    setTranscript([]);
    setLiveUserSpeech("");
    setLiveAgentSpeech("");
    setAgentState("connecting");

    // Initialize microphone audio stream for the visualizer
    const startAudio = async () => {
      hasPermissionErrorRef.current = false;
      setMicError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (err: any) {
        if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
          setMicError("No microphone found on this device. Plug in a headset/mic or type below.");
          hasPermissionErrorRef.current = true;
        } else if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          setMicError("Microphone access blocked. Click the lock icon in the address bar to allow mic access.");
          hasPermissionErrorRef.current = true;
        } else {
          console.warn("Microphone stream visualizer unavailable, fallback to simulated pulse", err);
        }
      }

      if (!hasPermissionErrorRef.current) {
        setAgentState("listening");
        startListeningLoop();
      } else {
        setAgentState("muted");
      }

      // Initial spoken greeting from Voxify
      const greeting =
        selectedLang === "te-IN"
          ? "నమస్కారం! నేను Voxify AI వాయిస్ కోపైలట్. మీరు ఏ టాపిక్ గురించి తెలుసుకోవాలనుకుంటున్నారు?"
          : selectedLang === "hi-IN"
          ? "नमस्ते! मैं Voxify AI हूँ। आज आप किस विषय के बारे में बात करना चाहते हैं?"
          : "Hello! I'm Voxify AI, your live voice copilot. What topic would you like to explore together?";

      setLiveAgentSpeech(greeting);
      speakSentence(greeting, () => {
        setLiveAgentSpeech("");
        if (!hasPermissionErrorRef.current) {
          setAgentState("listening");
          startListeningLoop();
        } else {
          setAgentState("muted");
        }
      });
    };

    startAudio();

    return () => {
      handleEndCall();
    };
  }, [isOpen, selectedLang]);

  // 2. Audio Visualizer Canvas Loop (Saffron / Amber Glowing Orb)
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const dataArray = new Uint8Array(32);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let micLevel = 0;
      if (analyserRef.current && agentState === "listening" && !isMutedRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        micLevel = (sum / (dataArray.length * 255)) * 1.5;
      }

      phase += 0.04;
      const baseRadius = 60;
      let dynamicRadius = baseRadius;

      if (agentState === "speaking") {
        dynamicRadius += Math.sin(phase * 3) * 16 + 12;
      } else if (agentState === "thinking") {
        dynamicRadius += Math.sin(phase * 5) * 8;
      } else if (agentState === "listening") {
        dynamicRadius += micLevel * 45 + Math.sin(phase) * 4;
      }

      // Outer radiant glow halo (Sarvam Amber aura)
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicRadius * 0.4,
        centerX,
        centerY,
        dynamicRadius * 2.2
      );

      if (agentState === "speaking") {
        glowGrad.addColorStop(0, "rgba(245, 158, 11, 0.45)");
        glowGrad.addColorStop(0.5, "rgba(217, 119, 6, 0.2)");
        glowGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
      } else if (agentState === "thinking") {
        glowGrad.addColorStop(0, "rgba(59, 130, 246, 0.45)");
        glowGrad.addColorStop(0.5, "rgba(37, 99, 235, 0.2)");
        glowGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
      } else if (agentState === "listening") {
        glowGrad.addColorStop(0, "rgba(16, 185, 129, 0.45)");
        glowGrad.addColorStop(0.5, "rgba(5, 150, 105, 0.2)");
        glowGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
      } else {
        glowGrad.addColorStop(0, "rgba(163, 163, 163, 0.3)");
        glowGrad.addColorStop(1, "rgba(163, 163, 163, 0)");
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Inner pulsating solid core
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        dynamicRadius
      );

      if (agentState === "speaking") {
        coreGrad.addColorStop(0, "#fef3c7");
        coreGrad.addColorStop(0.6, "#f59e0b");
        coreGrad.addColorStop(1, "#b45309");
      } else if (agentState === "thinking") {
        coreGrad.addColorStop(0, "#dbeafe");
        coreGrad.addColorStop(0.6, "#3b82f6");
        coreGrad.addColorStop(1, "#1d4ed8");
      } else if (agentState === "listening") {
        coreGrad.addColorStop(0, "#d1fae5");
        coreGrad.addColorStop(0.6, "#10b981");
        coreGrad.addColorStop(1, "#047857");
      } else {
        coreGrad.addColorStop(0, "#f5f5f5");
        coreGrad.addColorStop(1, "#737373");
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
      ctx.fill();

      // Orbital wave rings
      ctx.lineWidth = 1.5;
      for (let r = 1; r <= 3; r++) {
        const ringRadius = dynamicRadius + r * 18 + Math.sin(phase + r) * 6;
        ctx.strokeStyle =
          agentState === "speaking"
            ? `rgba(245, 158, 11, ${0.4 - r * 0.1})`
            : agentState === "listening"
            ? `rgba(16, 185, 129, ${0.4 - r * 0.1})`
            : `rgba(147, 197, 253, ${0.4 - r * 0.1})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, agentState]);

  // 3. Speech Recognition Engine
  const startListeningLoop = () => {
    if (isMutedRef.current || isAgentSpeakingRef.current) return;

    const win = typeof window !== "undefined" ? (window as any) : null;
    const SpeechRec = win?.SpeechRecognition || win?.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang;

      rec.onresult = (event: any) => {
        if (isMutedRef.current) return;

        // Barge-in: If agent is speaking and user speaks, cancel agent speech!
        if (isAgentSpeakingRef.current) {
          stopAgentSpeech();
        }

        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentSpoken = (final || interim).trim();
        if (currentSpoken) {
          setLiveUserSpeech(currentSpoken);
          setAgentState("listening");

          // Reset silence timer on every new speech event
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentSpoken.trim().length > 1) {
              handleUserSpoke(currentSpoken);
            }
          }, 1100);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
          hasPermissionErrorRef.current = true;
          setMicError("Microphone blocked or not found. Click the lock icon to allow mic or type below.");
          setAgentState("muted");
          return;
        }
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Speech recognition error:", e.error);
        }
      };

      rec.onend = () => {
        if (hasPermissionErrorRef.current) return;
        // Auto-restart listening if not currently speaking
        if (!isAgentSpeakingRef.current && !isMutedRef.current && isOpen) {
          try {
            rec.start();
          } catch (_) {}
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
  };

  // 4. Processing Spoken Query through Groq AI
  const handleUserSpoke = async (spokenText: string) => {
    const text = spokenText.trim();
    if (!text || isAgentSpeakingRef.current) return;

    stopListening();
    setLiveUserSpeech("");
    setAgentState("thinking");

    const newTurn: TranscriptTurn = {
      id: "turn_" + Date.now(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTranscript((prev) => [...prev, newTurn]);

    // Build conversational context
    const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);
    const systemPrompt = `You are Voxify, a friendly, ultra-knowledgeable voice AI study tutor having a live phone conversation with a student.
CRITICAL INSTRUCTIONS FOR VOICE:
1. Speak naturally in ${currentLangObj?.promptLang || "English"}.
2. Keep your answer brief and conversational: 2 to 3 sentences maximum (under 50 words).
3. Do NOT use markdown symbols, bullet points, asterisks (*), code blocks, or URLs, because your answer will be spoken directly into the student's ear.
4. Sound enthusiastic, encouraging, and clear.`;

    const history = transcript.slice(-6).map((t) => ({
      role: t.role === "agent" ? "assistant" : "user",
      content: t.text,
    }));

    history.unshift({ role: "system", content: systemPrompt });
    history.push({ role: "user", content: text });

    abortControllerRef.current = new AbortController();
    let accumulatedResponse = "";
    let sentenceBuffer = "";

    try {
      await apiStreamChatMessage(
        history,
        text,
        (delta) => {
          if (!delta) return;
          accumulatedResponse += delta;
          sentenceBuffer += delta;
          setLiveAgentSpeech(accumulatedResponse);

          // Sentence streaming: split tokens by punctuation and speak sentence-by-sentence!
          const match = sentenceBuffer.match(/([^\.\?\!]+[\.\?\!])\s*/);
          if (match) {
            const completeSentence = match[1].trim();
            sentenceBuffer = sentenceBuffer.slice(match[0].length);
            if (completeSentence) {
              enqueueSpeechSentence(completeSentence);
            }
          }
        },
        () => {
          // Streaming completed: speak any remaining buffer
          if (sentenceBuffer.trim()) {
            enqueueSpeechSentence(sentenceBuffer.trim());
          }

          setTranscript((prev) => [
            ...prev,
            {
              id: "turn_agent_" + Date.now(),
              role: "agent",
              text: accumulatedResponse || "I am here with you. What would you like to discuss?",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        },
        (err) => {
          console.error("Voice agent stream error:", err);
          setAgentState("listening");
          startListeningLoop();
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      console.error(err);
      setAgentState("listening");
      startListeningLoop();
    }
  };

  // 5. Sentence-by-Sentence Low Latency Speech Synthesis
  const enqueueSpeechSentence = (sentence: string) => {
    speechQueueRef.current.push(sentence);
    if (!isPlayingQueueRef.current) {
      playNextSpeechSentence();
    }
  };

  const playNextSpeechSentence = () => {
    if (speechQueueRef.current.length === 0) {
      isPlayingQueueRef.current = false;
      isAgentSpeakingRef.current = false;
      setAgentState("listening");
      setLiveAgentSpeech("");
      startListeningLoop();
      return;
    }

    isPlayingQueueRef.current = true;
    isAgentSpeakingRef.current = true;
    setAgentState("speaking");

    const sentence = speechQueueRef.current.shift()!;
    speakSentence(sentence, () => {
      playNextSpeechSentence();
    });
  };

  const speakSentence = (text: string, onEnd: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd();
      return;
    }

    const clean = text.replace(/[#*`_~]/g, "").trim();
    if (!clean) {
      onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.08;
    utterance.lang = selectedLang;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find((v) => v.lang === selectedLang && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Neural"))) ||
      voices.find((v) => v.lang.startsWith(selectedLang.split("-")[0]));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      onEnd();
    };

    utterance.onerror = () => {
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAgentSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    isPlayingQueueRef.current = false;
    isAgentSpeakingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      stopListening();
      setAgentState("muted");
    } else {
      setAgentState("listening");
      startListeningLoop();
    }
  };

  const handleEndCall = () => {
    stopListening();
    stopAgentSpeech();

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    if (transcript.length > 0 && onSaveToChat) {
      onSaveToChat(
        transcript.map((t) => ({
          role: t.role === "agent" ? "assistant" : "user",
          content: t.text,
        }))
      );
    }

    onClose();
  };

  const handleCopyTranscript = () => {
    const text = transcript.map((t) => `${t.role === "user" ? "You" : "Voxify"}: ${t.text}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedId("all");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0f12]/95 backdrop-blur-xl flex flex-col text-neutral-100 font-sans animate-fade-in select-none">
      {/* 1. Header Bar: Voxify Live Call Status & Language Selector */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-950">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base tracking-tight text-white">Voxify Live Call</h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                Groq LPU Sub-200ms
              </span>
            </div>
            <p className="text-xs text-neutral-400">Two-way continuous voice partner</p>
          </div>
        </div>

        {/* Language & Voice Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.label.split(" ")[0]}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#16181c] border border-neutral-800 shadow-2xl py-1.5 z-50 text-xs">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-neutral-800/80 font-medium transition-colors ${
                    selectedLang === lang.code ? "text-amber-400 bg-amber-500/10" : "text-neutral-300"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Stage: Glowing Audio Orb Canvas & Spoken Dialogue */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Canvas Visualizer Orb */}
        <div className="relative flex items-center justify-center my-4">
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px]"
          />

          {/* Central Pulsing State Icon inside Orb */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {agentState === "speaking" ? (
              <Volume2 className="w-10 h-10 text-white drop-shadow-md animate-pulse" />
            ) : agentState === "thinking" ? (
              <Zap className="w-10 h-10 text-blue-100 drop-shadow-md animate-spin" />
            ) : isMuted ? (
              <MicOff className="w-10 h-10 text-neutral-400 drop-shadow-md" />
            ) : (
              <Mic className="w-10 h-10 text-emerald-100 drop-shadow-md" />
            )}
          </div>
        </div>

        {/* State Headline Badge */}
        <div className="mb-4 text-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium ${
              agentState === "speaking"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : agentState === "thinking"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : isMuted
                ? "bg-neutral-800 text-neutral-400 border border-neutral-700"
                : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                agentState === "speaking"
                  ? "bg-amber-400 animate-ping"
                  : agentState === "thinking"
                  ? "bg-blue-400 animate-pulse"
                  : isMuted
                  ? "bg-neutral-500"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            {agentState === "speaking"
              ? "Voxify is speaking..."
              : agentState === "thinking"
              ? "Thinking..."
              : isMuted
              ? "Microphone Muted"
              : "Listening... Speak naturally"}
          </span>
        </div>

        {/* Live Spoken Text Bubble */}
        <div className="max-w-xl w-full min-h-[72px] px-4 py-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-center flex items-center justify-center">
          {liveUserSpeech ? (
            <p className="text-sm sm:text-base text-neutral-200 font-sans italic">
              &ldquo;{liveUserSpeech}&rdquo;
            </p>
          ) : liveAgentSpeech ? (
            <p className="text-sm sm:text-base text-amber-200/90 font-sans">
              {liveAgentSpeech}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-neutral-500 font-sans">
              {isMuted
                ? "Unmute your microphone to speak."
                : "Ask any academic concept, formula, or question out loud."}
            </p>
          )}
        </div>

        {/* Mic Error Banner if blocked or missing */}
        {micError && (
          <div className="max-w-xl w-full mx-auto mt-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{micError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                hasPermissionErrorRef.current = false;
                setMicError(null);
                startListeningLoop();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold shrink-0 cursor-pointer"
            >
              Retry Mic
            </button>
          </div>
        )}

        {/* Text Conversation Fallback (Allows typing & hearing voice even without mic) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim() && !isAgentSpeakingRef.current) {
              handleUserSpoke(textInput.trim());
              setTextInput("");
            }
          }}
          className="max-w-xl w-full mx-auto mt-3 px-3 py-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-2 focus-within:border-amber-500/40"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type any message to converse with Voxify..."
            className="flex-1 bg-transparent outline-none text-xs text-neutral-200 placeholder-neutral-500 font-sans"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || agentState === "thinking"}
            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* 3. Collapsible Live Transcript Drawer */}
      {transcriptOpen && (
        <div className="max-w-2xl mx-auto w-full px-4 mb-3">
          <div className="bg-[#14161a] border border-neutral-800 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-3 no-scrollbar text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Call Transcript ({transcript.length} turns)</span>
              <button
                type="button"
                onClick={handleCopyTranscript}
                className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedId === "all" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === "all" ? "Copied" : "Copy All"}</span>
              </button>
            </div>

            {transcript.map((t) => (
              <div
                key={t.id}
                className={`flex gap-2.5 ${t.role === "user" ? "text-neutral-300" : "text-amber-300/90"}`}
              >
                <span className="font-semibold text-neutral-400 shrink-0">
                  {t.role === "user" ? "You:" : "Voxify:"}
                </span>
                <span className="leading-relaxed">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Bottom Controls: Mute, Transcript Toggle, Barge-in Interrupt, and End Call */}
      <div className="px-4 sm:px-8 py-5 border-t border-neutral-800/80 bg-neutral-950/80 flex items-center justify-between max-w-xl mx-auto w-full gap-4">
        {/* Toggle Transcript */}
        <button
          type="button"
          onClick={() => setTranscriptOpen(!transcriptOpen)}
          className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            transcriptOpen
              ? "bg-neutral-800 border-neutral-700 text-white"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
          }`}
          title="Toggle transcript view"
        >
          {transcriptOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          <span>Transcript</span>
        </button>

        {/* Center Primary Call Actions */}
        <div className="flex items-center gap-3">
          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
            }`}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Interrupt Agent Button */}
          {agentState === "speaking" && (
            <button
              type="button"
              onClick={stopAgentSpeech}
              className="px-3.5 py-2.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Interrupt and speak"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Interrupt</span>
            </button>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Tip / Status */}
        <div className="text-[11px] text-neutral-500 font-sans hidden sm:block">
          Speak and pause to send
        </div>
      </div>
    </div>
  );
};
