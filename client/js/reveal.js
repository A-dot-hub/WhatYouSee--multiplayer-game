class RevealEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentImage = null;
    this.blurAmount = 40;
    this.pixelSize = 40;
    this.isActive = false;
  }

  start(imageUrl, duration) {
    this.isActive = true;
    this.container.innerHTML = `<img src="${imageUrl}" id="revealing-image" style="transition: filter 1s ease, transform 1s ease; filter: blur(40px) brightness(0.8); transform: scale(1.1);">`;
    this.currentImage = document.getElementById('revealing-image');
    
    // Trigger the fast reveal after a tiny delay
    setTimeout(() => {
      if (this.currentImage) {
        this.currentImage.style.filter = 'blur(0px) brightness(1)';
        this.currentImage.style.transform = 'scale(1)';
      }
    }, 50);
  }

  updateReveal(percentage) {
    // No longer needed for time-based blur if we do 1s fast reveal
    return;
  }

  revealFully() {
    this.isActive = false;
    if (this.currentImage) {
      this.currentImage.style.filter = 'blur(0px) brightness(1)';
      this.currentImage.style.transform = 'scale(1)';
    }
  }

  clear() {
    this.isActive = false;
    this.container.innerHTML = '<div class="loader"></div>';
    this.currentImage = null;
  }
}

window.RevealEngine = RevealEngine;
