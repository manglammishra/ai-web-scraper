# AI Web Summarizer

Paste a URL, the backend scrapes the page text, Google Gemini (free tier) summarizes it, and the React UI shows the result.

```
ai-web-scraper/
├── frontend/   React + Vite  (UI + API call)
└── backend/    Node + Express (route -> scraper -> Gemini)
```

**Flow:** `App.jsx` → `POST /api/summarize` → `routes/summarize.js` → `services/scraper.js` (fetch + clean HTML with cheerio) → `services/ai.js` (Gemini) → JSON → summary card.

## Requirements
- Node.js 18+
- Free Gemini API key from https://aistudio.google.com/apikey

## Local setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # then paste your GEMINI_API_KEY
npm run dev
```
Check it: open http://localhost:5000/health → `{"status":"ok"}`

Test the API directly:
```bash
curl -X POST http://localhost:5000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"url":"https://en.wikipedia.org/wiki/Web_scraping"}'
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm run dev
```
Open http://localhost:5173

## API
`POST /api/summarize` body `{ "url": "https://..." }`
Returns `{ "title", "summary", "charactersRead" }` or `{ "error" }` with a 4xx/5xx status.

## Deployment

### Backend on Render
1. Push the repo to GitHub.
2. Render → New → Web Service → select the repo, **Root Directory:** `backend`.
3. Build command `npm install`, start command `npm start`.
4. Environment variables: `GEMINI_API_KEY`, `GEMINI_MODEL` (optional), `CLIENT_ORIGIN=https://<your-frontend-domain>`.
5. Note the URL, e.g. `https://ai-scraper-api.onrender.com`. Test `/health`.

### Frontend on Vercel (or Netlify)
1. New Project → select the repo, **Root Directory:** `frontend` (Vite is auto-detected).
2. Environment variable: `VITE_API_URL=https://ai-scraper-api.onrender.com`.
3. Deploy, then put the final frontend URL into the backend's `CLIENT_ORIGIN` and redeploy the backend.

Render's free tier sleeps when idle, so the first request can take ~30-60 s.

## Design notes (good for interviews)
- **Separation of concerns:** route handles HTTP, scraper handles HTML, ai handles the model.
- **Scraping:** cheerio strips scripts, nav, footer, etc.; prefers `<main>`/`<article>`; text capped at 15k characters to stay within free-tier limits.
- **Security:** API key only on the server (`.env` is git-ignored); URL validation plus a block on localhost/private IPs (SSRF guard); CORS limited to the frontend origin.
- **Limitations:** no JavaScript-rendered pages (would need Puppeteer/Playwright), no bot-protection bypass, no rate limiting or caching yet.

## Ideas to extend
Summary length selector, caching by URL, rate limiting (`express-rate-limit`), copy button, history of past summaries.
