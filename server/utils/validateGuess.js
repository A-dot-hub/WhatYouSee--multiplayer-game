/**
 * Validates a player's guess against the correct answer
 * Handles numeric and string comparisons with normalization
 * @param {string|number} guess - Player's guess
 * @param {string|number} correctAnswer - The correct answer
 * @returns {boolean} - True if guess matches answer
 */
function validateGuess(guess, correctAnswer) {
  const normalizedGuess = String(guess).trim().toLowerCase();
  const normalizedAnswer = String(correctAnswer).trim().toLowerCase();

  if (normalizedGuess === normalizedAnswer) {
    return true;
  }

  const guessNum = parseFloat(normalizedGuess);
  const answerNum = parseFloat(normalizedAnswer);

  if (!isNaN(guessNum) && !isNaN(answerNum)) {
    return guessNum === answerNum;
  }

  return false;
}

module.exports = validateGuess;
