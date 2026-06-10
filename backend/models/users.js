const mongoose = require("mongoose");

const solvedProblemSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true },
    solvedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, index: true },
  password: String,
  solvedProblems: { type: [solvedProblemSchema], default: [] },
  totalSubmissions: { type: Number, default: 0 },
  acceptedSubmissions: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null }
});

module.exports = mongoose.model("User", userSchema);
