const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const RoundManager = require("./game/roundManager");
const ScoreManager = require("./game/scoreManager");

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../client")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

const gameState = {
  players: new Map(),
  roundManager: new RoundManager(),
  scoreManager: new ScoreManager(),
  currentRound: null,
  isRoundActive: false,
  correctGuessers: new Set(),
  timerInterval: null,
  roundEndingTimeout: null,
};

function startNextRound() {
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  if (gameState.roundEndingTimeout) clearTimeout(gameState.roundEndingTimeout);

  gameState.correctGuessers.clear();
  gameState.currentRound = gameState.roundManager.startNewRound();

  if (!gameState.currentRound) {
    gameState.roundManager.imagePicker.usedImageIds.clear();
    gameState.currentRound = gameState.roundManager.startNewRound();
  }

  gameState.isRoundActive = true;

  io.emit("round-start", {
    roundNumber: gameState.currentRound.roundNumber,
    question: gameState.currentRound.question,
    imageUrl: gameState.currentRound.imageUrl,
    timeRemaining: gameState.roundManager.roundDuration,
  });

  gameState.timerInterval = setInterval(() => {
    const remaining = gameState.roundManager.getTimeRemaining();
    io.emit("timer-update", remaining);

    if (remaining <= 0) {
      endRound();
    }
  }, 1000);
}

function endRound() {
  if (!gameState.isRoundActive) return;

  gameState.isRoundActive = false;
  clearInterval(gameState.timerInterval);

  const winnerNames = Array.from(gameState.correctGuessers).map((id) => {
    const p = gameState.players.get(id);
    return p ? p.name : "Anonymous";
  });

  io.emit("round-end", {
    answer: gameState.currentRound.answer,
    correctGuessers: winnerNames,
  });

  gameState.players.forEach((p) => (p.status = "idle"));
  io.emit("player-list-update", Array.from(gameState.players.values()));

  gameState.roundEndingTimeout = setTimeout(startNextRound, 5000);
}

io.on("connection", (socket) => {
  socket.on("join-game", (name) => {
    const player = {
      id: socket.id,
      name: name || "Guest",
      score: 0,
      status: "idle",
    };

    gameState.players.set(socket.id, player);

    socket.emit("player-joined", {
      playerId: socket.id,
      players: Array.from(gameState.players.values()),
    });

    io.emit("player-list-update", Array.from(gameState.players.values()));

    if (!gameState.isRoundActive && gameState.players.size === 1) {
      startNextRound();
    } else if (gameState.isRoundActive) {
      socket.emit("round-start", {
        roundNumber: gameState.currentRound.roundNumber,
        question: gameState.currentRound.question,
        imageUrl: gameState.currentRound.imageUrl,
        timeRemaining: gameState.roundManager.getTimeRemaining(),
      });
    }
  });

  socket.on("submit-guess", (guess) => {
    const player = gameState.players.get(socket.id);

    if (
      !player ||
      !gameState.isRoundActive ||
      gameState.correctGuessers.has(socket.id)
    )
      return;

    const isCorrect = gameState.roundManager.validateGuess(
      guess,
      gameState.currentRound.answer,
    );

    if (isCorrect) {
      const isFirst = gameState.correctGuessers.size === 0;
      const points = gameState.scoreManager.calculatePoints(isFirst);

      player.score += points;
      player.status = "answered";
      gameState.correctGuessers.add(socket.id);

      socket.emit("correct-guess-self", { points });
      socket.broadcast.emit("correct-guess-others", { name: player.name });
      io.emit("player-list-update", Array.from(gameState.players.values()));

      if (gameState.correctGuessers.size >= gameState.players.size) {
        endRound();
      }
    } else {
      io.emit("chat-message", {
        playerName: player.name,
        message: guess,
        isWrong: true,
      });
    }
  });

  socket.on("disconnect", () => {
    gameState.players.delete(socket.id);
    gameState.correctGuessers.delete(socket.id);

    io.emit("player-list-update", Array.from(gameState.players.values()));

    if (gameState.players.size === 0) {
      clearInterval(gameState.timerInterval);
      clearTimeout(gameState.roundEndingTimeout);
      gameState.isRoundActive = false;
    }
  });
});

server.listen(PORT, () => {
  console.log(`🔥 whatUsee server running on port ${PORT}`);
});
