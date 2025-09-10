/**
 * YouTube Gemini Summarizer - Content Script
 */

const CONFIG = {
  buttonId: "gemini-extension-btn",
  summaryId: "ai-summary-section",
  modelId: "gemini-2.5-flash-lite",
};

// Add Gemini button
function addGeminiButton() {
  if (document.getElementById(CONFIG.buttonId)) return;

  const actionsRow = document.querySelector(
    "ytd-menu-renderer #top-level-buttons-computed",
  );
  if (!actionsRow) return;

  const btn = document.createElement("button");
  btn.id = CONFIG.buttonId;
  btn.innerHTML = getButtonHTML();

  Object.assign(btn.style, {
    marginLeft: "8px",
    marginRight: "8px",
    padding: "6px 12px",
    background: "#f2f2f2",
    color: "#000",
    border: "none",
    borderRadius: "18px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "Roboto, Arial, sans-serif",
  });

  // Events
  btn.addEventListener("mouseenter", () => (btn.style.background = "#e5e5e5"));
  btn.addEventListener("mouseleave", () => (btn.style.background = "#f1f1f1"));
  btn.addEventListener("click", () => handleSummarize(btn));

  actionsRow.appendChild(btn);
}

// Handle summarize click
async function handleSummarize(btn) {
  btn.innerHTML = getLoadingHTML();
  btn.disabled = true;
  btn.style.cursor = "not-allowed";

  try {
    const apiKey = await new Promise((resolve) =>
      chrome.storage.local.get("apiKey", (result) => resolve(result.apiKey)),
    );

    if (!apiKey) {
      showSummary("Please save your API Key first.", true);
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.modelId}:streamGenerateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  fileData: {
                    mimeType: "video/*",
                    fileUri: window.location.href,
                  },
                },
                {
                  text: "Summarize this video in clear bullet points with headers if applicable.",
                },
              ],
            },
          ],
          generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
          tools: [{ googleSearch: {} }],
        }),
      },
    );

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const summary = data
      .map((chunk) => chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "")
      .join("");

    showSummary(summary || "No summary generated.", !summary);
  } catch (err) {
    console.error("Error:", err);
    showSummary("Failed to summarize video. Please try again.", true);
  } finally {
    resetButton(btn);
  }
}

// Reset button to original state
function resetButton(btn) {
  btn.innerHTML = getButtonHTML();
  btn.disabled = false;
  btn.style.cursor = "pointer";
}

// Show summary UI
function showSummary(text, isError = false) {
  // Remove existing
  const existing = document.getElementById(CONFIG.summaryId);
  if (existing) existing.remove();

  const topRow = document.getElementById("top-row");
  if (!topRow) return;

  const section = document.createElement("div");
  section.id = CONFIG.summaryId;

  Object.assign(section.style, {
    marginTop: "16px",
    padding: "16px",
    borderRadius: "12px",
    fontFamily: "'Roboto', Arial, sans-serif",
    lineHeight: "1.6",
    background: isError ? "#fef2f2" : "#f8fafc",
    border: `1px solid ${isError ? "#fecaca" : "#e2e8f0"}`,
    color: isError ? "#b91c1c" : "#4b5563",
  });

  // Header with close button
  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    fontWeight: "500",
    fontSize: "16px",
  });

  header.innerHTML = `
    <span>${isError ? "❌ Error" : "✨ AI Summary"}</span>
    <button onclick="this.parentElement.parentElement.remove()"
            style="background:none;border:none;font-size:20px;cursor:pointer;padding:4px 8px">×</button>
  `;

  // Content
  const content = document.createElement("div");
  content.style.fontSize = "14px";
  content.style.padding = "16px";

  if (!isError && typeof marked !== "undefined") {
    try {
      content.innerHTML = marked.parse(text);
    } catch (e) {
      content.textContent = text;
    }
  } else {
    content.textContent = text;
  }

  section.appendChild(header);
  section.appendChild(content);
  topRow.parentNode.insertBefore(section, topRow.nextSibling);
}

// HTML templates
function getButtonHTML() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:6px;">
    <path d="M12 3L13.4302 8.31181C13.6047 8.96 13.692 9.28409 13.8642 9.54905C14.0166 9.78349 14.2165 9.98336 14.451 10.1358C14.7159 10.308 15.04 10.3953 15.6882 10.5698L21 12L15.6882 13.4302C15.04 13.6047 14.7159 13.692 14.451 13.8642C14.2165 14.0166 14.0166 14.2165 13.8642 14.451C13.692 14.7159 13.6047 15.04 13.4302 15.6882L12 21L10.5698 15.6882C10.3953 15.04 10.308 14.7159 10.1358 14.451C9.98336 14.2165 9.78349 14.0166 9.54905 13.8642C9.28409 13.692 8.96 13.6047 8.31181 13.4302L3 12L8.31181 10.5698C8.96 10.3953 9.28409 10.308 9.54905 10.1358C9.78349 9.98336 9.98336 9.78349 10.1358 9.54905C10.308 9.28409 10.3953 8.96 10.5698 8.31181L12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>Summarize`;
}

function getLoadingHTML() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 200 200" style="vertical-align:middle;margin-right:6px;">
    <circle transform-origin="center" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70" opacity="0.4">
      <animateTransform type="rotate" attributeName="transform" dur="2" values="360;0" repeatCount="indefinite"/>
    </circle>
  </svg>Generating...`;
}

// Initialize
const observer = new MutationObserver(addGeminiButton);
observer.observe(document.body, { childList: true, subtree: true });
addGeminiButton();
