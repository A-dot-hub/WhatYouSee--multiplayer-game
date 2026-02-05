const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const RoundManager = require("./game/roundManager");
const ScoreManager = require("./game/scoreManager");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || ["*"]
        : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "../client")));

// Health check endpoint for deployment
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    players: gameState.players.size,
    round: gameState.currentRound
      ? gameState.roundManager.currentRoundNumber
      : 0,
  });
});

// Game state
const gameState = {
  players: new Map(),
  roundManager: new RoundManager(),
  scoreManager: new ScoreManager(),
  currentRound: null,
  roundActive: false,
  correctGuessers: new Set(),
  roundInterval: null,
  recentGuesses: new Map(),
};

// Player status enum
const PlayerStatus = {
  ACTIVE: "active",
  DISCONNECTED: "disconnected",
  ANSWERED: "answered",
};

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Player joins game
  socket.on("join-game", (playerName) => {
    // Check if player is rejoining
    const existingPlayer = Array.from(gameState.players.values()).find(
      (p) => p.name === playerName && p.status === PlayerStatus.DISCONNECTED,
    );

    let player;

    if (existingPlayer) {
      // Reconnection: restore player with new socket ID
      gameState.players.delete(existingPlayer.id);
      player = {
        ...existingPlayer,
        id: socket.id,
        status: PlayerStatus.ACTIVE,
        lastSeen: Date.now(),
      };
      console.log(`${playerName} reconnected`);
    } else {
      // New player
      player = {
        id: socket.id,
        name: playerName || `Player${gameState.players.size + 1}`,
        score: 0,
        status: PlayerStatus.ACTIVE,
        lastSeen: Date.now(),
        hasAnswered: false,
      };
      console.log(`${player.name} joined the game`);
    }

    gameState.players.set(socket.id, player);

    // Send current players to new player
    socket.emit("player-joined", {
      playerId: socket.id,
      players: Array.from(gameState.players.values()),
    });

    // Broadcast new player to all others
    socket.broadcast.emit(
      "player-list-update",
      Array.from(gameState.players.values()),
    );

    // If round is active, send current round data
    if (gameState.roundActive && gameState.currentRound) {
      socket.emit("round-start", {
        imageUrl: gameState.currentRound.imageUrl,
        question: gameState.currentRound.question,
        roundNumber: gameState.roundManager.currentRoundNumber,
        timeRemaining: gameState.roundManager.getTimeRemaining(),
      });
    }
  });

  // Player submits guess
  socket.on("submit-guess", (guess) => {
    if (!gameState.roundActive || !gameState.currentRound) {
      return;
    }

    const player = gameState.players.get(socket.id);
    if (!player) return;

    // Anti-spam: check if player is spamming guesses
    const now = Date.now();
    const lastGuessTime = gameState.recentGuesses.get(socket.id) || 0;
    const timeSinceLastGuess = now - lastGuessTime;

    if (timeSinceLastGuess < 500) {
      return;
    }

    // Check if already guessed correctly this round
    if (gameState.correctGuessers.has(socket.id)) {
      return;
    }

    // Check if player already submitted answer this round
    if (player.hasAnswered) {
      socket.emit("already-answered", {
        message: "You've already submitted your answer for this round!",
      });
      return;
    }

    // Mark player as having answered
    player.hasAnswered = true;
    gameState.recentGuesses.set(socket.id, now);

    // Validate guess
    const isCorrect = gameState.roundManager.validateGuess(
      guess,
      gameState.currentRound.answer,
    );

    if (isCorrect) {
      gameState.correctGuessers.add(socket.id);
      player.status = PlayerStatus.ANSWERED;

      // Award points: 100 for first, 50 for others
      const points = gameState.correctGuessers.size === 1 ? 100 : 50;

      const oldScore = player.score;
      player.score += points;

      // Send confirmation to the player who guessed correctly
      socket.emit("correct-guess-self", {
        playerId: socket.id,
        playerName: player.name,
        points: points,
        position: gameState.correctGuessers.size,
        guess: guess,
        oldScore: oldScore,
        newScore: player.score,
      });

      // Notify all OTHER players (without showing the guess)
      socket.broadcast.emit("correct-guess-others", {
        playerId: socket.id,
        playerName: player.name,
        points: points,
        position: gameState.correctGuessers.size,
      });

      // Update scores for everyone
      io.emit("score-update", {
        players: Array.from(gameState.players.values()),
        winnerId: socket.id,
        points: points,
      });

      // If everyone has answered, end round early
      const activePlayers = Array.from(gameState.players.values()).filter(
        (p) =>
          p.status === PlayerStatus.ACTIVE ||
          p.status === PlayerStatus.ANSWERED,
      );
      if (gameState.correctGuessers.size >= activePlayers.length) {
        setTimeout(() => endRound(), 2000);
      }
    } else {
      // Wrong guess - broadcast to everyone
      io.emit("chat-message", {
        playerId: socket.id,
        playerName: player.name,
        message: guess,
        timestamp: Date.now(),
        isWrong: true,
      });
    }

    // Update player list to show answered status
    io.emit("player-list-update", Array.from(gameState.players.values()));
  });

  // Player heartbeat (for connection status)
  socket.on("heartbeat", () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      player.lastSeen = Date.now();
    }
  });

  // Player disconnects
  socket.on("disconnect", () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      console.log(`${player.name} disconnected`);

      // Mark as disconnected instead of removing immediately
      player.status = PlayerStatus.DISCONNECTED;
      player.lastSeen = Date.now();

      // Remove from correct guessers if they were in
      gameState.correctGuessers.delete(socket.id);

      // Give them 30 seconds to reconnect before removing
      setTimeout(() => {
        const stillDisconnected = gameState.players.get(socket.id);
        if (
          stillDisconnected &&
          stillDisconnected.status === PlayerStatus.DISCONNECTED
        ) {
          gameState.players.delete(socket.id);
          io.emit("player-list-update", Array.from(gameState.players.values()));
          console.log(`${player.name} removed after disconnect timeout`);
        }
      }, 30000);

      io.emit("player-list-update", Array.from(gameState.players.values()));
    }
  });
});

// Game loop functions
function startNewRound() {
  // Check if we have active players
  const activePlayers = Array.from(gameState.players.values()).filter(
    (p) => p.status === PlayerStatus.ACTIVE,
  );

  if (activePlayers.length === 0) {
    setTimeout(startNewRound, 3000);
    return;
  }

  // Clean up spam tracker
  gameState.recentGuesses.clear();

  // Reset round state
  gameState.correctGuessers.clear();

  // Reset all players' answered status and active status
  gameState.players.forEach((player) => {
    if (player.status !== PlayerStatus.DISCONNECTED) {
      player.status = PlayerStatus.ACTIVE;
      player.hasAnswered = false;
    }
  });

  gameState.currentRound = gameState.roundManager.startNewRound();

  // Check if round creation failed
  if (!gameState.currentRound) {
    console.error("Failed to start new round - check images.json");
    setTimeout(startNewRound, 5000);
    return;
  }

  gameState.roundActive = true;

  // Broadcast round start to all players
  io.emit("round-start", {
    imageUrl: gameState.currentRound.imageUrl,
    question: gameState.currentRound.question,
    roundNumber: gameState.roundManager.currentRoundNumber,
    timeRemaining: gameState.roundManager.roundDuration,
  });

  console.log(`Round ${gameState.roundManager.currentRoundNumber} started`);

  // Start countdown
  startRoundTimer();
}

function startRoundTimer() {
  // Clear any existing interval
  if (gameState.roundInterval) {
    clearInterval(gameState.roundInterval);
  }

  gameState.roundInterval = setInterval(() => {
    const timeRemaining = gameState.roundManager.getTimeRemaining();

    if (timeRemaining <= 0) {
      clearInterval(gameState.roundInterval);
      gameState.roundInterval = null;
      endRound();
    } else {
      io.emit("timer-update", timeRemaining);
    }
  }, 1000);
}

function endRound() {
  gameState.roundActive = false;

  // Clear interval if it exists
  if (gameState.roundInterval) {
    clearInterval(gameState.roundInterval);
    gameState.roundInterval = null;
  }

  // Get list of correct guessers
  const correctGuessersList = Array.from(gameState.correctGuessers).map(
    (id) => {
      const player = gameState.players.get(id);
      return player ? player.name : "Unknown";
    },
  );

  // Find top scorer
  const topScorer = Array.from(gameState.players.values())
    .filter((p) => p.status !== PlayerStatus.DISCONNECTED)
    .sort((a, b) => b.score - a.score)[0];

  // Reveal answer
  io.emit("round-end", {
    answer: gameState.currentRound.answer,
    correctGuessers: correctGuessersList,
    scores: Array.from(gameState.players.values()),
    topScorer: topScorer ? topScorer.id : null,
  });

  console.log(`Round ${gameState.roundManager.currentRoundNumber} ended`);

  // Start new round after delay
  setTimeout(startNewRound, 5000);
}

// Cleanup disconnected players periodically
setInterval(() => {
  const now = Date.now();
  gameState.players.forEach((player, socketId) => {
    if (player.status === PlayerStatus.DISCONNECTED) {
      const timeSinceLastSeen = now - player.lastSeen;
      if (timeSinceLastSeen > 60000) {
        gameState.players.delete(socketId);
        console.log(`Removed inactive player: ${player.name}`);
      }
    }
  });
}, 30000);

// Start first round after short delay
setTimeout(startNewRound, 3000);

// Get network IP addresses
function getNetworkIPs() {
  const os = require("os");
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully...");

  io.emit("server-shutdown", { message: "Server is restarting..." });

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  const networkIPs = getNetworkIPs();
  const env = process.env.NODE_ENV || "development";

  console.log("\n🎮 WhatYouSee Server Started!\n");
  console.log("┌─────────────────────────────────────────┐");
  console.log(`│ Environment: ${env.toUpperCase().padEnd(28)}│`);
  console.log(
    `│ Game loaded with ${gameState.roundManager.getTotalImages()} images         │`,
  );
  console.log("└─────────────────────────────────────────┘\n");

  console.log("🌐 Access URLs:\n");
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Local:    http://127.0.0.1:${PORT}`);

  if (networkIPs.length > 0) {
    console.log("\n📱 Network (use on mobile/other devices):");
    networkIPs.forEach((ip) => {
      console.log(`   Network:  http://${ip}:${PORT}`);
    });
  } else {
    console.log("\n⚠️  No network interface found");
    console.log("   Make sure you are connected to a network");
  }

  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│ 💡 Tip: Use the Network URL for mobile │");
  console.log("│    Ensure devices are on same network! │");
  console.log("└─────────────────────────────────────────┘\n");
});
