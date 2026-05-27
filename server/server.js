require('dotenv').config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const RoomManager = require("./game/RoomManager");
const redis = require("./config/redis");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../client")));

const roomManager = new RoomManager(io);

// Redis health check
redis.set('server_heartbeat', Date.now());

io.on("connection", (socket) => {
  socket.on("create-room", (name) => {
    const room = roomManager.createRoom(socket.id);
    socket.join(room.code);
    const player = room.addPlayer(socket.id, name);

    socket.emit("room-created", {
      roomCode: room.code,
      player: player,
      players: room.getPlayers()
    });
  });

  socket.on("join-room", ({ code, name }) => {
    const room = roomManager.getRoom(code);
    
    if (!room) {
      return socket.emit("room-error", "Room not found!");
    }
    
    if (room.status === 'playing') {
      return socket.emit("room-error", "Game already started!");
    }

    if (room.players.size >= 8) {
      return socket.emit("room-error", "Room is full!");
    }

    socket.join(room.code);
    const player = room.addPlayer(socket.id, name);

    socket.emit("room-joined", {
      roomCode: room.code,
      player: player,
      players: room.getPlayers()
    });

    room.updatePlayerList();
  });

  socket.on("start-game", () => {
    const room = roomManager.findRoomByPlayerId(socket.id);
    if (room && room.hostId === socket.id) {
      room.startGame();
    }
  });

  socket.on("update-room-settings", (settings) => {
    const room = roomManager.findRoomByPlayerId(socket.id);
    if (room && room.hostId === socket.id) {
      room.updateSettings(settings);
    }
  });

  socket.on("submit-guess", (guess) => {
    const room = roomManager.findRoomByPlayerId(socket.id);
    if (room) {
      room.submitGuess(socket.id, guess);
    }
  });

  socket.on("leave-room", () => {
    handlePlayerDisconnect(socket);
  });

  socket.on("disconnect", () => {
    handlePlayerDisconnect(socket);
  });
});

function handlePlayerDisconnect(socket) {
  const room = roomManager.findRoomByPlayerId(socket.id);
  if (room) {
    const remainingCount = room.removePlayer(socket.id);
    socket.leave(room.code);

    if (remainingCount === 0) {
      roomManager.removeRoom(room.code);
    } else {
      room.updatePlayerList();
    }
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`whatUsee server running on port ${PORT}`);
});
