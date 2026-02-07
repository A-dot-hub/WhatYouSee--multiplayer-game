function updateTimer(val) {
  const t = document.getElementById("timer-text");
  t.innerText = val;
  if (val <= 10) t.style.color = "var(--error)";
  else t.style.color = "var(--primary)";
}
window.updateTimer = updateTimer;
