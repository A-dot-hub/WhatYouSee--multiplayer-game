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

let eventListenersAttached = false;
let heartbeatInterval = null;

// Socket event listeners
socket.on("connect", () => {
  console.log("✅ Connected to server");

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    socket.emit("heartbeat");
  }, 15000);

  if (gameState.playerName) {
    console.log("🔄 Reconnecting as:", gameState.playerName);
    socket.emit("join-game", gameState.playerName);
    addSystemMessage("Reconnected to server ✓");
  }
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected from server:", reason);

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (reason === "io server disconnect") {
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

    document.getElementById("join-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");

    updateScoreboard(data.players);
    addSystemMessage(`Welcome to WhatYouSee! 🎉`);

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
    gameState.hasAnsweredThisRound = false;
    console.log("🎯 Round started:", data);

    displayRoundStart(data);
    hideRoundEndOverlay();
  });

  socket.on("timer-update", (timeRemaining) => {
    updateTimer(timeRemaining);
  });

  socket.on("chat-message", (data) => {
    addChatMessage(data);

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

    if (window.showCorrectFeedback) {
      window.showCorrectFeedback();
    }

    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
      chatInput.disabled = true;
      chatInput.placeholder = "Waiting for round to end...";
    }
  });

  socket.on("correct-guess-others", (data) => {
    console.log("👍 Someone guessed correctly:", data);

    addSystemMessage(
      `${data.playerName} guessed correctly! (+${data.points} points)`,
    );
  });

  socket.on("score-update", (data) => {
    gameState.players = data.players;
    updateScoreboard(data.players);

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
  socket: socket,
};
