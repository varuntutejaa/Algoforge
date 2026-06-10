const mongoose = require("mongoose");

const userCodeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problemId: { type: String, required: true },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

userCodeSchema.index({ userId: 1, problemId: 1, language: 1 }, { unique: true });

module.exports = mongoose.model("UserCode", userCodeSchema);
