"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  VolumeX,
  FileCheck,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { apiExplainImage } from "../lib/api";
import { SavedSession } from "../types";

interface VisionLabProps {
  onSaveSession: (session: Omit<SavedSession, "id" | "timestamp">) => void;
  attachedFile?: File | null;
}

export const VisionLab: React.FC<VisionLabProps> = ({ onSaveSession, attachedFile }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(attachedFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (attachedFile) {
      setSelectedFile(attachedFile);
      setPreviewUrl(URL.createObjectURL(attachedFile));
      handleAnalyze(attachedFile);
    }
  }, [attachedFile]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setExplanation("");
  };

  const handleAnalyze = async (fileToUse?: File) => {
    const file = fileToUse || selectedFile;
    if (!file) return;

    setIsLoading(true);
    try {
      const res = await apiExplainImage(file);
      setExplanation(res.explanation);

      onSaveSession({
        title: `Vision: ${file.name}`,
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
      {/* Vision Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-rose-700">
            Multimodal Vision Lab
          </span>
        </div>
        <h2 className="text-2xl font-serif text-neutral-900 font-bold mb-1">
          Visual Diagram & Image Analyzer
        </h2>
        <p className="text-xs text-neutral-500">
          Upload any flowchart, textbook illustration, architecture diagram, or formula to generate an in-depth AI breakdown.
        </p>

        {/* Dropzone */}
        <div className="mt-6">
          <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-rose-400 bg-neutral-50/70 hover:bg-rose-50/30 cursor-pointer transition-all group">
            <UploadCloud className="w-10 h-10 text-neutral-400 group-hover:text-rose-500 group-hover:scale-110 transition-all mb-3" />
            <p className="font-semibold text-sm text-neutral-800 mb-1">
              {selectedFile ? selectedFile.name : "Click to select or drag and drop an image"}
            </p>
            <p className="text-xs text-neutral-400">
              Supports JPG, PNG, WEBP, GIF (up to 16 MB)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Action Trigger Button */}
        {selectedFile && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Ready for analysis: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Analyze Diagram</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Preview & Results Display */}
      {(previewUrl || explanation) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {previewUrl && (
            <div className="md:col-span-5 p-4 rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 self-start">
                Image Preview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected"
                className="max-h-72 rounded-2xl object-contain border border-neutral-100 shadow-2xs"
              />
            </div>
          )}

          {explanation && (
            <div className={`p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-4 ${previewUrl ? "md:col-span-7" : "md:col-span-12"}`}>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  AI Structural Analysis
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
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-rose-500" />}
                    <span>{isSpeaking ? "Stop Voice" : "Narrate"}</span>
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
