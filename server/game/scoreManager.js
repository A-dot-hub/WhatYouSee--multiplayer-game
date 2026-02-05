class ScoreManager {
  constructor() {
    // Points: 100 for first correct answer, 50 for others
  }

  calculatePoints(position) {
    return position === 1 ? 100 : 50;
  }
}

module.exports = ScoreManager;
