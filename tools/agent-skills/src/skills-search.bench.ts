#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { Bench } from "tinybench";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { rankMiniSearchMatches } from "./lib/skills-minisearch";
import type { RegistrySkill } from "./lib/skills-routing";

type SearchEvalFixture = {
  query: string;
  expected_top_1: string;
  expected_top_3: string[];
  forbidden: string[];
};

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);

function loadRegistrySkills(): RegistrySkill[] {
  return JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, ".skills", ".metadata", "registry.generated.json"),
      "utf8",
    ),
  ).skills as RegistrySkill[];
}

function loadSearchEvalFixtures(): SearchEvalFixture[] {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        "tools",
        "agent-skills",
        "src",
        "fixtures",
        "search-evals.json",
      ),
      "utf8",
    ),
  ) as SearchEvalFixture[];
}

function runAllQueries(
  skills: RegistrySkill[],
  fixtures: SearchEvalFixture[],
  searchFn: (skills: RegistrySkill[], query: string) => unknown,
): void {
  for (const fixture of fixtures) {
    searchFn(skills, fixture.query);
  }
}

async function main(): Promise<void> {
  const skills = loadRegistrySkills();
  const fixtures = loadSearchEvalFixtures();
  const bench = new Bench({ time: 500 });

  bench.add("minisearch search", () => {
    runAllQueries(skills, fixtures, rankMiniSearchMatches);
  });

  await bench.run();

  const rows = bench.tasks.map((task) => ({
    name: task.name,
    "avg ms": Number((task.result?.mean ?? 0) * 1000).toFixed(3),
    "hz": Number(task.result?.hz ?? 0).toFixed(2),
    "samples": task.result?.samples.length ?? 0,
  }));

  console.table(rows);
}

void main();
