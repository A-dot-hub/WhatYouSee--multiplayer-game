function updateScoreboard(players, myId) {
  const board = document.getElementById("scoreboard");
  board.innerHTML = "";

  const sorted = [...players].sort((a, b) => b.score - a.score);

  sorted.forEach((p, idx) => {
    const row = document.createElement("div");
    row.className = `player-row ${p.id === myId ? "me" : ""} ${p.status === "answered" ? "answered" : ""}`;

    row.innerHTML = `
      <div class="player-rank">#${idx + 1}</div>
      <div class="player-info">
        <div class="player-name">${p.name}</div>
        <div class="player-score">${p.score} pts</div>
      </div>
    `;
    board.appendChild(row);
  });
}

/**
 * Shows a temporary floating message bubble over the image area.
 * @param {string} html - Message content (HTML supported)
 * @param {'guess'|'system'} type - Style type
 */
function showFlashMessage(html, type = "guess") {
  const container = document.getElementById("flash-container");
  if (!container) return;

  const bubble = document.createElement("div");
  bubble.className = `flash-bubble ${type}`;
  bubble.innerHTML = html;

  container.prepend(bubble);

  // Auto cleanup after animation ends
  setTimeout(() => {
    bubble.remove();
  }, 3600);
}

function initDraggable(el) {
  let isDragging = false;
  let hasMoved = false;
  let startX, startY, initialX, initialY;

  const onStart = (e) => {
    isDragging = true;
    hasMoved = false;
    const evt = e.type.startsWith("touch") ? e.touches[0] : e;

    const rect = el.getBoundingClientRect();
    startX = evt.clientX;
    startY = evt.clientY;
    initialX = rect.left;
    initialY = rect.top;

    el.style.transition = "none";
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const evt = e.type.startsWith("touch") ? e.touches[0] : e;

    const dx = evt.clientX - startX;
    const dy = evt.clientY - startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;

    let nx = initialX + dx;
    let ny = initialY + dy;

    // Bounds
    nx = Math.max(0, Math.min(nx, window.innerWidth - el.offsetWidth));
    ny = Math.max(0, Math.min(ny, window.innerHeight - el.offsetHeight));

    el.style.left = nx + "px";
    el.style.top = ny + "px";
    el.style.bottom = "auto";
    el.style.right = "auto";
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    el.style.transition = "all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)";
  };

  el.addEventListener("mousedown", onStart);
  el.addEventListener("touchstart", onStart, { passive: true });

  window.addEventListener("mousemove", onMove);
  window.addEventListener(
    "touchmove",
    (e) => {
      if (isDragging) {
        e.preventDefault();
        onMove(e);
      }
    },
    { passive: false },
  );

  window.addEventListener("mouseup", onEnd);
  window.addEventListener("touchend", onEnd);

  el.onclick = () => {
    if (!hasMoved) {
      document.getElementById("help-modal").classList.remove("hidden");
    }
  };
}

window.ui = { updateScoreboard, initDraggable, showFlashMessage };
