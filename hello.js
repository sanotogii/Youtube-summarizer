document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById("saveButton");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const message = document.getElementById("message");

  // Load existing key if available
  chrome.storage.local.get("apiKey", (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ apiKey }, () => {
        message.textContent = "✅ API Key saved successfully!";
        message.className = "success";
        message.style.display = "block";
      });
    } else {
      message.textContent = "⚠️ Please enter a valid API Key.";
      message.className = "error";
      message.style.display = "block";
    }
  });
});
