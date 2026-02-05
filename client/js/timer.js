let currentTime = 60;
let maxTime = 60;

// Update timer display
function updateTimer(timeRemaining) {
  currentTime = timeRemaining;
  const timerText = document.getElementById("timer-text");
  const timerProgress = document.getElementById("timer-ring-progress");

  if (!timerText || !timerProgress) return;

  // Update text
  timerText.textContent = timeRemaining;

  // Calculate progress for radius 24 (mobile optimized)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / maxTime;
  const offset = circumference * (1 - progress);

  timerProgress.style.strokeDasharray = circumference;
  timerProgress.style.strokeDashoffset = offset;

  // Change color based on time remaining
  timerProgress.classList.remove("warning", "danger");

  if (timeRemaining <= 10) {
    timerProgress.classList.add("danger");
  } else if (timeRemaining <= 20) {
    timerProgress.classList.add("warning");
  }
}

// Reset timer
function resetTimer(duration) {
  maxTime = duration;
  currentTime = duration;

  const timerProgress = document.getElementById("timer-ring-progress");
  if (!timerProgress) return;

  const radius = 24;
  const circumference = 2 * Math.PI * radius;

  timerProgress.style.strokeDasharray = circumference;
  timerProgress.style.strokeDashoffset = 0;
  timerProgress.classList.remove("warning", "danger");

  updateTimer(duration);
}

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Export functions
window.updateTimer = updateTimer;
window.resetTimer = resetTimer;
window.formatTime = formatTime;
