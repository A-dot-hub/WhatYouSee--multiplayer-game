// Chat message tracking
const messageElements = new Map();

// Auto-scroll function with smooth behavior
function scrollChatToBottom(chatMessages, smooth = true) {
  if (!chatMessages) return;

  requestAnimationFrame(() => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  });

  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 10);
}

// Add chat message
function addChatMessage(data) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message";

  if (data.isCorrect) {
    messageDiv.classList.add("correct");
  }

  if (data.isWrong) {
    messageDiv.classList.add("wrong");
  }

  messageDiv.dataset.playerId = data.playerId;
  messageDiv.dataset.timestamp = data.timestamp;

  const playerName = escapeHtml(data.playerName || "Unknown");
  const message = escapeHtml(data.message || "");

  messageDiv.innerHTML = `
        <div class="message-author">${playerName}</div>
        <div class="message-text">${message}</div>
    `;

  chatMessages.appendChild(messageDiv);

  messageElements.set(`${data.playerId}-${data.timestamp}`, messageDiv);

  scrollChatToBottom(chatMessages, true);

  if (messageElements.size > 100) {
    const firstKey = messageElements.keys().next().value;
    const oldElement = messageElements.get(firstKey);
    if (oldElement && oldElement.parentNode) {
      oldElement.parentNode.removeChild(oldElement);
    }
    messageElements.delete(firstKey);
  }
}

// Add system message
function addSystemMessage(text) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message system";
  messageDiv.dataset.timestamp = Date.now();

  const safeText = escapeHtml(text);

  messageDiv.innerHTML = `
        <div class="message-text">${safeText}</div>
    `;

  chatMessages.appendChild(messageDiv);

  scrollChatToBottom(chatMessages, true);

  const allMessages = chatMessages.querySelectorAll(".chat-message");
  if (allMessages.length > 100) {
    allMessages[0].remove();
  }
}

// Clear all messages
function clearChatMessages() {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  chatMessages.innerHTML = "";
  messageElements.clear();
}

// Escape HTML helper
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

// Check if user is at bottom of chat (for smart scrolling)
function isUserAtBottom(chatMessages) {
  if (!chatMessages) return true;

  const threshold = 50;
  return (
    chatMessages.scrollHeight -
      chatMessages.scrollTop -
      chatMessages.clientHeight <
    threshold
  );
}

// Export functions
window.addChatMessage = addChatMessage;
window.addSystemMessage = addSystemMessage;
window.clearChatMessages = clearChatMessages;
window.scrollChatToBottom = scrollChatToBottom;
