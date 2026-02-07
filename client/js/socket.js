const socket = io();
window.gameSocket = {
  socket,
  join: (name) => socket.emit("join-game", name),
  guess: (val) => socket.emit("submit-guess", val),
};
