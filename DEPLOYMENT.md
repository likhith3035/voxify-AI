# 🚀 Voxify AI — 100% Vercel Production Deployment

Voxify AI runs **100% on Vercel** as a unified full-stack application:
- **Frontend**: Next.js 16 App Router on Global Edge CDN
- **AI Backend**: Next.js Serverless Route Handlers (`/api/chat`, `/api/chat/stream`, `/api/generate-slides`, `/api/health`)
- **Zero Cold Starts**: Sub-200ms instantaneous response
- **Zero External Server Quotas**: No Render limits, no sleeping containers, 100% free

---

## Step 1: Create a GitHub Repository & Push

1. Go to [github.com/new](https://github.com/new) and create a repository named **`voxify`** (public or private).
2. Run these commands in your project terminal:

```bash
git remote add origin https://github.com/likhith3035/voxify.git
git push -u origin main
```

*(Note: Sensitive keys in `.env` and `.env.local` are automatically blocked by `.gitignore` and never pushed).*

---

## Step 2: Deploy on Vercel (1 Single Click)

1. Go to [Vercel New Project](https://vercel.com/new).
2. Click **Import** next to your `voxify` repository.
3. Configure the settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select **`frontend`**
4. Under **Environment Variables**, add your AI keys:
   - `GROQ_API_KEY` = your Groq API key (get free key from [console.groq.com/keys](https://console.groq.com/keys))
   - `GEMINI_API_KEY` = your Google Gemini key *(optional)*
   - `OPENAI_API_KEY` = your OpenAI key *(optional)*
   - `XAI_API_KEY` = your xAI Grok key *(optional)*
5. Click **Deploy**.

In ~60 seconds, your site will be live at `https://voxify-*.vercel.app` with full voice, streaming AI chat, and dynamic presentations!
