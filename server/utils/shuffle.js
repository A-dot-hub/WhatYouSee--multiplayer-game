/**
 * Fisher-Yates shuffle algorithm
 * Randomly shuffles an array without modifying the original
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array
 */
function shuffle(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

module.exports = shuffle;
