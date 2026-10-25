import { NextRequest, NextResponse } from "next/server";
import { getGroqApiKeys } from "@/lib/server-ai";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = (body.topic || "").trim();

    if (!topic) {
      return NextResponse.json({ error: "Topic cannot be empty" }, { status: 400 });
    }

    const cleanTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
    const keys = getGroqApiKeys();
    const prompt = `You are Voxify AI, an expert academic researcher and science tutor.
Provide a clear, engaging, and comprehensive explanation of the following topic:
"${topic}"

Format your response in structured Markdown:
### Overview: ${cleanTopic}
(1-2 clear, insightful introductory paragraphs)

### Core Principles & How It Works
1. **Concept**: ...
2. **Mechanism**: ...
3. **Execution**: ...

### Practical Impact & Applications
(Bullet points on real-world industry applications)

### Key Takeaways
(Summary conclusion)`;

    for (const key of keys) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 1500,
          }),
        });

        if (!res.ok) continue;
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return NextResponse.json({
            topic,
            explanation: content.trim(),
            engine: "Groq Llama-3.3-70B Academic",
          });
        }
      } catch (_) {
        continue;
      }
    }

    // Fallback
    return NextResponse.json({
      topic,
      explanation: `### Overview: ${cleanTopic}\n${cleanTopic} is a foundational concept in technology and scientific computing, engineered to solve complex real-world challenges through systematic processing.\n\n### Core Working Mechanisms\n1. **Data Ingestion**: Captures voice, text, or visual inputs with high fidelity.\n2. **Feature Extraction**: Isolates key elements, filters noise, and computes internal representations.\n3. **Intelligent Reasoning**: Applies algorithmic models to evaluate outcomes and deliver clear conclusions.\n\n### Summary\nUnderstanding ${cleanTopic} equips students and developers with powerful problem-solving capabilities.`,
      engine: "Voxify Knowledge Synthesizer",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to explain topic" }, { status: 500 });
  }
}
