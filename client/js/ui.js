// Update scoreboard with player list
function updateScoreboard(players) {
  const scoreboard = document.getElementById("scoreboard");

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  scoreboard.innerHTML = "";

  if (sortedPlayers.length === 0) {
    scoreboard.innerHTML =
      '<p style="color: var(--text-muted); text-align: center; padding: 1rem; font-size: 0.875rem;">Waiting for players...</p>';
    return;
  }

  const gameState = window.gameSocket.getGameState();
  const topScore = sortedPlayers[0]?.score || 0;

  sortedPlayers.forEach((player, index) => {
    const playerItem = document.createElement("div");
    playerItem.className = "player-item";
    playerItem.dataset.playerId = player.id;

    // Highlight current player
    if (player.id === gameState.playerId) {
      playerItem.classList.add("current-player");
    }

    // Highlight top scorer
    if (player.score > 0 && player.score === topScore && index === 0) {
      playerItem.classList.add("top-scorer");
    }

    // Add status classes
    if (player.status === "disconnected") {
      playerItem.classList.add("disconnected");
    } else if (player.status === "answered") {
      playerItem.classList.add("answered");
    }

    const rank = index + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : "";

    // Safely escape player name
    const playerName = escapeHtml(player.name || "Player");

    // Create card structure
    const playerInfo = document.createElement("div");
    playerInfo.className = "player-info";

    const rankSpan = document.createElement("span");
    rankSpan.className = `player-rank ${rankClass}`;
    rankSpan.textContent = rank;

    const nameSpan = document.createElement("span");
    nameSpan.className = "player-name";
    nameSpan.textContent = playerName;
    nameSpan.title = playerName; // Tooltip for long names

    playerInfo.appendChild(rankSpan);
    playerInfo.appendChild(nameSpan);

    // Add status indicator
    const statusIndicator = document.createElement("span");
    statusIndicator.className = "player-status-indicator";

    if (player.status === "disconnected") {
      statusIndicator.innerHTML =
        '<span class="status-dot disconnected" title="Disconnected"></span>';
    } else if (player.status === "answered") {
      statusIndicator.innerHTML =
        '<span class="status-checkmark" title="Answered">✓</span>';
    } else {
      statusIndicator.innerHTML =
        '<span class="status-dot active" title="Active"></span>';
    }

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "player-score";
    scoreSpan.textContent = player.score;

    playerItem.appendChild(playerInfo);
    playerItem.appendChild(statusIndicator);
    playerItem.appendChild(scoreSpan);

    scoreboard.appendChild(playerItem);
  });

  // Only auto-scroll on initial load or new player join (not on score updates)
  // This is handled by checking if the current player is out of view
  const currentPlayerElement = scoreboard.querySelector(".current-player");
  if (currentPlayerElement) {
    const scoreboardRect = scoreboard.getBoundingClientRect();
    const playerRect = currentPlayerElement.getBoundingClientRect();

    // Only scroll if player is not visible
    if (
      playerRect.bottom > scoreboardRect.bottom ||
      playerRect.top < scoreboardRect.top
    ) {
      currentPlayerElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }
}

// Animate score change
function animateScoreChange(playerId, oldScore, newScore, points) {
  const playerItem = document.querySelector(`[data-player-id="${playerId}"]`);
  if (!playerItem) return;

  const scoreSpan = playerItem.querySelector(".player-score");
  if (!scoreSpan) return;

  // Create floating points animation
  const floatingPoints = document.createElement("div");
  floatingPoints.className = "floating-points";
  floatingPoints.textContent = `+${points}`;

  playerItem.style.position = "relative";
  playerItem.appendChild(floatingPoints);

  // Pulse effect on the player item
  playerItem.classList.add("score-pulse");

  // Animate the score number change
  const duration = 500;
  const steps = 20;
  const increment = (newScore - oldScore) / steps;
  let currentStep = 0;

  const scoreInterval = setInterval(() => {
    currentStep++;
    const currentScore = Math.round(oldScore + increment * currentStep);
    scoreSpan.textContent = currentScore;

    if (currentStep >= steps) {
      clearInterval(scoreInterval);
      scoreSpan.textContent = newScore;
    }
  }, duration / steps);

  // Remove floating points after animation
  setTimeout(() => {
    if (floatingPoints.parentNode) {
      floatingPoints.remove();
    }
    playerItem.classList.remove("score-pulse");
  }, 1500);
}

// Display round start
function displayRoundStart(data) {
  // Update round number
  const roundNumber = document.getElementById("round-number");
  if (roundNumber) {
    roundNumber.textContent = data.roundNumber;
  }

  // Update question
  const questionText = document.getElementById("question-text");
  if (questionText) {
    questionText.textContent = data.question;
  }

  // Display image with loading state
  const imageContainer = document.getElementById("image-container");
  if (imageContainer) {
    // Show loading state
    imageContainer.innerHTML = `
      <div class="image-loading">
        <div class="spinner"></div>
        <p>Loading image...</p>
      </div>
    `;

    // Preload image
    const img = new Image();
    img.onload = () => {
      const imageUrl = escapeHtml(data.imageUrl);
      imageContainer.innerHTML = `<img src="${imageUrl}" alt="Challenge Image" loading="eager">`;
    };
    img.onerror = () => {
      imageContainer.innerHTML = `
        <div class="image-error">
          <p>⚠️ Failed to load image</p>
        </div>
      `;
    };
    img.src = data.imageUrl;
  }

  // Reset and start timer
  if (window.resetTimer) {
    window.resetTimer(data.timeRemaining || 60);
  }

  // Focus on chat input with slight delay for keyboard
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    setTimeout(() => {
      chatInput.value = "";
      chatInput.disabled = false;
      chatInput.focus();
    }, 300);
  }

  // Show round start feedback
  showRoundStartFeedback(data.roundNumber);
}

// Show round start visual feedback
function showRoundStartFeedback(roundNumber) {
  const feedback = document.createElement("div");
  feedback.className = "round-start-feedback";
  feedback.innerHTML = `
    <div class="feedback-content">
      <h2>Round ${roundNumber}</h2>
      <p>Find the hidden objects!</p>
    </div>
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.classList.add("fade-out");
  }, 1500);

  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

// Show round end overlay
function showRoundEndOverlay(data) {
  const overlay = document.getElementById("round-end-overlay");
  const answerValue = document.getElementById("answer-value");
  const winnersList = document.getElementById("winners-list");

  if (!overlay || !answerValue || !winnersList) return;

  // Disable chat input
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.disabled = true;
  }

  // Set answer
  answerValue.textContent = data.answer;

  // Display winners with position indicators
  if (data.correctGuessers && data.correctGuessers.length > 0) {
    winnersList.innerHTML = data.correctGuessers
      .map((name, index) => {
        const safeName = escapeHtml(name);
        const emoji =
          index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎯";
        const positionClass =
          index === 0
            ? "first"
            : index === 1
              ? "second"
              : index === 2
                ? "third"
                : "";
        return `<div class="winner-item ${positionClass}">${emoji} ${safeName}</div>`;
      })
      .join("");
  } else {
    winnersList.innerHTML =
      '<p class="no-winners">No one guessed correctly</p>';
  }

  // Highlight top scorer if exists
  if (data.topScorer) {
    const topScorerElement = document.querySelector(
      `[data-player-id="${data.topScorer}"]`,
    );
    if (topScorerElement) {
      topScorerElement.classList.add("top-scorer");
    }
  }

  // Show overlay with animation
  overlay.classList.remove("hidden");
  overlay.classList.add("show");

  // Start countdown
  let countdown = 5;
  const timerElement = document.getElementById("next-round-timer");

  const countdownInterval = setInterval(() => {
    countdown--;
    if (timerElement) {
      timerElement.textContent = countdown;
    }
    if (countdown <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
}

// Hide round end overlay
function hideRoundEndOverlay() {
  const overlay = document.getElementById("round-end-overlay");
  if (overlay) {
    overlay.classList.remove("show");
    overlay.classList.add("hidden");
  }
}

// Show correct guess feedback
function showCorrectFeedback() {
  const feedback = document.createElement("div");
  feedback.className = "correct-feedback";
  feedback.innerHTML = `
    <div class="feedback-icon">✓</div>
    <div class="feedback-text">Correct!</div>
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.classList.add("fade-out");
  }, 1000);

  setTimeout(() => {
    feedback.remove();
  }, 1500);
}

// Show wrong guess feedback
function showWrongFeedback() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.classList.add("shake");
    setTimeout(() => {
      chatInput.classList.remove("shake");
    }, 500);
  }
}

// Show already answered message
function showAlreadyAnsweredMessage() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    const originalPlaceholder = chatInput.placeholder;
    chatInput.placeholder = "You've already answered this round!";
    chatInput.classList.add("input-error");

    setTimeout(() => {
      chatInput.placeholder = originalPlaceholder;
      chatInput.classList.remove("input-error");
    }, 2000);
  }
}

// Show help modal
function showHelpModal() {
  const existingModal = document.getElementById("help-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "help-modal";
  modal.className = "help-modal";
  modal.innerHTML = `
    <div class="help-modal-overlay"></div>
    <div class="help-modal-content">
      <button class="help-modal-close" aria-label="Close">×</button>
      <h2>📱 How to Play GuessQuest</h2>
      <div class="help-steps">
        <div class="help-step">
          <div class="help-step-number">1</div>
          <div class="help-step-text">
            <h3>Look at the Image</h3>
            <p>Find hidden objects in the challenge image</p>
          </div>
        </div>
        <div class="help-step">
          <div class="help-step-number">2</div>
          <div class="help-step-text">
            <h3>Count & Guess</h3>
            <p>Type your answer and submit quickly</p>
          </div>
        </div>
        <div class="help-step">
          <div class="help-step-number">3</div>
          <div class="help-step-text">
            <h3>Earn Points</h3>
            <p>Faster correct guesses earn more points!</p>
          </div>
        </div>
      </div>
      <div class="help-tips">
        <h3>💡 Tips</h3>
        <ul>
          <li>Best played on mobile 📱</li>
          <li>First correct guess gets bonus points</li>
          <li>One guess per round - make it count!</li>
          <li>Stay connected for your best scores</li>
        </ul>
      </div>
      <button class="btn-primary help-modal-cta">Got it! Let's Play</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Show modal with animation
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  // Close handlers
  const closeBtn = modal.querySelector(".help-modal-close");
  const ctaBtn = modal.querySelector(".help-modal-cta");
  const overlay = modal.querySelector(".help-modal-overlay");

  const closeModal = () => {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
    }, 300);

    // Store that user has seen help
    localStorage.setItem("guessquest-help-seen", "true");
  };

  closeBtn.addEventListener("click", closeModal);
  ctaBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);
}

// Check if first time player and show help
function checkFirstTimePlayer() {
  const hasSeenHelp = localStorage.getItem("guessquest-help-seen");
  if (!hasSeenHelp) {
    setTimeout(() => {
      showHelpModal();
    }, 1000);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (typeof text !== "string") {
    text = String(text);
  }
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Export functions
window.updateScoreboard = updateScoreboard;
window.animateScoreChange = animateScoreChange;
window.displayRoundStart = displayRoundStart;
window.showRoundEndOverlay = showRoundEndOverlay;
window.hideRoundEndOverlay = hideRoundEndOverlay;
window.showCorrectFeedback = showCorrectFeedback;
window.showWrongFeedback = showWrongFeedback;
window.showAlreadyAnsweredMessage = showAlreadyAnsweredMessage;
window.showHelpModal = showHelpModal;
window.checkFirstTimePlayer = checkFirstTimePlayer;
