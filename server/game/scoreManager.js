class ScoreManager {
  /**
   * Calculates points based on whether the player was the first to guess correctly.
   * @param {boolean} isFirst - True if the player is the first to guess in the round.
   * @returns {number} Points awarded.
   */
  calculatePoints(isFirst) {
    return isFirst ? 100 : 50;
  }
}
module.exports = ScoreManager;
