import { NextResponse } from "next/server";

export async function GET() {
  const hasGroq = Boolean(process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasXAI = Boolean(process.env.XAI_API_KEY);

  return NextResponse.json({
    status: "online",
    service: "Voxify AI Studio Edge API",
    version: "2.0.0",
    has_groq_key: hasGroq,
    has_gemini_key: hasGemini,
    has_openai_key: hasOpenAI,
    has_xai_key: hasXAI,
    active_models: [
      ...(hasGroq ? ["Groq Llama-3.3-70B"] : []),
      ...(hasGemini ? ["Google Gemini 1.5 Flash"] : []),
      ...(hasXAI ? ["xAI Grok"] : []),
      ...(hasOpenAI ? ["OpenAI GPT-4o-mini"] : []),
      ...(!hasGroq && !hasGemini && !hasOpenAI ? ["Voxify Conversational Engine"] : [])
    ],
    features: [
      "speech_transcription_support",
      "ai_presentation_generator",
      "smart_ai_polish",
      "youtube_synthesizer",
      "vision_diagram_explainer",
      "wikipedia_knowledge_graph",
      "ai_chat_assistant"
    ]
  });
}
