const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

const appendMessage = (sender, text) => {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
};

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  input.value = "";

  // Simulasi dummy balasan bot (placeholder)
  setTimeout(() => {
    appendMessage("bot", "Gemini is thinking... (this is dummy response)");
  }, 1000);

  fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: userMessage }),
  }).then((response) => {
    if (!response.ok) {
      console.error(`HTTP error: status: ${response.status}`);
      return response.text().then((text) => {
        throw new Error(`HTTP error: ${response.status}, Response: ${text}`);
      });
    }
    return response.json();
  }).then((data) => {
    appendMessage("bot", data.output);
  }).catch((error) => {
    console.error("Error sending message: ", error);
    appendMessage("bot", "Error: Could not get a response.");
  });
});
