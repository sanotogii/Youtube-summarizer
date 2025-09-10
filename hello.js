document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById("saveButton");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const customInput = document.getElementById("customInstructionInput");
  const message = document.getElementById("message");
  const cancelButton = document.getElementById("cancel");

  // Load existing values if available
  chrome.storage.local.get(["apiKey", "customInstruction"], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.customInstruction) customInput.value = result.customInstruction;
  });

  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const custom = customInput.value.trim();
    const toSave = {};

    if (apiKey) toSave.apiKey = apiKey;
    if (custom) toSave.customInstruction = custom;

    if (Object.keys(toSave).length === 0) {
      message.textContent = "Nothing to save.";
      message.className = "error";
      message.style.display = "block";
      return;
    }

    chrome.storage.local.set(toSave, () => {
      message.textContent = "Settings saved!";
      message.className = "success";
      message.style.display = "block";
      // close popup shortly after saving for convenience
      setTimeout(() => window.close(), 800);
    });
  });

  // Close the popup when Cancel is clicked
  cancelButton.addEventListener("click", () => {
    window.close();
  });
});
