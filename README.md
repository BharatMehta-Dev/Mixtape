# Mixtape Generator

A real standalone website: enter a mood, language, and artist, and it generates
an AI-curated tracklist styled like a mixtape.

## 1. Get an API key
1. Go to https://openrouter.ai/ and create an API key

## 2. Set up the project
```bash
npm install
cp .env.example .env
```
Open `.env` and paste your key:
```
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxx
```

## 3. Run it locally
```bash
npm start
```
Open http://localhost:3000 in your browser. That's it — fully working, AI included.

## 4. Deploy it online
GitHub Pages can host the static frontend, but it cannot run `server.js`. The
backend must live on Render, and the frontend must call that Render URL.

### A. Push the project to GitHub
1. Create a new GitHub repository
2. Push this project to it

### B. Deploy the backend on Render
1. In Render, create a new **Web Service** and connect the GitHub repo
2. Use these settings:
	- Build command: `npm install`
	- Start command: `npm start`
3. Add environment variable: `OPENROUTER_API_KEY`
4. Deploy and copy the Render URL, for example `https://your-app.onrender.com`

### C. Point the frontend to Render
The frontend now reads the backend URL from a single config line in
`public/index.html`:

```js
window.MIXTAPE_API_BASE_URL = "https://your-app.onrender.com";
```

Replace that URL with your real Render backend URL. The request in
`public/script.js` will automatically use it.

### D. Deploy the frontend on GitHub Pages
1. Go to your GitHub repository settings
2. Open **Pages**
3. Publish the site from the `main` branch and the `/public` folder, or use a
	`gh-pages` branch containing the contents of `public`
4. Save and wait for the GitHub Pages URL to appear

### E. Test it
Open the GitHub Pages link, submit the form, and confirm it calls the Render
backend successfully.

## Why the key lives on the server, not the frontend
The browser never sees your API keys. `script.js` only talks to `/api/generate`
on your own server, and `server.js` is the only place that holds the real key
and calls OpenRouter. Never put an API key directly in frontend/browser code —
anyone can open dev tools and steal it.

## Files
- `server.js` — Express backend, calls OpenRouter securely
- `public/index.html` — page structure
- `public/style.css` — mixtape/cassette styling
- `public/script.js` — form handling, calls your backend, renders results
- `.env.example` — copy to `.env` and add your real key there (never commit `.env`)
