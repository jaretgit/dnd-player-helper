import { useState, useRef, useCallback } from "react";

// ── Design tokens ──────────────────────────────────────────────
// Palette: deep dungeon ink, aged parchment mid-tone, dragon-gold accent,
// crimson-health red, muted slate for secondary text.
// Type: 'Cinzel' (display — classical Roman letterforms, restraint required),
// 'Crimson Text' (body — warm old-style serif), system-ui for UI chrome.
// Signature: the d20 "roll" animation on the ask button — when you submit a
// question the button face flips through faces before landing, nodding to the
// tactile ritual every player knows.

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:        #1a1612;
    --parchment:  #f0e8d8;
    --parch-mid:  #ddd0b8;
    --parch-dark: #c4b49a;
    --gold:       #b8860b;
    --gold-light: #d4a017;
    --crimson:    #8b1a1a;
    --slate:      #5a5248;
    --white:      #faf7f2;
  }

  html, body, #root {
    height: 100%;
    overflow: hidden;
  }

  body {
    background-color: var(--ink);
    background-image:
      radial-gradient(ellipse at 20% 10%, #2a1f0e 0%, transparent 50%),
      radial-gradient(ellipse at 80% 90%, #1f1208 0%, transparent 50%);
    color: var(--parchment);
    font-family: 'Crimson Text', Georgia, serif;
    font-size: 18px;
    line-height: 1.6;
  }

  #root {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* ── Scrollable content area ── */
  .scroll-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 16px 16px;
    -webkit-overflow-scrolling: touch;
  }

  /* ── Sticky input footer ── */
  .input-footer {
    flex-shrink: 0;
    width: 100%;
    background: linear-gradient(to bottom, transparent, var(--ink) 20%);
    padding: 12px 16px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .input-footer .card {
    margin-bottom: 0;
    width: 100%;
    max-width: 640px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 640px;
    margin-bottom: 24px;
  }

  .header-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(18px, 3.5vw, 24px);
    font-weight: 700;
    color: var(--parchment);
    letter-spacing: 0.02em;
    line-height: 1.2;
  }

  .header-title span {
    color: var(--gold-light);
  }

  .header-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.7;
  }

  .header-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  /* ── Divider ── */
  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 640px;
    margin: 0 auto 32px;
    color: var(--gold);
    font-size: 14px;
    opacity: 0.6;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--gold), transparent);
  }

  /* ── Card ── */
  .card {
    background: var(--parchment);
    border-radius: 4px;
    padding: 32px;
    width: 100%;
    max-width: 640px;
    color: var(--ink);
    border: 1px solid var(--parch-mid);
    box-shadow:
      0 2px 4px rgba(0,0,0,0.3),
      0 8px 32px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.4);
    margin-bottom: 24px;
    position: relative;
  }

  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 4px;
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  .card-label {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
  }

  /* ── Upload button ── */
  .upload-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 16px 20px;
    border: 2px solid var(--parch-dark);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    text-align: center;
  }

  .upload-btn:hover:not(:disabled) {
    border-color: var(--gold);
    background: rgba(184, 134, 11, 0.06);
  }

  .upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .upload-btn-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  /* ── Upload loading state ── */
  .upload-reading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    color: var(--slate);
    font-size: 15px;
    font-style: italic;
  }

  /* ── File loaded state ── */
  .file-loaded {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(184, 134, 11, 0.08);
    border: 1px solid var(--parch-dark);
    border-radius: 4px;
  }

  .file-loaded-icon { font-size: 22px; }

  .file-loaded-info { flex: 1; min-width: 0; }

  .file-loaded-name {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-loaded-size {
    font-size: 13px;
    color: var(--slate);
  }

  .file-clear-btn {
    background: none;
    border: none;
    color: var(--slate);
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    line-height: 1;
    border-radius: 2px;
    transition: color 0.15s;
    flex-shrink: 0;
  }
  .file-clear-btn:hover { color: var(--crimson); }

  /* ── Sheet collapsed bar ── */
  .sheet-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 640px;
    padding: 10px 14px;
    background: rgba(184,134,11,0.08);
    border: 1px solid rgba(184,134,11,0.25);
    border-radius: 4px;
    margin-bottom: 16px;
    animation: fadeUp 0.3s ease;
  }

  .sheet-bar-icon { font-size: 16px; flex-shrink: 0; }

  .sheet-bar-name {
    flex: 1;
    font-family: 'Cinzel', serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--parch-mid);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sheet-bar-change {
    background: none;
    border: none;
    font-family: 'Crimson Text', serif;
    font-size: 14px;
    color: var(--gold);
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    flex-shrink: 0;
  }
  .sheet-bar-change:hover { color: var(--gold-light); }

  /* ── DDB Helper ── */
  .ddb-helper-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Crimson Text', serif;
    font-size: 15px;
    color: var(--gold);
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: 0;
    margin-top: 14px;
    display: inline-block;
  }
  .ddb-helper-toggle:hover { color: var(--gold-light); }

  .ddb-helper {
    margin-top: 16px;
    padding: 16px;
    background: rgba(184,134,11,0.07);
    border-left: 3px solid var(--gold);
    border-radius: 0 4px 4px 0;
    font-size: 15px;
    color: var(--slate);
    line-height: 1.7;
  }

  .ddb-helper strong {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink);
    display: block;
    margin-bottom: 8px;
  }

  .ddb-helper ol {
    padding-left: 20px;
  }

  .ddb-helper li { margin-bottom: 4px; }

  /* ── Question field ── */
  .question-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .question-input {
    flex: 1;
    border: 1px solid var(--parch-dark);
    border-radius: 4px;
    padding: 12px 14px;
    font-family: 'Crimson Text', serif;
    font-size: 18px;
    color: var(--ink);
    background: var(--white);
    line-height: 1.4;
    transition: border-color 0.2s;
    outline: none;
  }
  .question-input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(184,134,11,0.12);
  }
  .question-input::placeholder { color: var(--parch-dark); font-style: italic; }

  /* ── Roll button (the signature element) ── */
  .roll-btn {
    position: relative;
    width: 52px;
    height: 52px;
    border-radius: 4px;
    border: 2px solid var(--gold);
    background: var(--ink);
    cursor: pointer;
    overflow: hidden;
    flex-shrink: 0;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .roll-btn:hover:not(:disabled) {
    border-color: var(--gold-light);
    box-shadow: 0 0 12px rgba(184,134,11,0.35);
  }

  .roll-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .roll-btn-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }

  .roll-btn.rolling .roll-btn-face {
    animation: diceRoll 0.6s ease forwards;
  }

  @keyframes diceRoll {
    0%   { transform: rotateY(0deg);   opacity: 1; }
    20%  { transform: rotateY(90deg);  opacity: 0; }
    40%  { transform: rotateY(180deg); opacity: 0; }
    60%  { transform: rotateY(270deg); opacity: 0.5; }
    80%  { transform: rotateY(340deg); opacity: 0.8; }
    100% { transform: rotateY(360deg); opacity: 1; }
  }

  /* ── Answer ── */
  .answer-card {
    background: var(--parchment);
    border-radius: 4px;
    padding: 28px 32px;
    width: 100%;
    max-width: 640px;
    color: var(--ink);
    border: 1px solid var(--parch-mid);
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
    animation: fadeUp 0.35s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .answer-label {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .answer-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--parch-mid);
  }

  .answer-body {
    font-size: 18px;
    line-height: 1.75;
    color: var(--ink);
    white-space: pre-wrap;
  }

  .answer-body strong { color: var(--crimson); }

  /* ── Error ── */
  .error-card {
    background: #fdf0f0;
    border: 1px solid #e8b4b4;
    border-left: 3px solid var(--crimson);
    border-radius: 4px;
    padding: 16px 20px;
    width: 100%;
    max-width: 640px;
    color: var(--crimson);
    font-size: 16px;
  }

  /* ── Loading ── */
  .loading-row {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--parch-dark);
    font-style: italic;
    font-size: 16px;
    width: 100%;
    max-width: 640px;
    margin-bottom: 8px;
  }

  .rune-spin {
    display: inline-block;
    font-size: 22px;
    animation: runespin 1.2s linear infinite;
  }

  @keyframes runespin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── History ── */
  .history-item {
    border-top: 1px solid var(--parch-mid);
    padding-top: 20px;
    margin-top: 20px;
  }

  .history-q {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    color: var(--slate);
    margin-bottom: 8px;
    font-weight: 600;
  }

  .history-a {
    font-size: 17px;
    color: var(--ink);
    line-height: 1.7;
    white-space: pre-wrap;
  }

  /* ── Clear history ── */
  .clear-btn {
    background: none;
    border: 1px solid var(--parch-dark);
    border-radius: 4px;
    padding: 8px 16px;
    font-family: 'Crimson Text', serif;
    font-size: 15px;
    color: var(--slate);
    cursor: pointer;
    margin-top: 16px;
    transition: border-color 0.2s, color 0.2s;
    display: block;
    margin-left: auto;
  }
  .clear-btn:hover { border-color: var(--crimson); color: var(--crimson); }

  /* ── Example questions ── */
  .examples {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .example-chip {
    background: none;
    border: 1px solid var(--parch-dark);
    border-radius: 20px;
    padding: 5px 14px;
    font-family: 'Crimson Text', serif;
    font-size: 14px;
    color: var(--slate);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .example-chip:hover {
    border-color: var(--gold);
    color: var(--ink);
    background: rgba(184,134,11,0.06);
  }

  @media (max-width: 480px) {
    .card { padding: 20px 16px; }
    .answer-card { padding: 20px 16px; }
  }
`;

const EXAMPLE_QUESTIONS = [
  "What's my spell save DC?",
  "Can I cast two spells in one turn?",
  "What's my passive Perception?",
  "How many attacks do I get?",
  "What's my best skill?",
  "What are my resistances?",
];

const D20_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [character, setCharacter] = useState(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [ddbOpen, setDdbOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [d20Face, setD20Face] = useState("🎲");
  const fileInputRef = useRef(null);
  const latestAnswerRef = useRef(null);

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(",")[1]);
      r.onerror = () => reject(new Error("Could not read file."));
      r.readAsDataURL(file);
    });

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF — other file types aren't supported.");
      return;
    }
    setError(null);
    setUploading(true);
    setPdfFile(file);
    try {
      const b64 = await readFileAsBase64(file);
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: b64 }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Could not read character sheet.");
      }
      const data = await response.json();
      setCharacter(data.character);
    } catch (err) {
      setError(err.message || "Could not read that file. Please try again.");
      setPdfFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const clearFile = () => {
    setPdfFile(null);
    setCharacter(null);
    setError(null);
    setUploading(false);
    setHistory([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const animateRoll = () =>
    new Promise((resolve) => {
      setRolling(true);
      let i = 0;
      const interval = setInterval(() => {
        setD20Face(D20_FACES[Math.floor(Math.random() * D20_FACES.length)]);
        i++;
        if (i >= 6) {
          clearInterval(interval);
          setD20Face("🎲");
          setRolling(false);
          resolve();
        }
      }, 100);
    });

  const ask = async () => {
    if (!character) { setError("Upload your character sheet first."); return; }
    if (!question.trim()) { setError("Ask a question first."); return; }
    setError(null);
    setLoading(true);
    await animateRoll();

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `API error ${response.status}`);
      }

      const data = await response.json();
      const answer = data.answer || "No response.";

      setHistory((prev) => [...prev, { q: question.trim(), a: answer }]);
      setQuestion("");
      // Scroll the top of the new answer into view after render
      setTimeout(() => {
        latestAnswerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="scroll-area">

      <header className="header">
        <span className="header-icon">🎲</span>
        <div>
          <h1 className="header-title">Know Your <span>Character</span></h1>
          <p className="header-eyebrow">D&amp;D 5e &amp; 2024</p>
        </div>
      </header>

      {/* Hidden file input — always present */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* ── Sheet loaded: collapsed bar ── */}
      {pdfFile && character && !uploading && (
        <div className="sheet-bar">
          <span className="sheet-bar-icon">📄</span>
          <span className="sheet-bar-name">
            {character.name
              ? `${character.name} — ${character.class || ""} ${character.level || ""}`.trim()
              : pdfFile.name}
          </span>
          <button className="sheet-bar-change" onClick={clearFile}>Change</button>
        </div>
      )}

      {/* ── No sheet: full upload card ── */}
      {!pdfFile && !character && !uploading && (
        <div className="card">
          <p className="card-label">Character Sheet</p>
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="upload-btn-icon">📜</span>
            Choose character sheet PDF
          </button>
          <button className="ddb-helper-toggle" onClick={() => setDdbOpen((v) => !v)}>
            {ddbOpen ? "Hide instructions" : "How do I get a PDF from D&D Beyond?"}
          </button>
          {ddbOpen && (
            <div className="ddb-helper">
              <strong>Exporting from D&amp;D Beyond</strong>
              <ol>
                <li>Open your character on <em>dndbeyond.com</em></li>
                <li>Click the <strong>…</strong> menu in the top-right of your character sheet</li>
                <li>Select <strong>Export PDF</strong></li>
                <li>Save the file, then upload it here</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* ── Uploading state ── */}
      {uploading && (
        <div className="card">
          <div className="upload-reading">
            <span className="rune-spin">✦</span>
            Studying your character sheet…
          </div>
        </div>
      )}

      {/* ── Answer history ── */}
      {history.length > 0 && (
        <div className="answer-card">
          <p className="answer-label">The Oracle Speaks</p>
          {history.map((item, i) => (
            <div
              key={i}
              className={i > 0 ? "history-item" : ""}
              ref={i === history.length - 1 ? latestAnswerRef : null}
            >
              <p className="history-q">{item.q}</p>
              <p className="history-a">{item.a}</p>
            </div>
          ))}
          <button className="clear-btn" onClick={() => setHistory([])}>Clear answers</button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="loading-row">
          <span className="rune-spin">✦</span>
          Consulting the arcane archives…
        </div>
      )}

      {/* ── Error ── */}
      {error && <div className="error-card">{error}</div>}

    </div>{/* end scroll-area */}

    {/* ── Sticky input footer ── */}
    <div className="input-footer">
      <div className="card">
        <p className="card-label">Ask anything</p>
        <div className="question-row">
          <input
            className="question-input"
            type="text"
            placeholder="e.g. We're fighting a vampire — can I use my Channel Divinity?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className={`roll-btn${rolling ? " rolling" : ""}`}
            onClick={ask}
            disabled={loading || !character}
            title="Ask"
            aria-label="Ask"
          >
            <span className="roll-btn-face">{d20Face}</span>
          </button>
        </div>

        {/* Example chips — only before first question */}
        {history.length === 0 && (
          <div className="examples">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                className="example-chip"
                onClick={() => setQuestion(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
