# 🔢 Claude Token Tracker

A Chrome / Microsoft Edge browser extension that monitors your Claude conversation's token usage in real-time and lets you export context when the limit is near — so you can continue seamlessly in ChatGPT or any other AI tool.

---

## ✨ Features

- **Live token counter** — updates after every message automatically
- **Visual progress bar** — color-coded by usage level
  - 🟢 Green — Safe (0–69%)
  - 🟡 Yellow — Warning (70–87%)
  - 🔴 Red + Pulse — Critical (88%+)
- **Alert banner** — full-page warning at 88% usage
- **📋 Copy Context button** — copies last 10 exchanges in ChatGPT-ready format
- **Draggable widget** — reposition anywhere on screen
- **Popup stats** — click the extension icon for a detailed summary
- **Works on claude.ai** — Chrome and Edge both supported

---

## 📁 Project Structure

```
claude-token-tracker/
├── manifest.json      # Extension config (Manifest V3)
├── content.js         # Core logic — token estimation + overlay UI
├── overlay.css        # Styles for the floating widget and alert banner
├── popup.html         # Extension popup layout
├── popup.js           # Popup stats logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🛠️ Installation (Chrome & Edge)

> No web store needed. Load directly as an unpacked extension.

### Step 1 — Download & Extract

Download the ZIP file and extract it to a permanent folder on your system.

```
Example: C:\Users\YourName\extensions\claude-token-tracker\
```

> ⚠️ Do NOT delete this folder after installing — Chrome/Edge loads from it every time.

### Step 2 — Open Extensions Page

| Browser | URL |
|---------|-----|
| Google Chrome | `chrome://extensions` |
| Microsoft Edge | `edge://extensions` |

### Step 3 — Enable Developer Mode

Toggle **Developer mode** ON (top-right corner of the extensions page).

### Step 4 — Load the Extension

1. Click **"Load unpacked"**
2. Select the extracted folder (the one containing `manifest.json`)
3. The extension will appear in your toolbar

### Step 5 — Open Claude

Navigate to [https://claude.ai](https://claude.ai) — the token tracker widget will appear in the bottom-right corner automatically.

---

## 🖥️ How to Use

### Floating Widget (on claude.ai)

| Action | Result |
|--------|--------|
| View progress bar | See token usage at a glance |
| Click `−` button | Minimize the widget |
| Drag the header | Reposition the widget anywhere |
| Click `📋 Copy Context for ChatGPT` | Copies last 10 messages to clipboard |

### Copy Context Format

When you click **📋 Copy Context**, the clipboard gets:

```
[Context from Claude - Token limit approaching: 142K/200K tokens used]
Continue this conversation. Here is the recent context:

USER: <your last message>

ASSISTANT: <Claude's last response>

USER: ...
```

Paste this directly into ChatGPT, Gemini, or any other AI to continue the conversation.

### Extension Popup

Click the extension icon in your browser toolbar to see:
- Current token usage (K format)
- Context limit
- Usage percentage with color-coded bar
- Estimated remaining characters
- Tips for when to copy context

---

## ⚙️ Technical Details

### Token Estimation

Claude's API does not expose real-time token counts publicly. This extension **estimates** tokens from conversation text using:

```
tokens ≈ total_characters / 3.8
```

| Accuracy | ~85–90% |
|----------|---------|
| Method | Character-length estimation |
| Chars per token | 3.8 (avg for English + code) |

> Actual usage may vary by ±10–15% depending on language and code content.

### Context Limits Used

| Model | Limit |
|-------|-------|
| Claude Opus | 200,000 tokens |
| Claude Sonnet | 200,000 tokens |
| Claude Haiku | 200,000 tokens |

### Permissions Required

| Permission | Reason |
|------------|--------|
| `activeTab` | Read conversation content on claude.ai |
| `storage` | Save token stats for popup display |
| `scripting` | Inject overlay into the page |
| `host_permissions: claude.ai` | Scope extension only to Claude |

---

## 🐛 Troubleshooting

**Widget not appearing on claude.ai**
- Reload the claude.ai tab after installing
- Make sure Developer Mode is ON
- Check `chrome://extensions` → extension should show "Enabled"

**Token count shows 0**
- Wait a few seconds after page load
- Start or continue a conversation — the counter triggers on DOM changes

**Copy button not working**
- Browser may block clipboard in some contexts
- Try clicking inside the page first, then click Copy

**Extension disappeared after browser restart**
- This happens if you moved or deleted the extension folder
- Keep the folder in a permanent location and reload it

---

## 🔮 Possible Future Improvements

- [ ] Detect model name automatically from page UI
- [ ] Per-message token breakdown tooltip
- [ ] Export full conversation as `.txt` / `.md` file
- [ ] Custom threshold settings
- [ ] Support for other AI platforms (Gemini, Copilot)

---

## 📄 License

MIT License — free to use, modify, and share.

---

## 👤 Author

Built for personal DevOps learning workflow.  
GitHub: [github.com/rajendrajat](https://github.com/rajendrajat)

---

> 💡 **Pro tip:** Pin the extension icon to your toolbar for quick access to stats popup. Right-click the extensions puzzle icon → Find "Claude Token Tracker" → click the pin icon.
