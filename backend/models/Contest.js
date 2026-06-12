const mongoose = require("mongoose");

const contestParticipantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    score: { type: Number, default: 0 },
    solvedProblems: { type: [String], default: [] },
    penalty: { type: Number, default: 0 },       // cumulative deduction (-10 per wrong attempt)
    wrongAttempts: { type: Number, default: 0 },  // total wrong submissions
    finishedAt: { type: Date, default: null }
  },
  { _id: false }
);

const contestProblemSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true },
    title: { type: String, required: true }
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
    problems: { type: [contestProblemSchema], required: true },
    participants: { type: [contestParticipantSchema], default: [] },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ["upcoming", "active", "ended"], default: "upcoming" },
    isRandom: { type: Boolean, default: false }
  },
  { timestamps: true }
);

contestSchema.index({ status: 1, startsAt: 1 });
contestSchema.index({ createdBy: 1, startsAt: -1 });
contestSchema.index({ "participants.userId": 1 });
contestSchema.index({ endsAt: 1 });

module.exports = mongoose.model("Contest", contestSchema);