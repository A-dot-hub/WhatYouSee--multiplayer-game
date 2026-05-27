document.addEventListener("DOMContentLoaded", () => {
  const myState = { 
    id: null,
    name: "",
    roomCode: "",
    isHost: false
  };
  
  const screens = {
    join: document.getElementById("join-screen"),
    lobby: document.getElementById("lobby-screen"),
    game: document.getElementById("game-screen")
  };

  const nameInput = document.getElementById("player-name-input");
  const roomCodeInput = document.getElementById("room-code-input");
  const createRoomBtn = document.getElementById("create-room-btn");
  const joinRoomBtn = document.getElementById("join-room-btn");
  const startGameBtn = document.getElementById("start-game-btn");
  const leaveLobbyBtn = document.getElementById("leave-lobby-btn");
  const copyCodeBtn = document.getElementById("copy-code-btn");

  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const helpBtn = document.getElementById("help-btn");
  
  const revealEngine = new window.RevealEngine("image-container");
  let totalRoundTime = 45;

  window.ui.initDraggable(helpBtn);

  // Theme Settings Logic
  const themeCarousel = document.getElementById('theme-carousel');
  const prevThemeBtn = document.getElementById('prev-theme');
  const nextThemeBtn = document.getElementById('next-theme');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const fontSelect = document.getElementById('font-select');

  if (fontSelect) {
    fontSelect.onchange = () => {
      document.body.className = document.body.className.replace(/\bfont-\w+/g, '').trim();
      document.body.classList.add(fontSelect.value);
    };
  }

  if (prevThemeBtn && nextThemeBtn && themeCarousel) {
    prevThemeBtn.onclick = (e) => {
      e.stopPropagation();
      themeCarousel.scrollBy({ left: -100, behavior: 'smooth' });
    };
    nextThemeBtn.onclick = (e) => {
      e.stopPropagation();
      themeCarousel.scrollBy({ left: 100, behavior: 'smooth' });
    };
  }

  themeBtns.forEach(btn => {
    btn.onclick = () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.theme;
      document.body.className = document.body.className.replace(/\btheme-\w+/g, '').trim();
      if (theme !== 'orange') document.body.classList.add(`theme-${theme}`);
    };
  });

  function applySettings() {
    const activeTheme = document.querySelector('.theme-btn.active').dataset.theme;
    const activeFont = document.getElementById('font-select').value;
    const soundEnabled = document.getElementById('sound-toggle').checked;

    document.body.className = ''; 
    if (activeTheme !== 'orange') document.body.classList.add(`theme-${activeTheme}`);
    document.body.classList.add(activeFont);

    if (soundEnabled) {
      window.AudioManager.init();
    } else {
      window.AudioManager.enabled = false;
    }
  }

  function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[screenId].classList.remove("hidden");
  }

  createRoomBtn.onclick = () => {
    console.log("Create Room clicked. gameSocket:", window.gameSocket);
    const name = nameInput.value.trim();
    if (!name) return nameInput.focus();
    applySettings();
    myState.name = name;
    
    if (window.gameSocket && typeof window.gameSocket.createRoom === 'function') {
      window.gameSocket.createRoom(name);
    } else {
      console.error("window.gameSocket.createRoom is not available!");
      window.ui.showFlashMessage("Error: Socket connection incomplete. Please refresh.", "system");
    }
    window.AudioManager.playClick();
  };

  joinRoomBtn.onclick = () => {
    console.log("Join Room clicked. gameSocket:", window.gameSocket);
    const name = nameInput.value.trim();
    const code = roomCodeInput.value.trim();
    if (!name) return nameInput.focus();
    if (!code) return roomCodeInput.focus();
    applySettings();
    myState.name = name;
    myState.roomCode = code.toUpperCase();
    
    if (window.gameSocket && typeof window.gameSocket.joinRoom === 'function') {
      window.gameSocket.joinRoom(myState.roomCode, name);
    } else {
      console.error("window.gameSocket.joinRoom is not available!");
      window.ui.showFlashMessage("Error: Socket connection incomplete. Please refresh.", "system");
    }
    window.AudioManager.playClick();
  };

  startGameBtn.onclick = () => {
    window.gameSocket.startGame();
    window.AudioManager.playClick();
  };

  leaveLobbyBtn.onclick = () => {
    window.gameSocket.leaveRoom();
    showScreen('join');
    window.AudioManager.playClick();
  };

  copyCodeBtn.onclick = () => {
    navigator.clipboard.writeText(myState.roomCode);
    window.ui.showFlashMessage("Room code copied to clipboard!", "system");
    window.AudioManager.playClick();
  };

  chatForm.onsubmit = (e) => {
    e.preventDefault();
    const val = chatInput.value.trim();
    if (val) {
      window.gameSocket.guess(val);
      chatInput.value = "";
    }
  };

  // Socket event handlers
  window.gameSocket.socket.on("room-created", (data) => {
    myState.roomCode = data.roomCode;
    myState.isHost = true;
    myState.id = data.player.id;
    updateLobbyUI(data.players);
    showScreen('lobby');
    window.AudioManager.playJoin();
  });

  window.gameSocket.socket.on("room-joined", (data) => {
    myState.roomCode = data.roomCode;
    myState.id = data.player.id;
    myState.isHost = data.player.isHost;
    updateLobbyUI(data.players);
    showScreen('lobby');
    window.AudioManager.playJoin();
  });

  window.gameSocket.socket.on("room-error", (msg) => {
    window.ui.showFlashMessage(msg, "system");
    window.AudioManager.playWrong();
  });

  window.gameSocket.socket.on("player-list-update", (players) => {
    const me = players.find(p => p.id === myState.id);
    if (me) myState.isHost = me.isHost;
    
    if (!screens.lobby.classList.contains("hidden")) {
      updateLobbyUI(players);
    }
    window.ui.updateScoreboard(players, myState.id);
  });

  function updateLobbyUI(players) {
    document.getElementById("lobby-room-code").innerText = myState.roomCode;
    document.getElementById("lobby-player-count").innerText = players.length;
    const list = document.getElementById("lobby-player-list");
    list.innerHTML = "";
    
    players.forEach(p => {
      const card = document.createElement("div");
      card.className = "lobby-player-card";
      card.innerHTML = `
        <div class="player-avatar">${p.name.charAt(0).toUpperCase()}</div>
        <div class="player-name">${p.name}</div>
        ${p.isHost ? '<div class="host-badge">HOST</div>' : ''}
      `;
      list.appendChild(card);
    });

    if (myState.isHost) {
      startGameBtn.classList.remove("hidden");
      document.getElementById("lobby-status-text").innerText = "You are the host. Tap Start when ready!";
    } else {
      startGameBtn.classList.add("hidden");
      document.getElementById("lobby-status-text").innerText = "Waiting for host to start...";
    }
  }

  window.gameSocket.socket.on("round-start", (data) => {
    if (!screens.game.classList.contains("hidden")) {
      // If already in game, just start next round
    } else {
      showScreen('game');
    }
    
    totalRoundTime = data.totalDuration || data.timeRemaining;
    window.AudioManager.playRoundStart();
    document.getElementById("round-number").innerText = data.roundNumber;
    document.getElementById("question-text").innerText = data.question;
    document.getElementById("round-end-overlay").classList.add("hidden");
    
    revealEngine.start(data.imageUrl, data.timeRemaining);
    
    if (data.nextImageUrl) {
      const img = new Image();
      img.src = data.nextImageUrl;
    }

    window.updateTimer(data.timeRemaining);
  });

  window.gameSocket.socket.on("timer-update", (val) => {
    window.updateTimer(val);
    const percentage = val / totalRoundTime;
    revealEngine.updateReveal(percentage);
  });

  window.gameSocket.socket.on("chat-message", (data) => {
    if (data.isWrong && data.playerName === myState.name) {
      window.AudioManager.playWrong();
    }
    window.addMessage(data.playerName, data.message, data.isWrong ? 'wrong' : 'normal');
    window.ui.showFlashMessage(`<strong>${data.playerName}:</strong> ${data.message}`, 'guess');
  });

  window.gameSocket.socket.on("correct-guess-self", (data) => {
    window.AudioManager.playCorrect();
    window.addMessage("System", `You got it! +${data.points} pts`, "system");
    const streakMsg = data.streak > 1 ? ` (${data.streak}x Streak!)` : '';
    window.Juice.floatingText(`+${data.points}${streakMsg}`, window.innerWidth / 2, window.innerHeight / 2, '#4caf50');
    window.Juice.spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '#4caf50');
  });

  window.gameSocket.socket.on("correct-guess-others", (data) => {
    window.addMessage("System", `${data.name} guessed correctly!`, "system");
    window.Juice.shake(document.getElementById("scoreboard"), 5, 200);
  });

  window.gameSocket.socket.on("round-end", (data) => {
    revealEngine.revealFully();
    const overlay = document.getElementById("round-end-overlay");
    const winnersList = document.getElementById("overlay-winners");
    document.getElementById("answer-reveal").innerText = data.answer;
    
    window.ui.showFlashMessage(`The word was <strong>'${data.answer}'</strong>`, 'system');

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
