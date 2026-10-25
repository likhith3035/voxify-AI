# Voxify AI Studio 🎙️⚡
> **Next-Generation Multimodal Voice AI Platform & Learning Studio**  
> *Built with Next.js (App Router, TypeScript, Tailwind CSS) + Python Flask REST API.*

---

## 🌟 Overview & Aesthetic

Voxify AI Studio blends:
1. **The Sarvam AI Aesthetic**: Luminous saffron/amber warm radiant aura, frosted glass navigation, and refined serif typography.
2. **The Cowork Studio Workspace**: Collapsible sidebar, central prompt bar with mic/attachment triggers, and bento quick action cards.

---

## 🚀 Key Modules & Working Features

### 1. 🎙️ Live Voice Dictation Studio
- **Browser-Native Speech Recognition**: Continuous, low-latency voice-to-text dictation.
- **Multilingual Support**: Supports Indian English (`en-IN`), Telugu (`te-IN`), Hindi (`hi-IN`), US English (`en-US`), Spanish (`es-ES`), and French (`fr-FR`).
- **Real-Time Audio Waveform Canvas**: Dynamic HTML5 Canvas frequency visualizer with responsive sound waves.
- **Speech Metrics**: Live word counter, character counter, speech speed (WPM), and recording duration timer.
- **1-Click AI Transformations**:
  - ✍️ **AI Grammar & Polish**: Removes filler words, fixes punctuation, and cleans text.
  - 📌 **Summary Bullets**: Extracts key bullet points and executive TL;DR.
  - 🌐 **Instant Translation**: Translates voice text into Telugu, Hindi, Spanish, etc.
  - 📊 **Convert to Slides**: Turns any spoken transcript into a multi-slide presentation deck.
  - 🔊 **Voice Read Aloud**: Plays back synthesized speech with browser speech synthesis.
  - 💾 **Export**: 1-click download as `.txt`, `.md` (Markdown), or copy to clipboard.

### 2. 📊 Dynamic AI Presentation Deck Generator
- Synthesizes structured, multi-slide educational presentations on any topic or voice prompt.
- **Interactive Slide Player**: Slide navigation (Previous / Next / jump dots / progress indicator).
- **Audio Voiceover Narration**: Automatically reads out presenter scripts and speaker notes.
- **Export & Print**: Copy presentation outline, download markdown deck, or print clean presentation slides.

### 3. 👁️ Diagram & Vision Lab
- Drag & drop or upload any architecture diagram, flowchart, textbook illustration, or formula.
- AI structural inspection report with conceptual breakdown, component mappings, and audio narration.

### 4. 🎬 YouTube Video Synthesizer
- Paste any educational YouTube URL.
- Automatically extracts closed-caption transcripts using `youtube-transcript-api`.
- Generates chapter takeaways, embedded video playback, and 1-click conversion into presentation slides.

### 5. 🧠 Topic Explorer & Wikimedia Commons Hub
- Searches encyclopedic summaries from Wikipedia REST APIs.
- Displays archival media from Wikimedia Commons.
- Recommends verified study guides and educational video resources.

### 6. 🕒 Saved Sessions History
- Stored locally in your browser (`localStorage`) so transcripts, decks, and analyses are never lost on reload.

---

## 🛠️ Architecture & Project Structure

```
voxify/
├── backend/                       # Python Flask REST API
│   ├── app.py                     # AI endpoints (OpenAI / Synthesizer, YouTube transcripts, Wikimedia)
│   ├── requirements.txt           # Python dependencies (flask, flask-cors, etc.)
│   └── .env                       # API keys (with automatic smart engine fallback)
│
└── frontend/                      # Next.js App Router (TypeScript + Tailwind CSS)
    ├── src/
    │   ├── app/                   # Next.js pages & layout
    │   ├── components/            # AudioVisualizer, VoiceStudio, SlideDeck, VisionLab, OmniInput
    │   ├── lib/api.ts             # Python REST API client with offline/demo resilience
    │   └── types/                 # TypeScript interfaces
    └── package.json
```

---

## 💻 How to Run on Windows

### Step 1: Start the Python Backend
Open a terminal in the project directory:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
> The Python API will start at: `http://127.0.0.1:5000`

### Step 2: Start the Next.js Frontend
Open a second terminal in the project directory:
```bash
cd frontend
npm install
npm run dev
```
> Open your browser and visit: **`http://localhost:3000`**

---

## 🔒 Zero-Failure Academic Demo Mode
The backend and frontend are built with intelligent fallback engines. Even if internet drops or an OpenAI API key is unavailable during an evaluation, the application gracefully synthesizes educational results without crashing.
