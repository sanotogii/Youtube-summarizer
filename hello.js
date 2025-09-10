/**
 * Settings popup controller for the YouTube Gemini Summarizer extension
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM references
  const saveButton = document.getElementById("saveButton");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const customInput = document.getElementById("customInstructionInput");
  const message = document.getElementById("message");
  const cancelButton = document.getElementById("cancel");

  // Track originally-loaded values to detect real changes (including clearing).
  let originalApiKey = "";
  let originalCustom = "";

  // Load stored settings and populate inputs.
  chrome.storage.local.get(["apiKey", "customInstruction"], (result) => {
    originalApiKey = result.apiKey ?? "";
    originalCustom = result.customInstruction ?? "";

    apiKeyInput.value = originalApiKey;
    customInput.value = originalCustom;
  });

  // Save handler
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const custom = customInput.value.trim();
    const toSave = {};

    // No-op detection: if nothing changed, surface a message and return.
    if (apiKey === originalApiKey && custom === originalCustom) {
      message.textContent = "Nothing to save.";
      message.className = "error";
      message.style.display = "block";
      return;
    }

    // Persist only changed keys. Include empty strings to allow clearing values.
    if (apiKey !== originalApiKey) toSave.apiKey = apiKey;
    if (custom !== originalCustom) toSave.customInstruction = custom;

    chrome.storage.local.set(toSave, () => {
      message.textContent = "Settings saved!";
      message.className = "success";
      message.style.display = "block";
      // Close popup shortly after saving for convenience.
      setTimeout(() => window.close(), 800);
    });
  });

  // Cancel closes the popup without saving.
  cancelButton.addEventListener("click", () => {
    window.close();
  });
});
