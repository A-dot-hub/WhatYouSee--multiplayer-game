class ScoreManager {
  /**
   * Calculates points based on whether the player was the first to guess correctly.
   * @param {boolean} isFirst - True if the player is the first to guess in the round.
   * @returns {number} Points awarded.
   */
  calculatePoints(isFirst, streak = 0, timeRemaining = 0) {
    let base = isFirst ? 100 : 50;
    const streakMultiplier = Math.min(2, 1 + (streak * 0.1));
    const comboBonus = timeRemaining > (45 - 5) ? 50 : 0;
    return Math.round((base * streakMultiplier) + comboBonus);
  }
}
module.exports = ScoreManager;