import { NextRequest, NextResponse } from "next/server";
import { getGroqApiKeys } from "@/lib/server-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const keys = getGroqApiKeys();
    if (keys.length === 0) {
      return NextResponse.json(
        { error: "No Groq API key configured for audio transcription." },
        { status: 503 }
      );
    }

    // Try Groq Whisper transcription with multi-key failover
    for (const key of keys) {
      try {
        const groqFormData = new FormData();
        groqFormData.append("file", audioFile, "recording.webm");
        groqFormData.append("model", "whisper-large-v3-turbo");
        groqFormData.append("temperature", "0.0");

        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "User-Agent": "VoxifyAIStudio/2.0 (Platform/Cloud)",
          },
          body: groqFormData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            return NextResponse.json({
              text: data.text.trim(),
              engine: "Groq Whisper Large v3 Turbo",
            });
          }
        }
      } catch (err) {
        console.warn("Groq whisper transcription error on key:", err);
      }
    }

    return NextResponse.json(
      { error: "Audio transcription service temporarily unavailable." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Transcription route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
