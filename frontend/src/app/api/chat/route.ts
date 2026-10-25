import { NextRequest, NextResponse } from "next/server";
import {
  CHATGPT_STYLE_SYSTEM_PROMPT,
  isDeveloperQuery,
  getDeveloperInfoResponse,
  getGroqApiKeys,
  CANDIDATE_GROQ_MODELS,
} from "@/lib/server-ai";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [], prompt = "" } = body;
    const lastUserPrompt = prompt || messages[messages.length - 1]?.content || "";

    // 1. Intercept developer inquiry
    if (isDeveloperQuery(lastUserPrompt)) {
      const devReply = getDeveloperInfoResponse(lastUserPrompt);
      return NextResponse.json({
        reply: devReply,
        engine: "Voxify Creator Intelligence",
      });
    }

    // 2. Prepare conversation history for LLM
    const formattedMsgs: { role: string; content: string }[] = [
      { role: "system", content: CHATGPT_STYLE_SYSTEM_PROMPT },
    ];

    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages.slice(-8)) {
        const role = m.role === "assistant" ? "assistant" : "user";
        formattedMsgs.push({ role, content: m.content || "" });
      }
    }

    if (!formattedMsgs.some((m) => m.role === "user" && m.content === lastUserPrompt)) {
      formattedMsgs.push({ role: "user", content: lastUserPrompt });
    }

    // 3. Try Groq completion with multi-key failover
    const keys = getGroqApiKeys();

    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      for (const model of CANDIDATE_GROQ_MODELS) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: formattedMsgs,
              temperature: 0.7,
              max_tokens: 2048,
              stream: false,
            }),
          });

          if (!res.ok) continue;
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              reply: reply.trim(),
              engine: `Groq ${model.split("/").pop()} (Key #${i + 1}/${keys.length})`,
            });
          }
        } catch (_) {
          continue;
        }
      }
    }

    // 4. Fallback if keys are busy
    return NextResponse.json({
      reply: `I understand your question about **${lastUserPrompt}**.\n\nVoxify AI operates with fast multi-turn conversational knowledge. Ask anything or try hands-free voice dictation!`,
      engine: "Voxify Knowledge Engine",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
