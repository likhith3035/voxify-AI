"use client";

import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isRecording: boolean;
  stream: MediaStream | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isRecording, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array | null = null;

    if (isRecording && stream) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (e) {
        console.warn("AudioContext error, falling back to simulated wave", e);
      }
    }

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 36;
      const barWidth = 3;
      const gap = (width - numBars * barWidth) / (numBars - 1);

      if (isRecording) {
        if (analyser && dataArray) {
          (analyser as any).getByteFrequencyData(dataArray);
        }

        for (let i = 0; i < numBars; i++) {
          let value = 0;
          if (dataArray && analyser) {
            const dataIndex = Math.floor((i / numBars) * dataArray.length);
            value = dataArray[dataIndex] / 255;
          } else {
            // Simulated pleasant sine wave pulse
            value = (Math.sin(phase + i * 0.3) + 1) / 2 * 0.75 + 0.15;
          }

          const barHeight = Math.max(4, value * height * 0.85);
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Warm saffron to amber gradient (Sarvam-inspired)
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, "#f97316"); // amber-orange
          grad.addColorStop(1, "#fbbf24"); // saffron-gold

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
        phase += 0.12;
      } else {
        // Idle calm bars
        for (let i = 0; i < numBars; i++) {
          const x = i * (barWidth + gap);
          const barHeight = 4;
          const y = (height - barHeight) / 2;

          ctx.fillStyle = "#e2e8f0";
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
    };
  }, [isRecording, stream]);

  return (
    <div className="w-full flex items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        className="w-full max-w-[320px] h-12"
      />
    </div>
  );
};
