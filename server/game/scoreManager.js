// class ScoreManager {
//   constructor() {
//     this.basePoints = 1000;
//     this.timeBonus = 500;
//   }

//   calculatePoints(position, timeRemaining, totalTime) {
//     // First correct guess gets full points
//     // Later guesses get reduced points
//     const positionMultiplier = this.getPositionMultiplier(position);

//     // Time bonus: faster guesses get more points
//     const timeRatio = timeRemaining / totalTime;
//     const timeBonusPoints = Math.floor(this.timeBonus * timeRatio);

//     const totalPoints = Math.floor((this.basePoints * positionMultiplier) + timeBonusPoints);

//     return Math.max(100, totalPoints); // Minimum 100 points
//   }

//   getPositionMultiplier(position) {
//     switch (position) {
//       case 1: return 1.0;  // 100% points
//       case 2: return 0.7;  // 70% points
//       case 3: return 0.5;  // 50% points
//       default: return 0.3; // 30% points
//     }
//   }
// }

// module.exports = ScoreManager;

class ScoreManager {
  constructor() {
    // Points are now simpler: 100 for first, 50 for rest
    // No complex time bonuses
  }

  calculatePoints(position) {
    // Position is not used anymore - server.js handles it directly
    // Keeping this for compatibility
    return position === 1 ? 100 : 50;
  }
}

module.exports = ScoreManager;
