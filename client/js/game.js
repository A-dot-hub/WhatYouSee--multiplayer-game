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

  // Settings System
  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsBtn = document.getElementById("close-settings");
  
  const settings = {
    theme: localStorage.getItem("whatUsee_theme") || "orange",
    font: localStorage.getItem("whatUsee_font") || "font-fredoka",
    music: localStorage.getItem("whatUsee_music") !== "false",
    sfx: localStorage.getItem("whatUsee_sfx") !== "false",
    volume: parseInt(localStorage.getItem("whatUsee_volume") || "80"),
    particles: localStorage.getItem("whatUsee_particles") !== "false",
    chatVisible: localStorage.getItem("whatUsee_chatVisible") !== "false",
    quality: localStorage.getItem("whatUsee_quality") || "medium",
    reduceMotion: localStorage.getItem("whatUsee_reduceMotion") === "true",
    highContrast: localStorage.getItem("whatUsee_highContrast") === "true"
  };

  function syncSettingsUI() {
    document.getElementById("music-toggle").checked = settings.music;
    document.getElementById("sfx-toggle").checked = settings.sfx;
    document.getElementById("volume-slider").value = settings.volume;
    document.getElementById("modal-font-select").value = settings.font;
    document.getElementById("particles-toggle").checked = settings.particles;
    document.getElementById("chat-visibility-toggle").checked = settings.chatVisible;
    document.getElementById("reduce-motion-toggle").checked = settings.reduceMotion;
    document.getElementById("high-contrast-toggle").checked = settings.highContrast;
    
    document.querySelectorAll(".theme-flavor-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.flavor === settings.theme);
    });
    
    document.querySelectorAll(".quality-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.quality === settings.quality);
    });

    // Also sync the join screen font select
    if (document.getElementById("font-select")) {
        document.getElementById("font-select").value = settings.font;
    }
    
    applyVisualSettings();
  }

  function applyVisualSettings() {
    document.body.className = ''; 
    if (settings.theme !== 'orange') document.body.classList.add(`theme-${settings.theme}`);
    document.body.classList.add(settings.font);
    document.body.classList.add(`quality-${settings.quality}`);
    
    if (settings.reduceMotion) document.body.classList.add('reduce-motion');
    if (settings.highContrast) document.body.classList.add('high-contrast');
    
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) chatContainer.style.opacity = settings.chatVisible ? "1" : "0";
    
    window.AudioManager.enabled = settings.sfx;
  }

  // Initial Sync
  syncSettingsUI();

  settingsBtn.onclick = () => {
    settingsModal.classList.remove("hidden");
    window.AudioManager.playClick();
  };

  closeSettingsBtn.onclick = () => {
    settingsModal.classList.add("hidden");
    window.AudioManager.playClick();
  };

  // Setting Event Listeners
  document.getElementById("music-toggle").onchange = (e) => {
    settings.music = e.target.checked;
    localStorage.setItem("whatUsee_music", settings.music);
  };

  document.getElementById("sfx-toggle").onchange = (e) => {
    settings.sfx = e.target.checked;
    localStorage.setItem("whatUsee_sfx", settings.sfx);
    window.AudioManager.enabled = settings.sfx;
  };

  document.getElementById("reduce-motion-toggle").onchange = (e) => {
    settings.reduceMotion = e.target.checked;
    localStorage.setItem("whatUsee_reduceMotion", settings.reduceMotion);
    applyVisualSettings();
  };

  document.getElementById("high-contrast-toggle").onchange = (e) => {
    settings.highContrast = e.target.checked;
    localStorage.setItem("whatUsee_highContrast", settings.highContrast);
    applyVisualSettings();
  };

  document.getElementById("volume-slider").oninput = (e) => {
    settings.volume = e.target.value;
    localStorage.setItem("whatUsee_volume", settings.volume);
    // Future: Apply volume to AudioManager
  };

  document.getElementById("modal-font-select").onchange = (e) => {
    settings.font = e.target.value;
    localStorage.setItem("whatUsee_font", settings.font);
    applyVisualSettings();
  };

  document.getElementById("particles-toggle").onchange = (e) => {
    settings.particles = e.target.checked;
    localStorage.setItem("whatUsee_particles", settings.particles);
  };

  document.getElementById("chat-visibility-toggle").onchange = (e) => {
    settings.chatVisible = e.target.checked;
    localStorage.setItem("whatUsee_chatVisible", settings.chatVisible);
    applyVisualSettings();
  };

  document.querySelectorAll(".theme-flavor-btn").forEach(btn => {
    btn.onclick = () => {
      settings.theme = btn.dataset.flavor;
      localStorage.setItem("whatUsee_theme", settings.theme);
      syncSettingsUI();
      window.AudioManager.playClick();
    };
  });

  document.querySelectorAll(".quality-btn").forEach(btn => {
    btn.onclick = () => {
      settings.quality = btn.dataset.quality;
      localStorage.setItem("whatUsee_quality", settings.quality);
      syncSettingsUI();
      window.AudioManager.playClick();
    };
  });

  document.getElementById("fullscreen-tog-btn").onclick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Rounds selection logic for host
  const roundBtns = document.querySelectorAll(".round-count-btn");
  roundBtns.forEach(btn => {
    btn.onclick = () => {
       if (!myState.isHost) return;
       const rounds = btn.dataset.rounds;
       window.gameSocket.updateRoomSettings({ rounds });
       window.AudioManager.playClick();
    };
  });

  window.gameSocket.socket.on("room-settings-update", (data) => {
    if (data.rounds) {
      roundBtns.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.rounds == data.rounds);
      });
    }
  });

  // Keep original theme settings for Join screen but sync with main settings
  const themeCarousel = document.getElementById('theme-carousel');
  const prevThemeBtn = document.getElementById('prev-theme');
  const nextThemeBtn = document.getElementById('next-theme');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const fontSelect = document.getElementById('font-select');

  if (fontSelect) {
    fontSelect.onchange = () => {
      settings.font = fontSelect.value;
      localStorage.setItem("whatUsee_font", settings.font);
      applyVisualSettings();
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
      settings.theme = btn.dataset.theme;
      localStorage.setItem("whatUsee_theme", settings.theme);
      syncSettingsUI();
    };
  });

  function applySettings() {
    // This is now redundant as applyVisualSettings is called via syncSettingsUI
    applyVisualSettings();

    if (settings.sfx || settings.music) {
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
      document.getElementById("host-settings").classList.remove("hidden");
      document.getElementById("lobby-status-text").innerText = "You are the host. Tap Start when ready!";
    } else {
      startGameBtn.classList.add("hidden");
      document.getElementById("host-settings").classList.add("hidden");
      document.getElementById("lobby-status-text").innerText = "Waiting for host to start...";
    }
  }

  window.gameSocket.socket.on("game-over", (data) => {
    const overlay = document.getElementById("round-end-overlay");
    const title = document.getElementById("overlay-title");
    const winnersList = document.getElementById("overlay-winners");
    
    title.innerText = "GAME OVER!";
    window.AudioManager.playRoundStart(); // Celebration sound would be better
    
    winnersList.innerHTML = "";
    // Sort players by score
    const sorted = [...data.players].sort((a,b) => b.score - a.score);
    
    sorted.forEach((p, index) => {
        const item = document.createElement("div");
        item.className = `winner-item rank-${index + 1}`;
        item.innerHTML = `<span>${index + 1}. ${p.name}</span> <span>${p.score} pts</span>`;
        winnersList.appendChild(item);
    });
    
    document.getElementById("answer-reveal").innerText = "Final Scores";
    overlay.classList.remove("hidden");
    
    // Auto return to lobby after 10s
    setTimeout(() => {
        if (!screens.game.classList.contains("hidden")) {
            overlay.classList.add("hidden");
            title.innerText = "Round Finished!"; // Reset title
            showScreen('lobby');
        }
    }, 10000);
  });

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
