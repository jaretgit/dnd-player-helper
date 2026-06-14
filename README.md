# Know Your Character — D&D Sheet Analyzer

Ask natural language questions about your D&D character sheet. Upload a PDF and get fast, accurate answers. Supports both D&D 5e (2014) and the 2024 Player's Handbook.

## How it works

1. Player uploads a PDF of their character sheet
2. They type a question — with as much or as little context as they like
3. The app sends both to Claude via a Vercel serverless function
4. Claude reads the sheet and answers concisely

## Local development

**Prerequisites:** Node.js 18+, an [Anthropic API key](https://console.anthropic.com)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd dnd-analyzer
npm install

# 2. Set up your API key
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# 3. Run locally (Vite dev server + Vercel functions)
npx vercel dev
```

> **Note:** Use `vercel dev` rather than `vite` for local development — it runs the `/api` serverless functions alongside the frontend. Plain `vite` won't serve the API routes.

## Deploying to Vercel

```bash
# First time
npx vercel

# Subsequent deploys
npx vercel --prod
```

Then add your API key in the Vercel dashboard:
**Project → Settings → Environment Variables → `ANTHROPIC_API_KEY`**

## Project structure

```
dnd-analyzer/
├── api/
│   └── ask.js          # Serverless function — calls Anthropic API
├── src/
│   ├── main.jsx        # React entry point
│   └── App.jsx         # Main app component
├── index.html
├── vite.config.js
├── vercel.json         # Routing config
└── .env.example
```

## Getting a PDF from D&D Beyond

1. Open your character on [dndbeyond.com](https://www.dndbeyond.com)
2. Click the **…** menu in the top-right of your character sheet
3. Select **Export PDF**
4. Save and upload the file

## Tech

- [React](https://react.dev) + [Vite](https://vitejs.dev)
- [Vercel](https://vercel.com) serverless functions
- [Anthropic Claude](https://anthropic.com) (`claude-sonnet-4-6`)
