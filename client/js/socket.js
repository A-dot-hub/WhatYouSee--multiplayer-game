// Socket connection
const socket = io({
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 20000,
});

// Game state
const gameState = {
  playerId: null,
  playerName: null,
  currentRound: null,
  players: [],
  roundActive: false,
  hasAnsweredThisRound: false,
};

// Prevent duplicate event listeners
let eventListenersAttached = false;

// Heartbeat interval
let heartbeatInterval = null;

// Socket event listeners
socket.on("connect", () => {
  console.log("✅ Connected to server");

  // Start heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    socket.emit("heartbeat");
  }, 15000); // Every 15 seconds

  // Rejoin if we have a player name (reconnection)
  if (gameState.playerName) {
    console.log("🔄 Reconnecting as:", gameState.playerName);
    socket.emit("join-game", gameState.playerName);
    addSystemMessage("Reconnected to server ✓");
  }
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected from server:", reason);

  // Clear heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (reason === "io server disconnect") {
    // Server disconnected us, try to reconnect
    socket.connect();
  }

  addSystemMessage("Connection lost. Reconnecting...");
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  addSystemMessage("Connection error. Retrying...");
});

socket.on("reconnect", (attemptNumber) => {
  console.log("🔄 Reconnected after", attemptNumber, "attempts");
  addSystemMessage("Reconnected successfully! ✓");
});

socket.on("reconnect_failed", () => {
  console.error("❌ Failed to reconnect");
  addSystemMessage("Failed to reconnect. Please refresh the page.");
});

// Attach event listeners only once
function attachSocketListeners() {
  if (eventListenersAttached) return;
  eventListenersAttached = true;

  socket.on("player-joined", (data) => {
    gameState.playerId = data.playerId;
    gameState.players = data.players;
    console.log("🎮 Joined game as:", gameState.playerId);

    // Switch to game screen
    document.getElementById("join-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");

    // Update UI
    updateScoreboard(data.players);
    addSystemMessage(`Welcome to GuessQuest! 🎉`);

    // Show help on first join
    if (window.checkFirstTimePlayer) {
      window.checkFirstTimePlayer();
    }
  });

  socket.on("player-list-update", (players) => {
    gameState.players = players;
    updateScoreboard(players);
  });

  socket.on("round-start", (data) => {
    gameState.roundActive = true;
    gameState.currentRound = data;
    gameState.hasAnsweredThisRound = false; // Reset for new round
    console.log("🎯 Round started:", data);

    // Update UI
    displayRoundStart(data);
    hideRoundEndOverlay();
  });

  socket.on("timer-update", (timeRemaining) => {
    updateTimer(timeRemaining);
  });

  socket.on("chat-message", (data) => {
    addChatMessage(data);

    // Show wrong feedback if it's the current player
    if (data.playerId === gameState.playerId && data.isWrong) {
      if (window.showWrongFeedback) {
        window.showWrongFeedback();
      }
    }
  });

  socket.on("correct-guess-self", (data) => {
    console.log("✅ You guessed correctly!", data);

    gameState.hasAnsweredThisRound = true;

    addChatMessage({
      playerId: data.playerId,
      playerName: data.playerName,
      message: data.guess,
      timestamp: Date.now(),
      isCorrect: true,
    });

    addSystemMessage(`🎉 You guessed correctly! (+${data.points} points)`);

    // Show visual feedback
    if (window.showCorrectFeedback) {
      window.showCorrectFeedback();
    }

    // Disable input after correct answer
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
      chatInput.disabled = true;
      chatInput.placeholder = "Waiting for round to end...";
    }
  });

  socket.on("correct-guess-others", (data) => {
    console.log("👏 Someone guessed correctly:", data);

    addSystemMessage(
      `${data.playerName} guessed correctly! (+${data.points} points)`,
    );
  });

  socket.on("score-update", (data) => {
    gameState.players = data.players;
    updateScoreboard(data.players);

    // Animate score change if we have the data
    if (data.winnerId && data.points) {
      const winner = data.players.find((p) => p.id === data.winnerId);
      if (winner && window.animateScoreChange) {
        const oldScore = winner.score - data.points;
        window.animateScoreChange(
          data.winnerId,
          oldScore,
          winner.score,
          data.points,
        );
      }
    }
  });

  socket.on("round-end", (data) => {
    gameState.roundActive = false;
    gameState.hasAnsweredThisRound = false;
    console.log("⏱️ Round ended:", data);
    showRoundEndOverlay(data);
  });

  socket.on("already-answered", (data) => {
    console.log("⚠️ Already answered:", data.message);
    if (window.showAlreadyAnsweredMessage) {
      window.showAlreadyAnsweredMessage();
    }
  });

  socket.on("server-shutdown", (data) => {
    console.log("🔄 Server shutdown:", data.message);
    addSystemMessage(data.message);
  });
}

// Call this immediately
attachSocketListeners();

// Helper functions
function joinGame(playerName) {
  gameState.playerName = playerName;
  socket.emit("join-game", playerName);
}

function submitGuess(guess) {
  if (!gameState.roundActive || !guess.trim()) {
    return;
  }

  // Client-side check for already answered
  if (gameState.hasAnsweredThisRound) {
    if (window.showAlreadyAnsweredMessage) {
      window.showAlreadyAnsweredMessage();
    }
    return;
  }

  socket.emit("submit-guess", guess.trim());
}

// Export for use in other files
window.gameSocket = {
  joinGame,
  submitGuess,
  getGameState: () => gameState,
  socket: socket, // Expose socket for direct access if needed
};
