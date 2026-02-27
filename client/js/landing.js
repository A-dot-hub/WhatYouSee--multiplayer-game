document.addEventListener("DOMContentLoaded", () => {
  const tagline = document.getElementById("dynamic-tagline");
  if (!tagline) return;

  const phrases = ["Guess Fast.", "Think Sharp.", "Win Big."];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  // Clear initial text to prevent flash
  tagline.textContent = "";

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      // Erasing
      tagline.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50; // Erase faster
    } else {
      // Typing
      tagline.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100; // Normal typing speed
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Finished typing phrase
      isDeleting = true;
      typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
      // Finished erasing
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500; // Pause before next phrase
    }

    setTimeout(type, typeSpeed);
  }

  // Start the loop
  setTimeout(type, 500);
});
