/**
 * YouTube Gemini Summarizer - Content Script
 */

const CONFIG = {
  buttonId: "gemini-extension-btn",
  summaryId: "ai-summary-section",
  modelId: "gemini-2.5-flash-lite",
};

let currentVideoId = null;

// Add Gemini button to YouTube's action bar
function addGeminiButton() {
  if (document.getElementById(CONFIG.buttonId)) return;

  const actionsRow = document.querySelector("ytd-menu-renderer #top-level-buttons-computed");
  if (!actionsRow) return;

  const btn = document.createElement("button");
  btn.id = CONFIG.buttonId;
  btn.innerHTML = getButtonHTML();

  Object.assign(btn.style, {
    marginLeft: "8px", marginRight: "8px", padding: "6px 12px",
    background: "#f2f2f2", color: "#000", border: "none", borderRadius: "18px",
    cursor: "pointer", fontSize: "14px", fontWeight: "500",
    fontFamily: "Roboto, Arial, sans-serif",
  });

  btn.addEventListener("mouseenter", () => (btn.style.background = "#e5e5e5"));
  btn.addEventListener("mouseleave", () => (btn.style.background = "#f1f1f1"));
  btn.addEventListener("click", () => handleSummarize(btn));

  actionsRow.appendChild(btn);
}

// Handle video navigation - clear summary when video changes
function handleVideoChange() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (currentVideoId && currentVideoId !== videoId) {
    const existing = document.getElementById(CONFIG.summaryId);
    if (existing) existing.remove();
  }
  currentVideoId = videoId;
}

// Main summarize function with streaming support
async function handleSummarize(btn) {
  btn.innerHTML = getLoadingHTML();
  btn.disabled = true;
  btn.style.cursor = "not-allowed";

  // Show immediate feedback
  showSummary("🤖 Analyzing video...", false);
  const contentDiv = document.querySelector(`#${CONFIG.summaryId} div:last-child`);

  try {
    // Check extension context and get storage
    if (!chrome?.runtime?.id) {
      showSummary("Extension context lost. Please refresh the page.", true);
      return;
    }

    const result = await new Promise((resolve, reject) =>
      chrome.storage.local.get(["apiKey", "customInstruction"], (r) =>
        chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(r)
      )
    );

    if (!result.apiKey) {
      showSummary("Please save your API Key first.", true);
      return;
    }

    const prompt = result.customInstruction?.trim() || 
      "Summarize this video in clear bullet points with headers if applicable. ";

    contentDiv.textContent = "🚀 Requesting summary...";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.modelId}:streamGenerateContent?key=${result.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { fileData: { mimeType: "video/*", fileUri: window.location.href } },
              { text: prompt }
            ],
          }],
          generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
          tools: [{ googleSearch: {} }],
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullSummary = "";

    contentDiv.textContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Extract complete JSON objects
      let bracketCount = 0;
      let startIndex = -1;
      
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '{') {
          if (bracketCount === 0) startIndex = i;
          bracketCount++;
        } else if (buffer[i] === '}') {
          bracketCount--;
          if (bracketCount === 0 && startIndex !== -1) {
            try {
              const jsonData = JSON.parse(buffer.slice(startIndex, i + 1));
              const newText = jsonData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              
              if (newText) {
                fullSummary += newText;
                // Update UI in real-time
                if (typeof marked !== "undefined") {
                  contentDiv.innerHTML = marked.parse(fullSummary);
                } else {
                  contentDiv.textContent = fullSummary;
                }
              }
            } catch (e) {
              // Skip malformed JSON
            }
            buffer = buffer.slice(i + 1);
            i = -1;
            startIndex = -1;
          }
        }
      }
    }
    
    if (!fullSummary) {
      showSummary("No summary generated.", true);
    }

  } catch (err) {
    console.error("Error:", err);
    const errorMsg = err.message.includes("Extension context invalidated") 
      ? "Extension was reloaded. Please refresh the page."
      : "Failed to summarize video. Please try again.";
    showSummary(errorMsg, true);
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
  const existing = document.getElementById(CONFIG.summaryId);
  if (existing) existing.remove();

  const topRow = document.getElementById("top-row");
  if (!topRow) return;

  const section = document.createElement("div");
  section.id = CONFIG.summaryId;

  Object.assign(section.style, {
    marginTop: "16px", padding: "16px", borderRadius: "12px",
    fontFamily: "'Roboto', Arial, sans-serif", lineHeight: "1.6",
    background: isError ? "#fef2f2" : "#f8fafc",
    border: `1px solid ${isError ? "#fecaca" : "#e2e8f0"}`,
    color: isError ? "#b91c1c" : "#4b5563",
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "12px", fontWeight: "500", fontSize: "16px",
  });
  header.innerHTML = `
    <span>${isError ? "❌ Error" : "✨ AI Summary"}</span>
    <button onclick="this.parentElement.parentElement.remove()"
            style="background:none;border:none;font-size:20px;cursor:pointer;padding:4px 8px">×</button>
  `;

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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 200 200" style="vertical-align:middle;margin-right:6px;">
    <radialGradient id="loader-gradient" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
      <stop offset="0" stop-color="currentColor"></stop>
      <stop offset=".3" stop-color="currentColor" stop-opacity=".9"></stop>
      <stop offset=".6" stop-color="currentColor" stop-opacity=".6"></stop>
      <stop offset=".8" stop-color="currentColor" stop-opacity=".3"></stop>
      <stop offset="1" stop-color="currentColor" stop-opacity="0"></stop>
    </radialGradient>
    <circle transform-origin="center" fill="none" stroke="url(#loader-gradient)" stroke-width="15" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70">
      <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
    </circle>
    <circle transform-origin="center" fill="none" opacity=".2" stroke="currentColor" stroke-width="15" stroke-linecap="round" cx="100" cy="100" r="70"></circle>
  </svg>
  Generating...`;
}

// Initialize extension
const observer = new MutationObserver(() => {
  handleVideoChange();
  addGeminiButton();
});
observer.observe(document.body, { childList: true, subtree: true });
addGeminiButton();

/**
 * HTML template for the loading state button
 */
function getLoadingHTML() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 200 200" style="vertical-align:middle;margin-right:6px;">
    <radialGradient id="loader-gradient" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
      <stop offset="0" stop-color="currentColor"></stop>
      <stop offset=".3" stop-color="currentColor" stop-opacity=".9"></stop>
      <stop offset=".6" stop-color="currentColor" stop-opacity=".6"></stop>
      <stop offset=".8" stop-color="currentColor" stop-opacity=".3"></stop>
      <stop offset="1" stop-color="currentColor" stop-opacity="0"></stop>
    </radialGradient>
    <circle transform-origin="center" fill="none" stroke="url(#loader-gradient)" stroke-width="15" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70">
      <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
    </circle>
    <circle transform-origin="center" fill="none" opacity=".2" stroke="currentColor" stroke-width="15" stroke-linecap="round" cx="100" cy="100" r="70"></circle>
  </svg>
  Generating...`;
}

// Extension context validation
function isExtensionContextValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

// Monitor URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Remove existing summary when URL changes
    const existing = document.getElementById(CONFIG.summaryId);
    if (existing) existing.remove();
  }
}).observe(document, { subtree: true, childList: true });

/**
 * Initialize the extension
 * Sets up DOM observers to handle YouTube's dynamic loading and navigation
 */
function initializeExtension() {
  // Set up observer to watch for DOM changes and handle navigation
  const observer = new MutationObserver(() => {
    handleVideoChange();
    addGeminiButton();
  });
  
  // Start observing the entire document for changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Add button immediately if possible
  addGeminiButton();
}

// Start the extension when script loads
initializeExtension();
