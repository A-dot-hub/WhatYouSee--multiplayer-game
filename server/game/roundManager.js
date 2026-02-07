const ImagePicker = require("./imagePicker");
const validateGuess = require("../utils/validateGuess");

class RoundManager {
  constructor() {
    this.imagePicker = new ImagePicker();
    this.currentRoundNumber = 0;
    this.roundDuration = 45; // Faster rounds for mobile
    this.roundStartTime = null;
  }
  startNewRound() {
    this.currentRoundNumber++;
    const imageData = this.imagePicker.getRandomImage();
    if (!imageData) return null;
    this.roundStartTime = Date.now();
    return {
      imageUrl: imageData.url,
      question: imageData.question,
      answer: imageData.answer,
      roundNumber: this.currentRoundNumber,
    };
  }
  getTimeRemaining() {
    if (!this.roundStartTime) return 0;
    const elapsed = Math.floor((Date.now() - this.roundStartTime) / 1000);
    return Math.max(0, this.roundDuration - elapsed);
  }
  validateGuess(guess, correctAnswer) {
    return validateGuess(guess, correctAnswer);
  }
  getTotalImages() {
    return this.imagePicker.getTotalImages();
  }
}
module.exports = RoundManager;
