const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const RoundManager = require("./game/roundManager");
const ScoreManager = require("./game/scoreManager");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../client")));

const gameState = {
  players: new Map(),
  roundManager: new RoundManager(),
  scoreManager: new ScoreManager(),
  currentRound: null,
  isRoundActive: false,
  correctGuessers: new Set(),
  timerInterval: null,
  roundEndingTimeout: null
};

function startNextRound() {
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  if (gameState.roundEndingTimeout) clearTimeout(gameState.roundEndingTimeout);
  
  gameState.correctGuessers.clear();
  gameState.currentRound = gameState.roundManager.startNewRound();
  
  if (!gameState.currentRound) {
    // If we run out of images, just loop them
    gameState.roundManager.imagePicker.usedImageIds.clear();
    gameState.currentRound = gameState.roundManager.startNewRound();
  }

  gameState.isRoundActive = true;
  io.emit("round-start", {
    roundNumber: gameState.currentRound.roundNumber,
    question: gameState.currentRound.question,
    imageUrl: gameState.currentRound.imageUrl,
    nextImageUrl: gameState.currentRound.nextImageUrl,
    timeRemaining: gameState.roundManager.roundDuration,
    totalDuration: gameState.roundManager.roundDuration
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

  const winnerNames = Array.from(gameState.correctGuessers).map(id => {
    const p = gameState.players.get(id);
    return p ? p.name : "Anonymous";
  });

  io.emit("round-end", {
    answer: gameState.currentRound.answer,
    correctGuessers: winnerNames
  });

  // Reset statuses and streaks for those who didn't guess
  gameState.players.forEach(p => {
    if (p.status !== 'answered') p.streak = 0;
    p.status = 'idle';
  });
  io.emit("player-list-update", Array.from(gameState.players.values()));

  // Next round auto-restart
  gameState.roundEndingTimeout = setTimeout(startNextRound, 5000);
}

io.on("connection", (socket) => {
  socket.on("join-game", (name) => {
    const player = {
      id: socket.id,
      name: name || "Guest",
      score: 0,
      streak: 0,
      status: 'idle'
    };
    gameState.players.set(socket.id, player);

    socket.emit("player-joined", {
      playerId: socket.id,
      players: Array.from(gameState.players.values()),
      isRoundActive: gameState.isRoundActive
    });

    io.emit("player-list-update", Array.from(gameState.players.values()));

    if (!gameState.isRoundActive && gameState.players.size === 1) {
      startNextRound();
    } else if (gameState.isRoundActive) {
      socket.emit("round-start", {
        roundNumber: gameState.currentRound.roundNumber,
        question: gameState.currentRound.question,
        imageUrl: gameState.currentRound.imageUrl,
        nextImageUrl: gameState.currentRound.nextImageUrl,
        timeRemaining: gameState.roundManager.getTimeRemaining(),
        totalDuration: gameState.roundManager.roundDuration
      });
    }
  });

  socket.on("submit-guess", (guess) => {
    const player = gameState.players.get(socket.id);
    if (!player || !gameState.isRoundActive || gameState.correctGuessers.has(socket.id)) return;

    const isCorrect = gameState.roundManager.validateGuess(guess, gameState.currentRound.answer);

    if (isCorrect) {
      const isFirst = gameState.correctGuessers.size === 0;
      const timeRem = gameState.roundManager.getTimeRemaining();
      const points = gameState.scoreManager.calculatePoints(isFirst, player.streak, timeRem);
      
      player.score += points;
      player.streak += 1;
      player.status = 'answered';
      gameState.correctGuessers.add(socket.id);

      socket.emit("correct-guess-self", { points, streak: player.streak });
      socket.broadcast.emit("correct-guess-others", { name: player.name, streak: player.streak });
      io.emit("player-list-update", Array.from(gameState.players.values()));

      // Check if everyone has guessed
      if (gameState.correctGuessers.size >= gameState.players.size) {
        endRound();
      }
    } else {
      player.streak = 0; // Reset streak on incorrect guess
      io.emit("chat-message", {
        playerName: player.name,
        message: guess,
        isWrong: true
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`whatUsee server running on port ${PORT}`);
});