chrome.storage.local.get("tokenData", ({ tokenData }) => {
  const content = document.getElementById("content");
  if (!tokenData) return;

  const { used, limit, pct } = tokenData;
  const barClass = pct >= 88 ? "danger" : pct >= 70 ? "warn" : "";
  const statusIcon = pct >= 88 ? "🔴" : pct >= 70 ? "🟡" : "🟢";

  content.innerHTML = `
    <div class="stat-block">
      <div class="stat-row">
        <label><span class="dot"></span>Status</label>
        <span>${statusIcon} ${pct >= 88 ? "Critical" : pct >= 70 ? "Warning" : "Healthy"}</span>
      </div>
      <div class="stat-row">
        <label>Tokens Used</label>
        <span>${(used/1000).toFixed(1)}K / ${(limit/1000)}K</span>
      </div>
      <div class="bar-wrap">
        <div class="bar ${barClass}" style="width:${pct}%"></div>
      </div>
      <div class="pct-label">${pct}% of context used</div>
      <div class="stat-row" style="margin-top:8px">
        <label>Remaining (est.)</label>
        <span>~${(((limit - used) / 3.8) / 1000).toFixed(0)}K chars</span>
      </div>
    </div>

    <div class="info">
      Token count is estimated from conversation text.<br>
      Actual usage may vary by ±10%.
    </div>

    <div class="tip">
      <strong>💡 Tip:</strong> When tokens > 88%, click the 
      <strong>📋 Copy Context</strong> button on the page overlay 
      to copy recent conversation for ChatGPT.
    </div>
  `;
});
