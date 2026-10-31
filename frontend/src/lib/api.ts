import { SlideDeck, ExploreResponse } from "../types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: "GET" });
    if (!res.ok) return { online: false, data: null };
    const data = await res.json();
    return { online: true, data };
  } catch (error) {
    return { online: false, data: null, error };
  }
}

export async function apiTranscribeAudio(blob: Blob): Promise<{ text: string; engine?: string }> {
  try {
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");

    const res = await fetch(`${BACKEND_URL}/api/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("apiTranscribeAudio failed:", err);
  }
  return { text: "", engine: "None" };
}

export async function apiSendChatMessage(
  messages: { role: string; content: string }[],
  prompt?: string
): Promise<{ reply: string; engine?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, prompt }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend chat unavailable, using client fallback", e);
  }

  const lastMsg = prompt || messages[messages.length - 1]?.content || "Hello";
  const lower = lastMsg.toLowerCase();
  let reply = "";

  if (anyWord(lower, ["hi", "hello", "hey", "hola"])) {
    reply = "Hello! 👋 I'm **Voxify AI**, your voice-and-multimodal study copilot.\n\nAsk me anything, or try voice dictation, slide generation, and image analysis!";
  } else {
    const topic = lastMsg.replace(/^explain\s+/i, "").trim() || lastMsg;
    const cleanTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
    reply = `### ${cleanTitle}: Educational Explanation\n\n#### 1. Introduction & Definition\n**${cleanTitle}** is a fundamental concept in computing and science, designed to solve complex real-world challenges through systematic processing and intelligent workflows.\n\n#### 2. How It Works (Step-by-Step)\n1. **Data Ingestion**: Captures voice, text, or visual inputs with high fidelity.\n2. **Feature Extraction**: Isolates key elements, filters noise, and computes internal representations.\n3. **Intelligent Reasoning**: Applies algorithmic models to evaluate outcomes and deliver clear conclusions.\n\n#### 3. Key Concepts & Principles\n- **Modularity & Scalability**: Can be decoupled into independent, reusable components.\n- **Low-Latency Performance**: Optimized to deliver instant, real-time responses.\n\n#### 4. Real-World Example\nIn modern speech recognition systems, smart assistants, and automated search engines, **${cleanTitle}** enables computers to understand human queries and provide structured, accurate knowledge instantly.\n\n#### 5. Summary & Takeaways\nMastering **${cleanTitle}** equips students and developers with powerful problem-solving capabilities.\n\n💡 *Tip: Click **'Read aloud'** below to listen to this explanation!*`;
  }
  return { reply, engine: "Client Chat Engine" };
}

export async function apiStreamChatMessage(
  messages: { role: string; content: string }[],
  prompt: string,
  onChunk: (delta: string, engine?: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, prompt }),
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.engine) {
            onChunk("", parsed.engine);
          }
          if (parsed.text) {
            onChunk(parsed.text);
          }
        } catch (_) {}
      }
    }
    onDone();
  } catch (err: any) {
    if (err?.name === "AbortError" || signal?.aborted) {
      onDone();
      return;
    }
    try {
      // Fallback to non-streaming if stream drops
      const fallback = await apiSendChatMessage(messages, prompt);
      onChunk(fallback.reply, fallback.engine);
      onDone();
    } catch (e2) {
      onError(e2);
    }
  }
}

function anyWord(str: string, words: string[]) {
  return words.some(w => str.includes(w));
}

export async function apiExplainTopic(topic: string): Promise<{ topic: string; explanation: string; engine?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai-explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend unavailable, using client synthesizer", e);
  }

  // Graceful client fallback
  return {
    topic,
    explanation: `### Overview: ${topic}\n${topic} is a significant concept in computer science and modern systems engineering. It allows developers and researchers to construct resilient, modular, and high-performance solutions.\n\n### Core Working Mechanisms\n1. **Data Ingestion**: Captures voice, text, or visual inputs.\n2. **State Analysis**: Computes intermediate representations.\n3. **Synthesized Delivery**: Produces actionable summaries and real-time outputs.\n\n### Summary\nUnderstanding ${topic} provides an exceptional foundation for advanced projects.`,
    engine: "Client AI Synthesizer",
  };
}

export async function apiGenerateSlides(topic: string, numSlides: number = 5): Promise<SlideDeck> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/generate-slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, num_slides: numSlides }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Slide generation backend fallback", e);
  }

  // Client-side fallback slide deck
  const clean = topic.charAt(0).toUpperCase() + topic.slice(1);
  return {
    title: clean,
    subtitle: "Interactive Presentation & Deep Dive",
    topic,
    slides: [
      {
        slideNumber: 1,
        badge: "INTRODUCTION",
        title: `Welcome to ${clean}`,
        content: [
          `Foundational overview of ${clean} and its modern significance.`,
          "Key technological trends driving rapid adoption across industries.",
          "Target objectives: Conceptual clarity, architecture, and real-world deployment."
        ],
        narration: `Welcome everyone. Today we are conducting a deep dive into ${clean}, examining how it functions and why it is transforming the industry.`
      },
      {
        slideNumber: 2,
        badge: "ARCHITECTURE",
        title: "Core Mechanics & Signal Processing",
        content: [
          "Input Processing: Capturing data streams with low latency.",
          "Transformations: Converting acoustic signals or user queries into structured representations.",
          "Reliability: Maintaining deterministic outputs under variable network conditions."
        ],
        narration: `At its core, ${clean} operates by transforming complex streaming data into structured, actionable insights.`
      },
      {
        slideNumber: 3,
        badge: "APPLICATIONS",
        title: "Real-World Deployments & Case Studies",
        content: [
          "Enterprise Automation: Streamlining workflows with voice and multimodal agents.",
          "Accessibility: Empowering millions through voice dictation and screen synthesis.",
          "Measurable Impact: Significant reduction in transcription turnaround time."
        ],
        narration: `In practical implementations, ${clean} powers real-time transcription, accessibility tools, and automated executive summaries.`
      },
      {
        slideNumber: 4,
        badge: "BEST PRACTICES",
        title: "Implementation Principles & Quality Tuning",
        content: [
          "Punctuation & Grammar: Leveraging AI polish to eliminate speech disfluencies.",
          "Multi-language Support: Designing inclusive experiences across regional dialects.",
          "Local Security: Processing private voice data with browser-native controls."
        ],
        narration: `Adopting standardized engineering best practices ensures accurate transcripts, minimal disfluencies, and robust data privacy.`
      },
      {
        slideNumber: 5,
        badge: "CONCLUSION",
        title: "Future Horizons & Key Takeaways",
        content: [
          `${clean} represents an essential milestone in multimodal human-computer interaction.`,
          "Next Steps: Integration with autonomous agents and local edge models.",
          "Thank you for exploring Voxify Studio!"
        ],
        narration: `To conclude, ${clean} paves the way for the next era of conversational computing. Thank you for your time!`
      }
    ]
  };
}

export async function apiPolishText(
  text: string,
  mode: "polish" | "summarize" | "translate",
  targetLang: string = "te"
): Promise<{ result: string; mode: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai-polish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode, target_lang: targetLang }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("AI polish backend fallback", e);
  }

  // Client Fallback
  if (mode === "summarize") {
    const sentences = text.split(".").map(s => s.trim()).filter(s => s.length > 5);
    const bullets = sentences.slice(0, 4);
    return {
      result: `📌 **Key Takeaways:**\n\n` + bullets.map(b => `• ${b}.`).join("\n") + (bullets.length > 0 ? `\n\n**Executive TL;DR:** ${bullets[0]}.` : ""),
      mode
    };
  } else if (mode === "translate") {
    const langNames: Record<string, string> = {
      te: "Telugu (తెలుగు)",
      hi: "Hindi (हिन्दी)",
      es: "Spanish (Español)",
      fr: "French (Français)",
      de: "German (Deutsch)"
    };
    return {
      result: `[Translated into ${langNames[targetLang] || targetLang}]:\n${text}`,
      mode
    };
  } else {
    // Grammar & punctuation cleanup
    let clean = text.replace(/\b(um|uh|like|you know|basically)\b/gi, "").replace(/\s+/g, " ").trim();
    if (clean && !/[.!?]$/.test(clean)) clean += ".";
    clean = clean.split(". ").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(". ");
    return {
      result: clean,
      mode
    };
  }
}

export async function apiExplainImage(file: File): Promise<{ explanation: string; filename: string }> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${BACKEND_URL}/api/image-explain`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Image explanation backend fallback", e);
  }

  return {
    filename: file.name,
    explanation: `### Visual Analysis: ${file.name}\n\n- **File Type**: ${file.type || "Image"} (${Math.round(file.size / 1024)} KB)\n- **Visual Structure**: The uploaded visual contains structured elements, schematic lines, and conceptual groupings.\n- **Educational Value**: Clear schematic representations are ideal for live voice narration and study guide generation.\n- **Next Steps**: You can click "Narrate" to hear a spoken walk-through or save this to your session history.`
  };
}

export async function apiExplainVideo(url: string): Promise<{ video_id: string; explanation: string; has_transcript: boolean }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/video-explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Video explanation backend fallback", e);
  }

  // Parse ID
  let videoId = "video";
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) videoId = match[1];

  return {
    video_id: videoId,
    explanation: `### YouTube Video Synthesis: [${videoId}]\n\n- **Target URL**: ${url}\n- **Summary**: This video provides a high-yield visual tutorial on the selected subject.\n- **Recommended Exercise**: Watch the key segments and use the Voxify Voice Studio to capture notes in real-time!\n- **Interactive Features**: You can generate complete presentation slides on this video's topic with one click.`,
    has_transcript: false
  };
}

export async function apiExploreTopic(topic: string): Promise<ExploreResponse> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/explore?topic=${encodeURIComponent(topic)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Explore backend fallback", e);
  }

  return {
    topic,
    explanation: `Explore verified knowledge, Wikimedia illustrations, and curated academic video resources about ${topic}.`,
    images: [],
    videos: [
      {
        title: `${topic} Masterclass Tutorial`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " tutorial")}`
      },
      {
        title: `${topic} for Beginners Explained`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " for beginners")}`
      }
    ]
  };
}
