require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// API Key for OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn(
    "\n⚠️  WARNING: OPENROUTER_API_KEY is not set in process.env." +
    "\nPlease create a .env file (see .env.example) and add your OPENROUTER_API_KEY=sk-or-...\n"
  );
} else {
  console.log("\n✅ Loaded API Key for OpenRouter.");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// POST /api/generate
app.post("/api/generate", async (req, res) => {
  try {
    const { mood, language, artist, extra, count } = req.body;

    if (!mood || !mood.trim()) {
      return res.status(400).json({ error: "Mood is required." });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "Server is missing OPENROUTER_API_KEY. Add it to your .env file and restart the server.",
      });
    }

    const safeCount = Math.min(Math.max(Number(count) || 15, 5), 30);

    const prompt = `You are a music curator making a personalized mixtape.

Mood: ${mood}
Preferred language(s) for songs: ${language || "any"}
Favorite/requested artist: ${artist || "no preference, pick freely"}
Other details: ${extra || "none"}

The listener asked for up to ${safeCount} songs. Return as many REAL, genuinely fitting songs as you can, up to ${safeCount} — only include a song if it actually exists and actually matches the mood/language/artist brief well. Never invent fake songs or fake artists just to hit the number; a shorter list of real, well-matched songs is better than padding with anything that doesn't fit. If the requested artist doesn't have enough songs that truly fit, mix in other real artists in the same language/mood to fill it out.

For each song give a short, warm, specific one-sentence reason it belongs on this tape (not generic — reference mood or lyric feeling).

Respond with ONLY a raw JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "tracks": [
    {"title": "Song Title", "artist": "Artist Name", "reason": "short reason"}
  ]
}`;

    const openRouterModel = "openai/gpt-4o-mini";

    console.log(`Sending request to OpenRouter API (Model: ${openRouterModel})...`);

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": `http://localhost:${PORT}`,
        "X-Title": "Mixtape Generator",
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          {
            role: "system",
            content: "You are an expert music curator. Always output valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: Math.min(4000, 400 + safeCount * 100),
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("OpenRouter API error:", aiRes.status, errText);
      return res.status(502).json({
        error: `OpenRouter API Error (${aiRes.status}): ${errText}. If this mentions a missing model endpoint, set OPENROUTER_MODEL to a valid OpenRouter model id like openai/gpt-4o-mini and restart the server.`,
      });
    }

    const data = await aiRes.json();
    const responseText = data.choices?.[0]?.message?.content || "";

    // Clean Markdown code blocks if present
    let clean = responseText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    // Extract JSON substring if extra text exists
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", responseText);
      return res.status(502).json({ error: "The AI response couldn't be parsed. Please try again." });
    }

    res.json({ tracks: parsed.tracks || [] });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong generating the mixtape." });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎧 Mixtape Generator is running at http://localhost:${PORT}`);
});
