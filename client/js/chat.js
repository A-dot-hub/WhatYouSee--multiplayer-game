function addMessage(user, msg, type = "normal") {
  const container = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.style.padding = "4px 0";
  div.style.borderBottom = "1px solid #f9f9f9";

  if (type === "wrong") {
    div.style.color = "#777";
    div.innerHTML = `<strong>${user}:</strong> ${msg}`;
  } else if (type === "system") {
    div.style.color = "#ff8c00"; // Orange from screenshot
    div.style.fontWeight = "700";
    div.innerHTML = `System: ${msg}`;
  } else {
    div.style.color = "#444";
    div.innerHTML = `<strong>${user}:</strong> ${msg}`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
window.addMessage = addMessage;
