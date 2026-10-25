export type ActiveTab = 
  | "chat"
  | "voice" 
  | "slides" 
  | "vision" 
  | "video" 
  | "knowledge" 
  | "history";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  engine?: string;
  isStreaming?: boolean;
}

export interface SlideItem {
  slideNumber: number;
  badge?: string;
  title: string;
  content: string[];
  narration: string;
}

export interface SlideDeck {
  title: string;
  subtitle: string;
  topic?: string;
  slides: SlideItem[];
}

export interface ExploreImage {
  title: string;
  thumbnail: string;
  url: string;
}

export interface ExploreVideo {
  title: string;
  url: string;
}

export interface ExploreResponse {
  topic: string;
  explanation: string;
  images: ExploreImage[];
  videos: ExploreVideo[];
}

export interface SavedSession {
  id: string;
  title: string;
  type: "chat" | "voice" | "slides" | "vision" | "video";
  timestamp: string;
  preview: string;
  content: string;
  messages?: ChatMessage[];
}
