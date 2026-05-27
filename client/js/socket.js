
// Initialize window.gameSocket early to prevent TypeErrors in other scripts
window.gameSocket = {
  socket: null,
  createRoom: (name) => {
    if (!window.gameSocket.socket) return console.error("Socket not initialized");
    console.log("Emitting create-room for", name);
    window.gameSocket.socket.emit("create-room", name);
  },
  joinRoom: (code, name) => {
    if (!window.gameSocket.socket) return console.error("Socket not initialized");
    console.log("Emitting join-room for", code, name);
    window.gameSocket.socket.emit("join-room", { code, name });
  },
  startGame: () => {
    if (!window.gameSocket.socket) return console.error("Socket not initialized");
    console.log("Emitting start-game");
    window.gameSocket.socket.emit("start-game");
  },
  leaveRoom: () => {
    if (!window.gameSocket.socket) return console.error("Socket not initialized");
    console.log("Emitting leave-room");
    window.gameSocket.socket.emit("leave-room");
  },
  guess: (val) => {
    if (!window.gameSocket.socket) return console.error("Socket not initialized");
    window.gameSocket.socket.emit("submit-guess", val);
  }
};

// Now initialize the socket
try {
  const socket = io({
    reconnectionAttempts: 5,
    timeout: 10000
  });
  window.gameSocket.socket = socket;
  console.log("window.gameSocket initialized with socket:", Object.keys(window.gameSocket));
} catch (err) {
  console.error("Failed to initialize Socket.IO client:", err);
}
