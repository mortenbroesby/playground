#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);
const skillsRoot = path.join(repoRoot, ".skills");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  pnpm skills:list
  pnpm skills:search <query>
  pnpm skills:read <skill-name>[,<skill-name>...]
  pnpm skills:route <task description> [--json]

Notes:
  - Repo-owned skills live directly in \`.skills/\`.
  - Skill discovery is command-first and on-demand.
  - \`skills:install\` and \`skills:sync\` are intentionally unsupported in this repo architecture.`);
}

function ensureSkillsRoot() {
  if (!fs.existsSync(skillsRoot)) {
    fail("Missing .skills directory.");
  }
}

function extractDescription(contents) {
  const frontmatterMatch = contents.match(
    /^---\r?\n[\s\S]*?\r?\ndescription:\s*(.+)\r?\n[\s\S]*?\r?\n---/,
  );
  if (frontmatterMatch) {
    return frontmatterMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(
      (line) =>
        line &&
        !line.startsWith("#") &&
        line !== "---" &&
        !/^[a-z_][a-z0-9_-]*:/i.test(line),
    )
    ?? "";
}

function collectSkills(rootDir) {
  const skills = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    if (entries.some((entry) => entry.isFile() && entry.name === "SKILL.md")) {
      const skillPath = path.join(currentDir, "SKILL.md");
      const skillName = path.basename(currentDir);
      const contents = fs.readFileSync(skillPath, "utf8");
      const description = extractDescription(contents);

      skills.push({
        name: skillName,
        dir: currentDir,
        skillPath,
        relativeDir: path.relative(repoRoot, currentDir),
        description,
        contents,
      });
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }

      stack.push(path.join(currentDir, entry.name));
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function getAllSkills() {
  ensureSkillsRoot();
  return collectSkills(skillsRoot);
}

function splitRequestedSkillNames(args) {
  return args
    .flatMap((arg) => arg.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function listSkills() {
  for (const skill of getAllSkills()) {
    console.log(skill.name);
  }
}

function searchSkills(query) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    fail("`pnpm skills:search` requires a non-empty query.");
  }

  const matches = getAllSkills().filter((skill) => {
    const haystack = [
      skill.name,
      skill.relativeDir,
      skill.description,
      skill.contents.slice(0, 4000),
    ]
      .join("\n")
      .toLowerCase();

    return haystack.includes(needle);
  });

  if (matches.length === 0) {
    process.exit(1);
  }

  for (const skill of matches) {
    console.log(`${skill.name}: ${skill.description || skill.relativeDir}`);
  }
}

function readSkills(names) {
  const requestedNames = splitRequestedSkillNames(names);
  if (requestedNames.length === 0) {
    fail("`pnpm skills:read` requires at least one skill name.");
  }

  const allSkills = getAllSkills();
  const byName = new Map(allSkills.map((skill) => [skill.name, skill]));

  for (const skillName of requestedNames) {
    const skill = byName.get(skillName);
    if (!skill) {
      fail(`Unknown skill: ${skillName}`);
    }

    if (requestedNames.length > 1) {
      console.log(`=== ${skill.name} ===`);
    }
    console.log(`Base directory: ${skill.relativeDir}`);
    console.log("");
    process.stdout.write(skill.contents);
    if (!skill.contents.endsWith("\n")) {
      process.stdout.write("\n");
    }
    if (requestedNames.length > 1 && skillName !== requestedNames.at(-1)) {
      console.log("");
    }
  }
}

function normalizeText(parts) {
  return parts.join(" ").trim().toLowerCase();
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function routeTask(args) {
  const jsonMode = args.includes("--json");
  const text = normalizeText(args.filter((arg) => arg !== "--json"));

  if (!text) {
    fail("`pnpm skills:route` requires a task description.");
  }

  const route = {
    mode: "implement",
    confidence: "medium",
    rationale: [],
    primarySkill: "engineering-workflow",
    secondarySkills: [],
    extraRules: [],
    notes: [],
  };

  const mentionsAgentInfra = hasAny(text, [
    /\bagents?\.md\b/,
    /\b\.agents\b/,
    /\b\.claude\b/,
    /\b\.codex\b/,
    /\bhook\b/,
    /\brules?\b/,
    /\bskills?\b/,
    /\bbootstrap\b/,
    /\bprompt\b/,
    /\bcontext\b/,
  ]);
  const mentionsMemory = hasAny(text, [
    /\bvault\b/,
    /\bnote\b/,
    /\bnotes\b/,
    /\bdecision\b/,
    /\barchitecture\b/,
    /\bsession\b/,
    /\btask\b/,
    /\badr\b/,
    /\bmemory\b/,
  ]);
  const mentionsFrontend = hasAny(text, [
    /\bui\b/,
    /\bux\b/,
    /\bfrontend\b/,
    /\breact\b/,
    /\bnext\b/,
    /\bpage\b/,
    /\bcomponent\b/,
    /\bdesign\b/,
    /\bcss\b/,
    /\blayout\b/,
  ]);
  const asksForReview = hasAny(text, [
    /\breview\b/,
    /\baudit\b/,
    /\bcheck\b/,
    /\bfindings\b/,
    /\bcleanup\b/,
    /\bregression\b/,
  ]);
  const asksForDebug = hasAny(text, [
    /\bbug\b/,
    /\bfix\b/,
    /\bfailing\b/,
    /\bbroken\b/,
    /\berror\b/,
    /\bdebug\b/,
    /\bissue\b/,
    /\bproblem\b/,
  ]);
  const asksForPlanning = hasAny(text, [
    /\bplan\b/,
    /\baction plan\b/,
    /\bbreakdown\b/,
    /\broadmap\b/,
    /\bsteps\b/,
    /\bnext\b/,
  ]);
  const asksForSpec = hasAny(text, [
    /\bspec\b/,
    /\bproposal\b/,
    /\bdesign\b/,
    /\barchitecture\b/,
    /\badr\b/,
    /\bdecision\b/,
  ]);
  const asksForDocs = hasAny(text, [
    /\breadme\b/,
    /\bdocs?\b/,
    /\bdocument\b/,
    /\bnote\b/,
    /\bnotes\b/,
    /\badr\b/,
    /\bdecision\b/,
  ]);
  const asksForTests = hasAny(text, [
    /\btest\b/,
    /\bverify\b/,
    /\bverification\b/,
    /\bcoverage\b/,
  ]);
  const asksForShipping = hasAny(text, [
    /\bmerge\b/,
    /\bpr\b/,
    /\bpush\b/,
    /\brelease\b/,
    /\bship\b/,
  ]);
  const asksForClarification = hasAny(text, [
    /\bidea\b/,
    /\bbrainstorm\b/,
    /\bexplore\b/,
    /\bcompare\b/,
    /\bwhat if\b/,
    /\bshould we\b/,
    /\bunsure\b/,
    /\bmaybe\b/,
  ]);

  if (asksForReview) {
    route.mode = "review";
    route.primarySkill = "code-review-and-quality";
    route.secondarySkills.push("engineering-workflow");
    route.rationale.push("The task reads like review or cleanup work.");
  } else if (asksForDebug) {
    route.mode = "debug";
    route.primarySkill = "debugging-and-error-recovery";
    route.secondarySkills.push("test-driven-development");
    route.rationale.push("The task looks like bug-fix or broken-behavior work.");
  } else if (asksForPlanning && !asksForSpec) {
    route.mode = "plan";
    route.primarySkill = "planning-and-task-breakdown";
    route.secondarySkills.push("engineering-workflow");
    route.rationale.push("The task asks for a plan or ordered slices.");
  } else if (asksForSpec) {
    route.mode = "spec";
    route.primarySkill = "spec-driven-development";
    route.secondarySkills.push("engineering-workflow");
    route.rationale.push("The task changes boundaries or needs a durable design target.");
  } else if (asksForDocs && !asksForDebug) {
    route.mode = "docs";
    route.primarySkill = "documentation-and-adrs";
    route.secondarySkills.push("doc-coauthoring");
    route.rationale.push("The task centers on durable docs, notes, or ADRs.");
  } else {
    route.secondarySkills.push("incremental-implementation");
    route.rationale.push("The task looks like implementation work.");
  }

  if (asksForClarification && !asksForReview && !asksForDebug) {
    route.secondarySkills.unshift("grill-me");
    route.confidence = "low";
    route.rationale.push("The wording suggests unresolved assumptions, so grill-first is safer.");
  }

  if (asksForTests && route.primarySkill !== "test-driven-development") {
    route.secondarySkills.push("test-driven-development");
  }

  if (mentionsFrontend) {
    route.secondarySkills.push("frontend-design");
    route.extraRules.push("frontend");
    route.notes.push("Load the frontend rule only when UI or layout work is actually in scope.");
  }

  if (mentionsAgentInfra) {
    route.extraRules.push("agent-infrastructure");
    route.notes.push("Agent infrastructure work should load the path-scoped infrastructure rule.");
  }

  if (mentionsMemory || asksForDocs) {
    route.extraRules.push("memory-note-routing");
    route.notes.push("Memory-related work should load the note-routing rule before creating durable notes.");
  }

  if (asksForShipping) {
    route.secondarySkills.push("shipping-and-launch");
  }

  route.secondarySkills = unique(route.secondarySkills).filter(
    (skill) => skill !== route.primarySkill,
  );
  route.extraRules = unique(route.extraRules);

  if (route.rationale.length === 1) {
    route.confidence = "high";
  }

  const result = {
    task: text,
    alwaysApplyRules: ["repo-workflow", "skill-routing"],
    ...route,
  };

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Mode: ${result.mode}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Primary skill: ${result.primarySkill}`);
  console.log(`Secondary skills: ${result.secondarySkills.join(", ") || "(none)"}`);
  console.log(`Always-applied rules: ${result.alwaysApplyRules.join(", ")}`);
  console.log(`Extra rules: ${result.extraRules.join(", ") || "(none)"}`);
  console.log("");
  console.log("Why:");
  for (const reason of result.rationale) {
    console.log(`- ${reason}`);
  }
  if (result.notes.length > 0) {
    console.log("");
    console.log("Notes:");
    for (const note of result.notes) {
      console.log(`- ${note}`);
    }
  }
}

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }

  switch (command) {
    case "list":
      listSkills();
      return;
    case "search":
      searchSkills(args.join(" "));
      return;
    case "read":
      readSkills(args);
      return;
    case "route":
      routeTask(args);
      return;
    case "install":
      fail("`pnpm skills:install` is not supported in the root .skills architecture.");
    case "sync":
      fail("`pnpm skills:sync` is not supported. Keep AGENTS.md thin and load skills on demand.");
    default:
      fail(`Unknown skills command: ${command}`);
  }
}

main();
