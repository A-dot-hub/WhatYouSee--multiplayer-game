class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
  }

  playOsc(freq, type, duration, volume = 0.1) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() { this.playOsc(400, 'sine', 0.1, 0.05); }
  playCorrect() {
    this.playOsc(600, 'sine', 0.5, 0.1);
    setTimeout(() => this.playOsc(800, 'sine', 0.5, 0.1), 100);
  }
  playWrong() { this.playOsc(150, 'sawtooth', 0.3, 0.05); }
  playCountdown() { this.playOsc(300, 'sine', 0.1, 0.05); }
  playRoundStart() {
    this.playOsc(440, 'sine', 0.3, 0.1);
    setTimeout(() => this.playOsc(880, 'sine', 0.5, 0.1), 150);
  }
  playJoin() {
    this.playOsc(523.25, 'sine', 0.2, 0.1); // C5
    setTimeout(() => this.playOsc(659.25, 'sine', 0.3, 0.1), 100); // E5
  }
  playLeave() {
    this.playOsc(659.25, 'sine', 0.2, 0.05); // E5
    setTimeout(() => this.playOsc(523.25, 'sine', 0.3, 0.05), 100); // C5
  }
}

window.AudioManager = new AudioManager();
