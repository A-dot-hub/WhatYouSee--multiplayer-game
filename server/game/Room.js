const RoundManager = require("./roundManager");
const ScoreManager = require("./scoreManager");

class Room {
  constructor(code, hostId, io) {
    this.code = code;
    this.hostId = hostId;
    this.io = io;
    this.players = new Map();
    this.status = 'lobby'; // 'lobby', 'playing'
    this.maxRounds = 5;
    
    this.roundManager = new RoundManager();
    this.scoreManager = new ScoreManager();
    this.currentRound = null;
    this.isRoundActive = false;
    this.correctGuessers = new Set();
    this.timerInterval = null;
    this.roundEndingTimeout = null;
  }

  updateSettings(settings) {
    if (this.status !== 'lobby') return;
    if (settings.rounds) {
      this.maxRounds = parseInt(settings.rounds);
      this.broadcast("room-settings-update", { rounds: this.maxRounds });
    }
  }

  addPlayer(playerId, name) {
    const player = {
      id: playerId,
      name: name || "Guest",
      score: 0,
      streak: 0,
      status: 'idle',
      isHost: playerId === this.hostId
    };
    this.players.set(playerId, player);
    return player;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.correctGuessers.delete(playerId);
    
    if (this.players.size > 0 && this.hostId === playerId) {
      const nextHost = this.players.keys().next().value;
      this.hostId = nextHost;
      const player = this.players.get(nextHost);
      if (player) player.isHost = true;
    }
    
    if (this.players.size === 0) {
      this.cleanup();
    }
    
    return this.players.size;
  }

  cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.roundEndingTimeout) clearTimeout(this.roundEndingTimeout);
  }

  startGame() {
    if (this.status !== 'lobby') return;
    this.status = 'playing';
    this.startNextRound();
  }

  startNextRound() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.roundEndingTimeout) clearTimeout(this.roundEndingTimeout);
    
    this.correctGuessers.clear();
    this.currentRound = this.roundManager.startNewRound();
    
    if (!this.currentRound) {
      this.roundManager.imagePicker.usedImageIds.clear();
      this.currentRound = this.roundManager.startNewRound();
    }

    this.isRoundActive = true;
    this.broadcast("round-start", {
      roundNumber: this.currentRound.roundNumber,
      question: this.currentRound.question,
      imageUrl: this.currentRound.imageUrl,
      nextImageUrl: this.currentRound.nextImageUrl,
      timeRemaining: this.roundManager.roundDuration,
      totalDuration: this.roundManager.roundDuration
    });

    this.timerInterval = setInterval(() => {
      const remaining = this.roundManager.getTimeRemaining();
      this.broadcast("timer-update", remaining);

      if (remaining <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  endRound() {
    if (!this.isRoundActive) return;
    this.isRoundActive = false;
    clearInterval(this.timerInterval);

    const winnerNames = Array.from(this.correctGuessers).map(id => {
      const p = this.players.get(id);
      return p ? p.name : "Anonymous";
    });

    this.broadcast("round-end", {
      answer: this.currentRound.answer,
      correctGuessers: winnerNames
    });

    this.players.forEach(p => {
      if (p.status !== 'answered') p.streak = 0;
      p.status = 'idle';
    });
    this.updatePlayerList();

    if (this.currentRound.roundNumber >= this.maxRounds) {
        this.status = 'lobby';
        this.broadcast("game-over", { players: this.getPlayers() });
        return;
    }

    this.roundEndingTimeout = setTimeout(() => this.startNextRound(), 5000);
  }

  submitGuess(playerId, guess) {
    const player = this.players.get(playerId);
    if (!player || !this.isRoundActive || this.correctGuessers.has(playerId)) return;

    const isCorrect = this.roundManager.validateGuess(guess, this.currentRound.answer);

    if (isCorrect) {
      const isFirst = this.correctGuessers.size === 0;
      const timeRem = this.roundManager.getTimeRemaining();
      const points = this.scoreManager.calculatePoints(isFirst, player.streak, timeRem);
      
      player.score += points;
      player.streak += 1;
      player.status = 'answered';
      this.correctGuessers.add(playerId);

      const socket = this.io.sockets.sockets.get(playerId);
      if (socket) {
        socket.emit("correct-guess-self", { points, streak: player.streak });
        socket.to(this.code).emit("correct-guess-others", { name: player.name, streak: player.streak });
      }
      
      this.updatePlayerList();

      if (this.correctGuessers.size >= this.players.size) {
        this.endRound();
      }
    } else {
      player.streak = 0;
      this.broadcast("chat-message", {
        playerName: player.name,
        message: guess,
        isWrong: true
      });
    }
  }

  broadcast(event, data) {
    this.io.to(this.code).emit(event, data);
  }

  updatePlayerList() {
    this.broadcast("player-list-update", Array.from(this.players.values()));
  }

  getPlayers() {
    return Array.from(this.players.values());
  }
}

module.exports = Room;
