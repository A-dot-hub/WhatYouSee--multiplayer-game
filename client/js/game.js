// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeGame();
  initializeDraggableHelp();
});

function initializeGame() {
  console.log("🎮 Initializing WhatYouSee...");

  // Join form handler
  const joinForm = document.getElementById("join-form");
  const playerNameInput = document.getElementById("player-name-input");

  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const playerName = playerNameInput.value.trim();

    if (playerName) {
      playerNameInput.disabled = true;
      joinForm.querySelector("button").disabled = true;

      window.gameSocket.joinGame(playerName);
    }
  });

  // Chat form handler
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const guess = chatInput.value.trim();

    if (guess) {
      window.gameSocket.submitGuess(guess);
      chatInput.value = "";
    }
  });

  // Auto-focus on chat input when clicking anywhere in game screen
  const gameScreen = document.getElementById("game-screen");
  gameScreen.addEventListener("click", (e) => {
    if (!e.target.matches("input, button, img")) {
      chatInput.focus();
    }
  });

  playerNameInput.focus();

  document.addEventListener("visibilitychange", () => {
    if (
      !document.hidden &&
      !document.getElementById("join-screen").classList.contains("hidden")
    ) {
      playerNameInput.focus();
    }
  });

  console.log("✅ Game initialized");
}

// Draggable Help Button
function initializeDraggableHelp() {
  const helpButton = document.getElementById("help-button");
  if (!helpButton) return;

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // Get saved position from localStorage
  const savedPosition = localStorage.getItem("help-button-position");
  if (savedPosition) {
    try {
      const { x, y } = JSON.parse(savedPosition);
      xOffset = x;
      yOffset = y;
      setTranslate(x, y, helpButton);
    } catch (e) {
      console.error("Failed to parse saved position");
    }
  }

  helpButton.addEventListener("touchstart", dragStart, { passive: false });
  helpButton.addEventListener("touchend", dragEnd);
  helpButton.addEventListener("touchmove", drag, { passive: false });

  helpButton.addEventListener("mousedown", dragStart);
  helpButton.addEventListener("mouseup", dragEnd);
  helpButton.addEventListener("mousemove", drag);

  // Click to show help (when not dragging)
  let clickStartTime = 0;
  let clickStartPos = { x: 0, y: 0 };

  helpButton.addEventListener("touchstart", (e) => {
    clickStartTime = Date.now();
    const touch = e.touches[0];
    clickStartPos = { x: touch.clientX, y: touch.clientY };
  });

  helpButton.addEventListener("touchend", (e) => {
    const clickDuration = Date.now() - clickStartTime;
    const touch = e.changedTouches[0];
    const distance = Math.sqrt(
      Math.pow(touch.clientX - clickStartPos.x, 2) +
        Math.pow(touch.clientY - clickStartPos.y, 2),
    );

    if (clickDuration < 200 && distance < 10 && !isDragging) {
      if (window.showHelpModal) {
        window.showHelpModal();
      }
    }
  });

  helpButton.addEventListener("click", (e) => {
    if (!isDragging && window.showHelpModal) {
      window.showHelpModal();
    }
  });

  function dragStart(e) {
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === helpButton) {
      isDragging = true;
      helpButton.classList.add("dragging");
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    helpButton.classList.remove("dragging");

    // Save position
    localStorage.setItem(
      "help-button-position",
      JSON.stringify({ x: xOffset, y: yOffset }),
    );
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, helpButton);
    }
  }

  function setTranslate(xPos, yPos, el) {
    // Keep button within viewport bounds
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 10;
    const maxY = window.innerHeight - rect.height - 10;
    const minX = 10;
    const minY = 10;

    xPos = Math.max(minX - rect.left, Math.min(xPos, maxX - rect.left));
    yPos = Math.max(minY - rect.top, Math.min(yPos, maxY - rect.top));

    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }
}
