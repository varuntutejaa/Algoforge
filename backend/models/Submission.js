const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problemId: { type: String, required: true, index: true },
    problemTitle: { type: String, required: true },
    language: { type: String, required: true },
    verdict: { type: String, required: true },
    runtime: { type: Number, default: null },
    memory: { type: Number, default: null },
    sourceCode: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
