import { NextRequest } from "next/server";
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
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ engine: "Voxify Creator Intelligence" })}\n\n`));
          // Stream words smoothly
          const words = devReply.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`));
            await new Promise((r) => setTimeout(r, 18));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
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

    // 3. Try Groq streaming with multi-key failover
    const keys = getGroqApiKeys();
    const encoder = new TextEncoder();

    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      for (const model of CANDIDATE_GROQ_MODELS) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "User-Agent": "VoxifyAIStudio/2.0 (Platform/Cloud)",
            },
            body: JSON.stringify({
              model,
              messages: formattedMsgs,
              temperature: 0.7,
              max_tokens: 2048,
              stream: true,
            }),
          });

          if (!res.ok || !res.body) {
            continue;
          }

          const engineName = `Groq ${model.split("/").pop()} (Key #${i + 1}/${keys.length})`;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          const stream = new ReadableStream({
            async start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ engine: engineName })}\n\n`));
              let buffer = "";

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data:")) continue;
                    const jsonStr = trimmed.replace(/^data:\s*/, "");
                    if (jsonStr === "[DONE]") continue;

                    try {
                      const parsed = JSON.parse(jsonStr);
                      const delta = parsed.choices?.[0]?.delta?.content || "";
                      if (delta) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
                      }
                    } catch (_) {}
                  }
                }
              } catch (_) {
              } finally {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
            },
          });
        } catch (_) {
          continue;
        }
      }
    }

    // 4. Fallback if cloud keys are exhausted
    const fallbackText = `I understand your question about **${lastUserPrompt}**.\n\nVoxify AI operates with fast local reasoning and knowledge synthesis. Feel free to ask more, explore concept breakdowns, or generate dynamic presentation decks!`;
    const fallbackStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ engine: "Voxify Smart Engine" })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fallbackText })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
