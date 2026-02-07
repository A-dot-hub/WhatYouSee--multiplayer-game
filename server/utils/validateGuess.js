function validateGuess(guess, correctAnswer) {
  const normalizedGuess = String(guess).trim().toLowerCase();
  const normalizedAnswer = String(correctAnswer).trim().toLowerCase();
  if (normalizedGuess === normalizedAnswer) return true;
  const guessNum = parseFloat(normalizedGuess);
  const answerNum = parseFloat(normalizedAnswer);
  if (!isNaN(guessNum) && !isNaN(answerNum)) return guessNum === answerNum;
  return false;
}
module.exports = validateGuess;
