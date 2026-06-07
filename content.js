// Claude Token Tracker - Content Script
// Estimates tokens from DOM and shows overlay UI

(function () {
  if (window.__claudeTrackerInit) return;
  window.__claudeTrackerInit = true;

  // ─── Constants ────────────────────────────────────────────────────────────
  const MODEL_LIMITS = {
    "claude-opus":   200000,
    "claude-sonnet": 200000,
    "claude-haiku":  200000,
    "default":       200000
  };
  const WARN_THRESHOLD  = 0.70;  // yellow at 70%
  const DANGER_THRESHOLD = 0.88; // red at 88%
  const AVG_CHARS_PER_TOKEN = 3.8;

  // ─── State ────────────────────────────────────────────────────────────────
  let totalTokens  = 0;
  let contextLimit = MODEL_LIMITS.default;
  let observer     = null;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function estimateTokens(text) {
    return Math.ceil((text || "").length / AVG_CHARS_PER_TOKEN);
  }

  function extractAllMessages() {
    // Claude.ai DOM selectors (as of 2025)
    const selectors = [
      '[data-testid="human-turn-content"]',
      '[data-testid="ai-turn-content"]',
      '.human-turn',
      '.ai-turn',
      '[class*="HumanTurn"]',
      '[class*="AITurn"]',
      '[class*="human_turn"]',
      '[class*="ai_turn"]',
      'div[data-test-render-count]',
      '.prose'
    ];

    let allText = "";
    let found = false;

    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        els.forEach(el => { allText += el.innerText + " "; });
        found = true;
      }
    }

    // Fallback: grab all visible paragraph content in the chat area
    if (!found) {
      const chatArea = document.querySelector('main') || document.body;
      allText = chatArea.innerText;
    }

    return allText;
  }

  function detectModelLimit() {
    const pageText = document.title + " " + document.body.innerText.slice(0, 2000);
    if (pageText.includes("opus"))   return MODEL_LIMITS["claude-opus"];
    if (pageText.includes("haiku"))  return MODEL_LIMITS["claude-haiku"];
    return MODEL_LIMITS.default;
  }

  function getUsagePct() {
    return Math.min(totalTokens / contextLimit, 1.0);
  }

  // ─── Context Export ────────────────────────────────────────────────────────
  function buildContextSummary() {
    const turns = [];
    
    // Try to get structured turns
    const humanTurns = document.querySelectorAll('[data-testid="human-turn-content"], .human-turn, [class*="HumanTurn"]');
    const aiTurns    = document.querySelectorAll('[data-testid="ai-turn-content"], .ai-turn, [class*="AITurn"]');

    if (humanTurns.length > 0) {
      const maxTurns = 10; // last 10 exchanges
      const start = Math.max(0, humanTurns.length - maxTurns);
      for (let i = start; i < humanTurns.length; i++) {
        if (humanTurns[i]) turns.push("USER: " + humanTurns[i].innerText.trim());
        if (aiTurns[i])    turns.push("ASSISTANT: " + (aiTurns[i].innerText.trim().slice(0, 800)) + (aiTurns[i].innerText.length > 800 ? "...[truncated]" : ""));
      }
    } else {
      // Fallback: grab last portion of page text
      const all = extractAllMessages();
      turns.push("CONVERSATION CONTEXT:\n" + all.slice(-4000));
    }

    const header = `[Context from Claude - Token limit approaching: ${totalTokens.toLocaleString()}/${contextLimit.toLocaleString()} tokens used]
Continue this conversation. Here is the recent context:

`;
    return header + turns.join("\n\n");
  }

  // ─── UI ───────────────────────────────────────────────────────────────────
  function createOverlay() {
    if (document.getElementById("ctt-overlay")) return;

    const div = document.createElement("div");
    div.id = "ctt-overlay";
    div.innerHTML = `
      <div id="ctt-inner">
        <div id="ctt-header">
          <span id="ctt-icon">🔢</span>
          <span id="ctt-label">Tokens</span>
          <button id="ctt-toggle" title="Minimize">−</button>
        </div>
        <div id="ctt-body">
          <div id="ctt-bar-wrap">
            <div id="ctt-bar"></div>
          </div>
          <div id="ctt-stats">
            <span id="ctt-used">0</span> / <span id="ctt-limit">200K</span>
            <span id="ctt-pct">(0%)</span>
          </div>
          <button id="ctt-copy-btn">📋 Copy Context for ChatGPT</button>
          <div id="ctt-copied-msg">✅ Copied!</div>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    // Toggle minimize
    let minimized = false;
    document.getElementById("ctt-toggle").addEventListener("click", () => {
      minimized = !minimized;
      document.getElementById("ctt-body").style.display = minimized ? "none" : "block";
      document.getElementById("ctt-toggle").textContent = minimized ? "+" : "−";
    });

    // Copy context button
    document.getElementById("ctt-copy-btn").addEventListener("click", () => {
      const ctx = buildContextSummary();
      navigator.clipboard.writeText(ctx).then(() => {
        const msg = document.getElementById("ctt-copied-msg");
        msg.style.display = "block";
        setTimeout(() => { msg.style.display = "none"; }, 2500);
      });
    });

    // Make draggable
    makeDraggable(div);
  }

  function updateOverlay() {
    const el_used  = document.getElementById("ctt-used");
    const el_limit = document.getElementById("ctt-limit");
    const el_pct   = document.getElementById("ctt-pct");
    const el_bar   = document.getElementById("ctt-bar");
    const el_inner = document.getElementById("ctt-inner");
    if (!el_used) return;

    const pct = getUsagePct();
    const pctInt = Math.round(pct * 100);

    el_used.textContent  = totalTokens >= 1000 ? (totalTokens / 1000).toFixed(1) + "K" : totalTokens;
    el_limit.textContent = (contextLimit / 1000) + "K";
    el_pct.textContent   = `(${pctInt}%)`;
    el_bar.style.width   = `${pctInt}%`;

    // Color coding
    el_bar.className = "";
    el_inner.className = "";
    if (pct >= DANGER_THRESHOLD) {
      el_bar.classList.add("ctt-danger");
      el_inner.classList.add("ctt-pulse");
      showAlert(pctInt);
    } else if (pct >= WARN_THRESHOLD) {
      el_bar.classList.add("ctt-warn");
      el_inner.classList.remove("ctt-pulse");
    } else {
      el_bar.classList.add("ctt-ok");
      el_inner.classList.remove("ctt-pulse");
    }

    // Save to storage for popup
    chrome.storage.local.set({ tokenData: { used: totalTokens, limit: contextLimit, pct: pctInt } });
  }

  let alertShown = false;
  function showAlert(pct) {
    if (alertShown) return;
    if (pct >= 88) {
      alertShown = true;
      const banner = document.createElement("div");
      banner.id = "ctt-alert-banner";
      banner.innerHTML = `⚠️ <strong>Claude context is ${pct}% full!</strong> Click 📋 Copy Context to save and continue in ChatGPT. <button onclick="this.parentNode.remove()">✕</button>`;
      document.body.prepend(banner);
      setTimeout(() => { if (banner.parentNode) banner.remove(); alertShown = false; }, 8000);
    }
  }

  function makeDraggable(el) {
    let isDragging = false, startX, startY, origX, origY;
    const header = el.querySelector("#ctt-header");
    header.style.cursor = "move";
    header.addEventListener("mousedown", e => {
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = el.getBoundingClientRect();
      origX = rect.left; origY = rect.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", e => {
      if (!isDragging) return;
      el.style.left   = (origX + e.clientX - startX) + "px";
      el.style.top    = (origY + e.clientY - startY) + "px";
      el.style.right  = "auto";
      el.style.bottom = "auto";
    });
    document.addEventListener("mouseup", () => { isDragging = false; });
  }

  // ─── Core Loop ────────────────────────────────────────────────────────────
  function recalculate() {
    contextLimit = detectModelLimit();
    const text   = extractAllMessages();
    totalTokens  = estimateTokens(text);
    updateOverlay();
  }

  function init() {
    createOverlay();
    recalculate();

    // Watch DOM for new messages
    observer = new MutationObserver(() => {
      clearTimeout(window._cttDebounce);
      window._cttDebounce = setTimeout(recalculate, 600);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // Wait for page to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 1500);
  }
})();
