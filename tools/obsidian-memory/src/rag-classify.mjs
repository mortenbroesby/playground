#!/usr/bin/env node

import process from "node:process";

import { classifyMemoryInput } from "./rag-governance.mjs";

function parseArgs(argv) {
  const options = {
    input: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--input") {
      options.input = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      '  pnpm rag:classify --input "We decided to use hybrid retrieval"',
      "",
      "Classify a memory-relevant request or statement into the typed RAG workflow.",
    ].join("\n"),
  );
}

function run() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.input.trim()) {
    throw new Error("--input is required");
  }

  console.log(JSON.stringify(classifyMemoryInput(options.input), null, 2));
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
