const mongoose = require("mongoose");

const solvedProblemSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true },
    solvedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, index: true },
  name: { type: String, default: "" },
  profilePicture: { type: String, default: "" },
  rating: { type: Number, default: 1200 },
  problemsSolved: { type: Number, default: 0 },
  contestsParticipated: { type: Number, default: 0 },
  solvedProblems: { type: [solvedProblemSchema], default: [] },
  totalSubmissions: { type: Number, default: 0 },
  acceptedSubmissions: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);