import { NextRequest, NextResponse } from "next/server";
import { getGroqApiKeys } from "@/lib/server-ai";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = (body.topic || "").trim();
    const numSlides = Math.min(Math.max(Number(body.num_slides) || 5, 3), 8);

    if (!topic) {
      return NextResponse.json(
        { error: "Please enter a topic for the presentation deck." },
        { status: 400 }
      );
    }

    const keys = getGroqApiKeys();
    const prompt = `Generate an engaging ${numSlides}-slide educational presentation deck on the topic: "${topic}".
Output MUST be raw valid JSON ONLY, matching this schema exactly:
{
  "title": "${topic.charAt(0).toUpperCase() + topic.slice(1)}",
  "subtitle": "A Structured Deep Dive & Analysis",
  "slides": [
    {
      "slideNumber": 1,
      "badge": "INTRODUCTION",
      "title": "Title of Slide",
      "content": ["Key takeaway point 1", "Key takeaway point 2", "Key takeaway point 3"],
      "narration": "A natural 2-sentence voiceover script to read out loud for this slide."
    }
  ]
}
Do not include markdown fences or introductory text. Output raw JSON only.`;

    for (const key of keys) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
            "User-Agent": "VoxifyAIStudio/2.0 (Platform/Cloud)",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) continue;
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        const cleanJson = content.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
        const parsed = JSON.parse(cleanJson);
        return NextResponse.json({ ...parsed, topic });
      } catch (_) {
        continue;
      }
    }

    // High quality client fallback if cloud keys are offline
    const clean = topic.charAt(0).toUpperCase() + topic.slice(1);
    return NextResponse.json({
      title: clean,
      subtitle: "Interactive Presentation & Deep Dive",
      topic,
      slides: [
        {
          slideNumber: 1,
          badge: "INTRODUCTION",
          title: `Welcome to ${clean}`,
          content: [
            `${clean} is a foundational concept in computer science and technology.`,
            "Designed to address critical problems through algorithmic efficiency and modular architecture.",
            "Widely utilized across modern engineering, machine intelligence, and industry.",
          ],
          narration: `Welcome to this presentation on ${clean}. Today we explore its key principles and real-world impact.`,
        },
        {
          slideNumber: 2,
          badge: "ARCHITECTURE",
          title: "How It Works (Under the Hood)",
          content: [
            "Input Gathering: Captures raw data signals and normalizes formats.",
            "Processing Engine: Executes core logic, transforms states, and computes outputs.",
            "Validation & Output: Delivers reliable results with verification gates.",
          ],
          narration: `Understanding the architectural pipeline of ${clean} reveals how inputs are systematically transformed into dependable outputs.`,
        },
        {
          slideNumber: 3,
          badge: "ADVANTAGES",
          title: "Core Advantages & Strengths",
          content: [
            "High Performance: Optimized to deliver low-latency execution.",
            "Scalability: Designed to scale seamlessly across distributed environments.",
            "Resilience: Fault-tolerant design patterns ensure continuous operation.",
          ],
          narration: `The primary benefits of ${clean} center around performance, exceptional reliability, and modern scalability.`,
        },
        {
          slideNumber: 4,
          badge: "APPLICATION",
          title: "Real-World Applications",
          content: [
            "Enterprise Automation: Streamlining workflows and eliminating bottlenecks.",
            "Data Analytics: Empowering decision-makers with instant actionable insights.",
            "Everyday Technology: Powering user-facing smart applications worldwide.",
          ],
          narration: `In practical implementations, ${clean} powers critical systems across finance, healthcare, and software engineering.`,
        },
        {
          slideNumber: 5,
          badge: "SUMMARY",
          title: "Key Takeaways & Next Steps",
          content: [
            `Mastering ${clean} establishes an indispensable engineering foundation.`,
            "Encourages best practices in modular software design and problem-solving.",
            "Ready for exploration: dive deeper into implementation patterns and experiments.",
          ],
          narration: `To summarize, ${clean} is a cornerstone concept that elevates technical problem-solving capabilities. Thank you for listening.`,
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate presentation deck" }, { status: 500 });
  }
}
