// Create button
const button = document.createElement("button");
button.innerText = "Click Me";
button.style.position = "fixed";
button.style.bottom = "20px";
button.style.right = "20px";
button.style.zIndex = "9999";
button.style.padding = "10px 15px";
button.style.backgroundColor = "#4CAF50";
button.style.color = "white";
button.style.border = "none";
button.style.borderRadius = "8px";
button.style.cursor = "pointer";

// Add click action
button.addEventListener("click", () => {
  alert("Button clicked!");
});

// Add to page
document.body.appendChild(button);
