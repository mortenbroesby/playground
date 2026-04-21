import { mkdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findProjectRoot } from "workspace-tools";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = findProjectRoot(path.dirname(scriptPath), "pnpm");
const assetsRoot = path.join(repoRoot, "docs", "obsidian");

function parseArgs(argv) {
  const options = {
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--vault") {
      options.vaultPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--repo-slug") {
      options.repoSlug = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--repo-path") {
      options.repoPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--owner") {
      options.owner = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
  }

  return options;
}

function usage() {
  console.log(
    [
      "Usage:",
      '  pnpm obsidian:bootstrap -- --vault "/absolute/path/to/vault" [--repo-slug playground] [--repo-path "/absolute/path/to/repo"] [--owner username] [--force]',
    ].join("\n"),
  );
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath) {
  await mkdir(targetPath, { recursive: true });
}

async function writeRenderedFile(
  targetPath,
  templatePath,
  replacements,
  force,
) {
  if (!force && (await pathExists(targetPath))) {
    return { status: "skipped", targetPath };
  }

  const template = await readFile(templatePath, "utf8");
  const rendered = renderTemplate(template, replacements);

  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, rendered, "utf8");

  return { status: "written", targetPath };
}

async function copyPlainFile(sourcePath, targetPath, force) {
  if (!force && (await pathExists(targetPath))) {
    return { status: "skipped", targetPath };
  }

  await ensureDir(path.dirname(targetPath));
  await copyFile(sourcePath, targetPath);

  return { status: "written", targetPath };
}

function renderTemplate(template, replacements) {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replaceAll(key, value);
  }, template);
}

function encodeUriComponent(value) {
  return encodeURIComponent(value);
}

function buildFileUri(targetPath) {
  return pathToFileURL(targetPath).href;
}

function logResults(title, results) {
  console.log(`\n${title}`);

  for (const result of results) {
    console.log(`- ${result.status}: ${result.targetPath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.vaultPath) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const vaultPath = path.resolve(process.cwd(), args.vaultPath);
  const vaultName = path.basename(vaultPath);
  const repoSlug = args.repoSlug || path.basename(repoRoot);
  const isCurrentRepo = repoSlug === path.basename(repoRoot);
  const repoPath = args.repoPath
    ? path.resolve(process.cwd(), args.repoPath)
    : isCurrentRepo
      ? repoRoot
      : "";
  const owner = args.owner || (isCurrentRepo ? "mortenbroesby" : "unknown");
  const today = new Date().toISOString().slice(0, 10);
  const generatedOn = new Date().toISOString();
  const repoHomeRelativePath = `00 Repositories/${repoSlug}/00 Repo Home`;

  const replacements = {
    __AGENTS_URI__: buildFileUri(path.join(repoRoot, "AGENTS.md")),
    __CLAUDE_URI__: buildFileUri(path.join(repoRoot, "CLAUDE.md")),
    __AGENTS_RULES_URI__: buildFileUri(path.join(repoRoot, ".agents", "rules")),
    __AGENTS_HOOKS_URI__: buildFileUri(path.join(repoRoot, ".agents", "hooks")),
    __README_URI__: buildFileUri(path.join(repoRoot, "README.md")),
    __KANBAN_URI__: buildFileUri(path.join(repoRoot, "KANBAN.md")),
    __BRAINDUMP_URI__: buildFileUri(path.join(repoRoot, "BRAINDUMP.md")),
    __DOCS_IDEAS_URI__: buildFileUri(path.join(repoRoot, "docs", "ideas")),
    __HOST_AGENTS_URI__: buildFileUri(
      path.join(repoRoot, "apps", "host", "AGENTS.md"),
    ),
    __GENERATED_ON__: generatedOn,
    __REPO_HOME_PATH_ENCODED__: encodeUriComponent(repoHomeRelativePath),
    __REPO_PATH__: repoPath,
    __REPO_SLUG__: repoSlug,
    __TODAY__: today,
    __VAULT_NAME__: vaultName,
    __VAULT_NAME_ENCODED__: encodeUriComponent(vaultName),
    __OWNER__: owner,
  };

  const vaultDirs = [
    path.join("00 Repositories", repoSlug),
    path.join("00 Repositories", repoSlug, "01 Architecture"),
    path.join("00 Repositories", repoSlug, "02 Decisions"),
    path.join("00 Repositories", repoSlug, "03 Sessions"),
    "90 Templates",
    path.join("91 Scripts", "templater"),
  ];

  await ensureDir(vaultPath);

  for (const relativeDir of vaultDirs) {
    await ensureDir(path.join(vaultPath, relativeDir));
  }

  const copiedFiles = await Promise.all([
    copyPlainFile(
      path.join(assetsRoot, "templates", "repo-home.md"),
      path.join(vaultPath, "90 Templates", "repo-home.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templates", "repo-session.md"),
      path.join(vaultPath, "90 Templates", "repo-session.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templates", "repo-decision.md"),
      path.join(vaultPath, "90 Templates", "repo-decision.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templater", "repo_context.js"),
      path.join(vaultPath, "91 Scripts", "templater", "repo_context.js"),
      args.force,
    ),
  ]);

  const renderedFiles = await Promise.all([
    writeRenderedFile(
      path.join(vaultPath, "00 Repositories", repoSlug, "00 Repo Home.md"),
      path.join(
        assetsRoot,
        "seed",
        isCurrentRepo ? "playground-repo-home.md" : "generic-repo-home.md",
      ),
      replacements,
      args.force,
    ),
  ]);

  console.log(`Created or updated Obsidian starter files in ${vaultPath}`);
  console.log(`Repo slug: ${repoSlug}`);
  console.log(`Vault name: ${vaultName}`);
  logResults("Templates and helper scripts", copiedFiles);
  logResults("Seeded notes", renderedFiles);
  console.log("\nNext steps");
  console.log(
    "- Keep 00 Repo Home as the agent primer; link out instead of duplicating context.",
  );
  console.log("- Use 01 Architecture, 02 Decisions, and 03 Sessions only.");
  console.log("- Point Templater's script folder to 91 Scripts/templater.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
