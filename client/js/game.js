document.addEventListener("DOMContentLoaded", () => {
  const myState = { id: null };
  const joinForm = document.getElementById("join-form");
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

  // Font Preview Logic
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
      // Temporarily apply theme to join screen
      document.body.className = document.body.className.replace(/\btheme-\w+/g, '').trim();
      if (theme !== 'orange') document.body.classList.add(`theme-${theme}`);
    };
  });

  joinForm.onsubmit = (e) => {
    e.preventDefault();
    
    // Apply Settings
    const activeTheme = document.querySelector('.theme-btn.active').dataset.theme;
    const activeFont = document.getElementById('font-select').value;
    const soundEnabled = document.getElementById('sound-toggle').checked;

    document.body.className = ''; // Clear all
    if (activeTheme !== 'orange') document.body.classList.add(`theme-${activeTheme}`);
    document.body.classList.add(activeFont);

    if (soundEnabled) {
      window.AudioManager.init();
    } else {
      window.AudioManager.enabled = false;
    }

    const name = document.getElementById("player-name-input").value;
    myState.name = name;
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
    document.getElementById("round-end-overlay").classList.add("hidden");
    
    if (!data.isRoundActive) {
      document.getElementById("question-text").innerText = "Waiting for next round...";
      document.getElementById("image-container").innerHTML = '<div class="loader-wrapper"><div class="loader"></div><p style="margin-top:20px; color:var(--text-muted);">Round starting soon...</p></div>';
    }
    
    window.ui.updateScoreboard(data.players, myState.id);
  });

  window.gameSocket.socket.on("player-list-update", (players) => {
    window.ui.updateScoreboard(players, myState.id);
  });

  window.gameSocket.socket.on("round-start", (data) => {
    totalRoundTime = data.totalDuration || data.timeRemaining;
    window.AudioManager.playRoundStart();
    document.getElementById("round-number").innerText = data.roundNumber;
    document.getElementById("question-text").innerText = data.question;
    
    // Ensure overlay is hidden at start of every round
    document.getElementById("round-end-overlay").classList.add("hidden");
    
    revealEngine.start(data.imageUrl, data.timeRemaining);
    
    // Preload next image
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
    // Show flash message for player guesses with bold name
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
    
    // Show green system flash message for correct word
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