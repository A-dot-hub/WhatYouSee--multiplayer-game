class Juice {
  static shake(element, intensity = 5, duration = 300) {
    const start = performance.now();
    const originalTransform = element.style.transform || '';
    
    function animate(time) {
      const elapsed = time - start;
      if (elapsed < duration) {
        const x = (Math.random() - 0.5) * intensity;
        const y = (Math.random() - 0.5) * intensity;
        element.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
        requestAnimationFrame(animate);
      } else {
        element.style.transform = originalTransform;
      }
    }
    requestAnimationFrame(animate);
  }

  static spawnParticles(x, y, color = '#ff8c00', count = 20) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = color;
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 5;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      document.body.appendChild(particle);
      
      let posX = x;
      let posY = y;
      let opacity = 1;
      
      function update() {
        posX += vx;
        posY += vy;
        opacity -= 0.02;
        
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = opacity;
        
        if (opacity > 0) {
          requestAnimationFrame(update);
        } else {
          particle.remove();
        }
      }
      requestAnimationFrame(update);
    }
  }

  static floatingText(text, x, y, color = '#fff') {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    document.body.appendChild(el);
    
    setTimeout(() => el.remove(), 1000);
  }
}

window.Juice = Juice;
