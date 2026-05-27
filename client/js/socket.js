
const socket = io({
  reconnectionAttempts: 5,
  timeout: 10000
});
window.gameSocket = {
  socket,
  join: (name) => socket.emit("join-game", name),
  guess: (val) => socket.emit("submit-guess", val)
};
