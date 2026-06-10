const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Problem = require("../models/Problem");
const problemsData = require("../../problems-data");

async function seedProblems() {
  const entries = Object.values(problemsData);

  if (!entries.length) {
    console.log("No problems found in problems-data.js");
    return;
  }

  let created = 0;
  let updated = 0;

  for (const problem of entries) {
    const existing = await Problem.findOne({ id: problem.id });

    await Problem.findOneAndUpdate(
      { id: problem.id },
      {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        tags: problem.tags,
        description: problem.description,
        constraints: problem.constraints,
        example: problem.example,
        boilerplate: problem.boilerplate,
        testCases: problem.testCases,
        runner: problem.runner || null
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    if (existing) {
      updated += 1;
      console.log(`Updated: ${problem.id}`);
    } else {
      created += 1;
      console.log(`Created: ${problem.id}`);
    }
  }

  console.log(`Seed complete. Created: ${created}, Updated: ${updated}`);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await seedProblems();
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });
