// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeGame();
});

function initializeGame() {
  console.log("🎮 Initializing GuessQuest...");

  // Join form handler
  const joinForm = document.getElementById("join-form");
  const playerNameInput = document.getElementById("player-name-input");

  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const playerName = playerNameInput.value.trim();

    if (playerName) {
      // Disable form during connection
      playerNameInput.disabled = true;
      joinForm.querySelector("button").disabled = true;

      window.gameSocket.joinGame(playerName);
    }
  });

  // Chat form handler
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const guess = chatInput.value.trim();

    if (guess) {
      window.gameSocket.submitGuess(guess);
      chatInput.value = "";
    }
  });

  // Auto-focus on chat input when clicking anywhere in game screen
  const gameScreen = document.getElementById("game-screen");
  gameScreen.addEventListener("click", (e) => {
    // Don't focus if clicking on input, button, or image
    if (!e.target.matches("input, button, img")) {
      chatInput.focus();
    }
  });

  // Focus on name input on page load
  playerNameInput.focus();

  // Handle visibility change (tab switching)
  document.addEventListener("visibilitychange", () => {
    if (
      !document.hidden &&
      !document.getElementById("join-screen").classList.contains("hidden")
    ) {
      playerNameInput.focus();
    }
  });

  console.log("✅ Game initialized");
}
