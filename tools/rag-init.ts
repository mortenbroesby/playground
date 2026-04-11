const { spawn } = require("node:child_process");
const {
  copyFile,
  lstat,
  mkdir,
  readlink,
  stat,
  symlink,
  unlink,
} = require("node:fs/promises");
const path = require("node:path");
const process = require("node:process");

const repoRoot = path.resolve(__dirname, "..");
const defaultVaultPath = path.join(repoRoot, "vault");
const postCommitHookPath = path.join(repoRoot, "tools", "hooks", "post-commit");
const installedHookPath = path.join(repoRoot, ".git", "hooks", "post-commit");

function parseArgs(argv: string[]) {
  const options = {
    force: false,
    skipHook: false,
    skipIndex: false,
    vaultPath: defaultVaultPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--skip-hook") {
      options.skipHook = true;
      continue;
    }

    if (arg === "--skip-index") {
      options.skipIndex = true;
      continue;
    }

    if (arg === "--vault") {
      options.vaultPath = path.resolve(process.cwd(), argv[index + 1] ?? "");
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
      "  pnpm rag:init [--force] [--skip-hook] [--skip-index] [--vault ./vault]",
      "",
      "Bootstraps the repo-local Obsidian vault and portable RAG corpus.",
    ].join("\n"),
  );
}

async function pathExists(targetPath: string) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function copyTemplaterHelper(vaultPath: string, force: boolean) {
  const sourcePath = path.join(
    repoRoot,
    "docs",
    "obsidian",
    "templater",
    "repo_context.js",
  );
  const targetPath = path.join(vaultPath, "05 Scripts", "repo_context.js");

  if (!force && (await pathExists(targetPath))) {
    return "skipped";
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
  return "written";
}

async function installPostCommitHook() {
  await mkdir(path.dirname(installedHookPath), { recursive: true });

  const relativeTarget = path.relative(
    path.dirname(installedHookPath),
    postCommitHookPath,
  );

  try {
    const hookStat = await lstat(installedHookPath);

    if (hookStat.isSymbolicLink()) {
      const existingTarget = await readlink(installedHookPath);

      if (
        existingTarget === relativeTarget ||
        path.resolve(path.dirname(installedHookPath), existingTarget) ===
          postCommitHookPath
      ) {
        return "already installed";
      }

      await unlink(installedHookPath);
    } else {
      return "skipped existing non-symlink .git/hooks/post-commit";
    }
  } catch {
    // Missing hook is the common path.
  }

  await symlink(relativeTarget, installedHookPath);
  return "installed";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const vaultPath = path.resolve(options.vaultPath);
  const bootstrapArgs = [
    "scripts/bootstrap-obsidian-vault.mjs",
    "--vault",
    vaultPath,
  ];

  if (options.force) {
    bootstrapArgs.push("--force");
  }

  await runCommand("node", bootstrapArgs);

  const helperStatus = await copyTemplaterHelper(vaultPath, options.force);
  console.log(
    `Templater helper at 05 Scripts/repo_context.js: ${helperStatus}`,
  );

  if (options.skipHook) {
    console.log("Post-commit hook: skipped");
  } else {
    console.log(`Post-commit hook: ${await installPostCommitHook()}`);
  }

  if (options.skipIndex) {
    console.log("Initial RAG index: skipped");
  } else {
    await runCommand("pnpm", ["rag:index", "--vault", vaultPath]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
