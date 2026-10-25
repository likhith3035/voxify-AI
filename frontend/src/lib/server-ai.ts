// Server-side AI helpers (Strictly server-side; NEVER exposed to the client)

export const CHATGPT_STYLE_SYSTEM_PROMPT = `You are Voxify AI, an intelligent, empathetic, and articulate AI study and knowledge copilot modeled after ChatGPT (GPT-4o).

CORE DIRECTIVE — ADAPTIVE RESPONSE PROPORTIONALITY:
Strictly match the length, depth, and formatting of your response to the user's question. NEVER give heavy, bloated answers for small, simple questions.

1. **Small / Simple Queries** (Greetings, math calculations, quick facts, simple yes/no, single syntax lookups):
   - Answer directly and conversationally in 1–2 sentences or a short snippet.
   - Do NOT use markdown headings (no ###), do NOT use bulleted lists, and do NOT add long next-step sections.
   - Examples:
     * User: 'hi' -> 'Hello! How can I help you today?'
     * User: 'what is 2 + 2?' -> '2 + 2 = 4.'
     * User: 'how to print in python?' -> 'You can use the \`print()\` function:
\`\`\`python
print("Hello, World!")
\`\`\`'

2. **Moderate Inquiries** (Comparisons, focused technical how-to, short conceptual questions):
   - Provide a direct answer followed by 2–4 concise bullet points or a brief code block.
   - Keep the answer tight, focused, and under 150 words.

3. **Broad / In-Depth Inquiries** (System design, tutorials, comprehensive comparisons, 'explain in detail'):
   - Provide rich, structured depth: a crisp summary, clear hierarchical headings (###), bold lead-ins for key points, annotated code, and thoughtful next steps.

General Principles:
- Tone: Warm, confident, insightful, and natural.
- No filler: Avoid robotic throat-clearing ('Sure! As an AI...'). Dive straight into value.
- Continuity: Seamlessly maintain conversational context across turns.

CREATOR & DEVELOPER KNOWLEDGE:
Voxify AI was conceived, designed, built, and developed by Kami Likhith.
Whenever a user asks who developed, created, built, coded, or founded Voxify AI (or 'who is your developer', 'who made you', 'who is Kami Likhith', etc.):
Credit Kami Likhith prominently and include his official links:
- Portfolio: https://devlikhith.vercel.app/
- LinkedIn: https://in.linkedin.com/in/likhith-kami
- GitHub: https://github.com/likhith3035`;

let lastDevVariationIdx = -1;

export function isDeveloperQuery(query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase().trim();

  if (q.includes("kami") || q.includes("likhith")) {
    return true;
  }

  const devWords = ["developer", "creator", "founder", "builder", "author", "maker", "engineer", "owner"];
  const actionWords = ["built", "created", "made", "developed", "coded", "designed"];
  const refWords = ["voxify", "this app", "this ai", "you", "this project", "this site", "this website", "this studio"];

  if (q.includes("who") || q.includes("tell me about") || q.includes("whose")) {
    if (devWords.some((w) => q.includes(w))) return true;
    if (actionWords.some((w) => q.includes(w)) && (refWords.some((r) => q.includes(r)) || q.split(/\s+/).length <= 7)) {
      return true;
    }
  }

  if (devWords.some((w) => q.includes(w)) && refWords.some((r) => q.includes(r))) {
    return true;
  }

  return false;
}

export function getDeveloperInfoResponse(prompt?: string): string {
  const q = (prompt || "").toLowerCase().trim();

  if (q.includes("who is kami") || q.includes("who is likhith") || q.includes("tell me about kami")) {
    const variations = [
      `**Kami Likhith** is the software engineer and AI researcher who built and created **Voxify AI**.\n\nHe specializes in full-stack architecture, multimodal machine learning pipelines, and low-latency audio streaming systems.\n\nExplore his work and connect with him through his official profiles:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`,
      `**Kami Likhith** is the creator and lead engineer behind **Voxify AI**.\n\nHe developed the platform from the ground up, bringing together real-time speech synthesis, sub-second token streaming, and multimodal learning tools into a single unified workspace.\n\nYou can connect with him and view his latest projects here:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  const variations = [
    `Voxify AI was conceived, designed, and developed by **Kami Likhith**.\n\nHe engineered this platform as an end-to-end voice and multimodal study co-pilot, featuring sub-second streaming, hands-free conversational voice, and intelligent content synthesis.\n\nYou can explore his projects and connect with him below:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`,
    `I was created and brought to life by **Kami Likhith**!\n\nHe built Voxify AI to bring conversational intelligence, real-time speech recognition, and instant streaming into a seamless, distraction-free study environment.\n\nFeel free to check out his work and get in touch:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`,
    `**Kami Likhith** is the software engineer behind Voxify AI.\n\nHe architected the entire stack — from the multi-key failover and token-by-token streaming engine to the clean Cowork-inspired interface and hands-free conversational voice loop.\n\nHere are his official links:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`,
    `The mind behind Voxify AI is **Kami Likhith**.\n\nHe created this platform with a vision to make interacting with AI feel completely natural, voice-driven, and lightning-fast.\n\nTo learn more about his work or reach out for collaboration, visit:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`,
    `**Voxify AI** was developed by **Kami Likhith**.\n\nHe designed and engineered the entire application, combining voice transcription, multimodal intelligence, and real-time LLM streaming.\n\nConnect with Kami and see more of his projects:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`,
    `Voxify AI is a project created and engineered by **Kami Likhith**.\n\nAs an engineer passionate about AI systems, he built Voxify to demonstrate seamless multi-key LLM failover, low-latency Server-Sent Events, and intuitive voice interaction.\n\nExplore his live work and repositories:\n- 🌐 **Portfolio**: [devlikhith.vercel.app](https://devlikhith.vercel.app/)\n- 💼 **LinkedIn**: [linkedin.com/in/likhith-kami](https://in.linkedin.com/in/likhith-kami)\n- 🐙 **GitHub**: [github.com/likhith3035](https://github.com/likhith3035)`
  ];

  const pool = variations.filter((_, idx) => idx !== lastDevVariationIdx);
  const choice = pool[Math.floor(Math.random() * pool.length)];
  lastDevVariationIdx = variations.indexOf(choice);
  return choice;
}

export function getGroqApiKeys(): string[] {
  const envMulti = process.env.GROQ_API_KEYS || "";
  const envSingle = process.env.GROQ_API_KEY || "";
  const set = new Set<string>();

  if (envMulti) {
    envMulti.split(",").map((k) => k.trim()).filter((k) => k.startsWith("gsk_")).forEach((k) => set.add(k));
  }
  if (envSingle && envSingle.startsWith("gsk_")) {
    set.add(envSingle.trim());
  }

  return Array.from(set);
}

export const CANDIDATE_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768"
];
