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

  // Fallback for better compatibility
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

  // Add correct class if it's a correct guess
  if (data.isCorrect) {
    messageDiv.classList.add("correct");
  }

  // Add wrong class if explicitly marked
  if (data.isWrong) {
    messageDiv.classList.add("wrong");
  }

  messageDiv.dataset.playerId = data.playerId;
  messageDiv.dataset.timestamp = data.timestamp;

  // Escape HTML to prevent XSS
  const playerName = escapeHtml(data.playerName || "Unknown");
  const message = escapeHtml(data.message || "");

  messageDiv.innerHTML = `
        <div class="message-author">${playerName}</div>
        <div class="message-text">${message}</div>
    `;

  chatMessages.appendChild(messageDiv);

  // Store reference
  messageElements.set(`${data.playerId}-${data.timestamp}`, messageDiv);

  // Auto-scroll to bottom
  scrollChatToBottom(chatMessages, true);

  // Clean up old messages (keep last 100)
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

  // Escape HTML
  const safeText = escapeHtml(text);

  messageDiv.innerHTML = `
        <div class="message-text">${safeText}</div>
    `;

  chatMessages.appendChild(messageDiv);

  // Auto-scroll to bottom
  scrollChatToBottom(chatMessages, true);

  // Clean up old messages
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

  const threshold = 50; // pixels from bottom
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
