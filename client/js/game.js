document.addEventListener("DOMContentLoaded", () => {
  const myState = { id: null };
  const joinForm = document.getElementById("join-form");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const helpBtn = document.getElementById("help-btn");

  window.ui.initDraggable(helpBtn);

  joinForm.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("player-name-input").value;
    window.gameSocket.join(name);
  };

  chatForm.onsubmit = (e) => {
    e.preventDefault();
    const val = chatInput.value.trim();
    if (val) {
      window.gameSocket.guess(val);
      chatInput.value = "";
    }
  };

  window.gameSocket.socket.on("player-joined", (data) => {
    myState.id = data.playerId;
    document.getElementById("join-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
    window.ui.updateScoreboard(data.players, myState.id);
  });

  window.gameSocket.socket.on("player-list-update", (players) => {
    window.ui.updateScoreboard(players, myState.id);
  });

  window.gameSocket.socket.on("round-start", (data) => {
    document.getElementById("round-number").innerText = data.roundNumber;
    document.getElementById("question-text").innerText = data.question;
    document.getElementById("image-container").innerHTML =
      `<img src="${data.imageUrl}">`;
    document.getElementById("round-end-overlay").classList.add("hidden");
    window.updateTimer(data.timeRemaining);
  });

  window.gameSocket.socket.on("timer-update", (val) => window.updateTimer(val));

  window.gameSocket.socket.on("chat-message", (data) => {
    window.addMessage(
      data.playerName,
      data.message,
      data.isWrong ? "wrong" : "normal",
    );
    // Show flash message for player guesses with bold name
    window.ui.showFlashMessage(
      `<strong>${data.playerName}:</strong> ${data.message}`,
      "guess",
    );
  });

  window.gameSocket.socket.on("correct-guess-self", (data) => {
    window.addMessage("System", `You got it! +${data.points} pts`, "system");
  });

  window.gameSocket.socket.on("correct-guess-others", (data) => {
    window.addMessage("System", `${data.name} guessed correctly!`, "system");
  });

  window.gameSocket.socket.on("round-end", (data) => {
    const overlay = document.getElementById("round-end-overlay");
    const winnersList = document.getElementById("overlay-winners");
    document.getElementById("answer-reveal").innerText = data.answer;

    // Show green system flash message for correct word
    window.ui.showFlashMessage(
      `The word was <strong>'${data.answer}'</strong>`,
      "system",
    );

    winnersList.innerHTML = "";

    if (data.correctGuessers.length > 0) {
      data.correctGuessers.forEach((name, index) => {
        const rank = index + 1;
        let rankSuffix = "th";
        if (rank === 1) rankSuffix = "st";
        else if (rank === 2) rankSuffix = "nd";
        else if (rank === 3) rankSuffix = "rd";

        const winnerItem = document.createElement("div");
        winnerItem.className = `winner-item rank-${rank}`;
        winnerItem.innerHTML = `
          <div class="winner-rank-badge">${rank}${rankSuffix}</div>
          <div class="winner-name">${name}</div>
        `;
        winnersList.appendChild(winnerItem);
      });
    } else {
      winnersList.innerHTML = `<div style="color: #666; font-style: italic; margin-top: 10px;">Nobody guessed correctly!</div>`;
    }

    overlay.classList.remove("hidden");

    let left = 5;
    const nt = document.getElementById("next-timer");
    if (nt) nt.innerText = left;
    const int = setInterval(() => {
      left--;
      if (nt) nt.innerText = left;
      if (left <= 0) clearInterval(int);
    }, 1000);
  });
});
