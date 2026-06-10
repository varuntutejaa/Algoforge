const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    input: { type: String, required: true },
    expected: { type: String, required: true }
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    difficulty: { type: String, required: true },
    tags: { type: [String], default: [] },
    description: { type: [String], required: true },
    constraints: { type: [String], default: [] },
    example: { type: String, required: true },
    boilerplate: {
      type: Map,
      of: String,
      required: true
    },
    testCases: { type: [testCaseSchema], required: true },
    runner: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);
