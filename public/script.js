const MOOD_PRESETS = ["Happy", "Heartbroken", "Chill", "Romantic", "Hype", "Nostalgic", "Focused", "Sad"];

const moodInput = document.getElementById("mood");
const languageInput = document.getElementById("language");
const artistInput = document.getElementById("artist");
const extraInput = document.getElementById("extra");
const countInput = document.getElementById("count");
const countValue = document.getElementById("count-value");
const moodChips = document.getElementById("mood-chips");
const errorEl = document.getElementById("error");
const generateBtn = document.getElementById("generate-btn");
const anotherBtn = document.getElementById("another-btn");
const formSection = document.getElementById("form-section");
const resultsSection = document.getElementById("results-section");
const tracklistEl = document.getElementById("tracklist");
const API_BASE_URL = window.MIXTAPE_API_BASE_URL || "";

// Build mood preset chips
MOOD_PRESETS.forEach((m) => {
  const btn = document.createElement("button");
  btn.className = "chip";
  btn.type = "button";
  btn.textContent = m;
  btn.addEventListener("click", () => {
    moodInput.value = m;
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  });
  moodChips.appendChild(btn);
});

countInput.addEventListener("input", () => {
  countValue.textContent = countInput.value;
});

async function generate() {
  const mood = moodInput.value.trim();
  if (!mood) {
    errorEl.textContent = "Tell me a mood first — that's the one thing this tape needs.";
    return;
  }
  errorEl.textContent = "";
  generateBtn.disabled = true;
  generateBtn.innerHTML = `<span>CURATING PLAYLIST...</span>`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood,
        language: languageInput.value.trim(),
        artist: artistInput.value.trim(),
        extra: extraInput.value.trim(),
        count: Number(countInput.value),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "The tape jammed — couldn't generate right now. Try again in a moment.";
      return;
    }

    renderTracks(data.tracks || []);
    formSection.hidden = true;
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    errorEl.textContent = "The tape jammed — couldn't generate right now. Try again in a moment.";
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = `
      <span>GENERATE MIXTAPE</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `;
  }
}

function renderTracks(tracks) {
  tracklistEl.innerHTML = "";
  tracks.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "track-row";
    row.style.animationDelay = `${i * 0.08}s`;
    row.innerHTML = `
      <div class="track-num">${String(i + 1).padStart(2, "0")}</div>
      <div>
        <div class="track-title">${escapeHtml(t.title)}</div>
        <div class="track-artist">${escapeHtml(t.artist)}</div>
        <div class="track-reason">${escapeHtml(t.reason)}</div>
      </div>
    `;
    tracklistEl.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

generateBtn.addEventListener("click", generate);

anotherBtn.addEventListener("click", () => {
  resultsSection.hidden = true;
  formSection.hidden = false;
});
