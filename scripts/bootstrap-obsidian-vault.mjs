import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
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

async function writePlainFile(targetPath, content, force) {
  if (!force && (await pathExists(targetPath))) {
    return { status: "skipped", targetPath };
  }

  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, content, "utf8");

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

function createQuickAddTemplateChoice({
  name,
  templatePath,
  folderPath,
  fileNameFormat,
}) {
  return {
    id: randomUUID(),
    name,
    type: "Template",
    command: true,
    templatePath,
    fileNameFormat: {
      enabled: true,
      format: fileNameFormat,
    },
    folder: {
      enabled: true,
      folders: [folderPath],
      chooseWhenCreatingNote: false,
      createInSameFolderAsActiveFile: false,
      chooseFromSubfolders: false,
    },
    appendLink: false,
    openFileInNewTab: {
      enabled: false,
      direction: "vertical",
      focus: true,
    },
    openFile: true,
    openFileInMode: "default",
    fileExistsMode: "Increment the file name",
    setFileExistsBehavior: false,
    fileOpening: {
      location: "tab",
      direction: "vertical",
      focus: true,
      mode: "default",
    },
  };
}

async function buildQuickAddExports({ assetsRoot, generatedOn, repoSlug }) {
  const templateSpecs = [
    {
      name: `Repo Brain: ${repoSlug} Repo Home`,
      templatePath: "04 Templates/repo-home.md",
      folderPath: `02 Repositories/${repoSlug}`,
      fileNameFormat: "00 Repo Home",
    },
    {
      name: `Repo Brain: ${repoSlug} Session`,
      templatePath: "04 Templates/repo-session.md",
      folderPath: `02 Repositories/${repoSlug}/03 Sessions`,
      fileNameFormat: "{{DATE:YYYY-MM-DD}} {{VALUE:session_title|session}}",
    },
    {
      name: `Repo Brain: ${repoSlug} Decision`,
      templatePath: "04 Templates/repo-decision.md",
      folderPath: `02 Repositories/${repoSlug}/02 Decisions`,
      fileNameFormat: "{{DATE:YYYY-MM-DD}} {{VALUE:decision_title|decision}}",
    },
    {
      name: `Repo Brain: ${repoSlug} Question`,
      templatePath: "04 Templates/repo-question.md",
      folderPath: `02 Repositories/${repoSlug}/04 Questions`,
      fileNameFormat: "{{DATE:YYYY-MM-DD}} {{VALUE:question_title|question}}",
    },
  ];

  const choiceEntries = templateSpecs.map((spec) => {
    const choice = createQuickAddTemplateChoice(spec);

    return {
      choice,
      pathHint: [spec.name],
      parentChoiceId: null,
    };
  });

  const assets = await Promise.all(
    templateSpecs.map(async (spec) => {
      const templateName = path.basename(spec.templatePath);
      const content = await readFile(
        path.join(assetsRoot, "templates", templateName),
        "utf8",
      );

      return {
        kind: "template",
        originalPath: spec.templatePath,
        contentEncoding: "base64",
        content: Buffer.from(content, "utf8").toString("base64"),
      };
    }),
  );

  const packageJson = {
    schemaVersion: 1,
    quickAddVersion: "2.11.0",
    createdAt: generatedOn,
    rootChoiceIds: choiceEntries.map((entry) => entry.choice.id),
    choices: choiceEntries,
    assets,
  };

  const dataSnippetJson = {
    choices: choiceEntries.map((entry) => entry.choice),
  };

  const importReadme = `# QuickAdd Package Export

These files are generated for repo-local QuickAdd setup.

## Files

- \`${repoSlug}-repo-brain.quickadd.json\`
  Intended for QuickAdd's package import flow.
- \`${repoSlug}-repo-brain-data-snippet.json\`
  Fallback snippet for manual merge into \`.obsidian/plugins/quickadd/data.json\`.

## Package import path

1. Open QuickAdd settings.
2. Choose \`Import package...\`.
3. Paste the contents of \`${repoSlug}-repo-brain.quickadd.json\`.
4. Import the four template choices.
5. Keep template asset paths under \`04 Templates/\`.

## Fallback merge path

1. Back up \`.obsidian/plugins/quickadd/data.json\`.
2. Copy the generated \`choices\` entries from \`${repoSlug}-repo-brain-data-snippet.json\`.
3. Merge them into the root \`choices\` array.

## Generated commands

${choiceEntries
  .map(
    (entry) =>
      `- \`${entry.choice.name}\` -> \`quickadd:choice:${entry.choice.id}\``,
  )
  .join("\n")}
`;

  return {
    packageJson,
    dataSnippetJson,
    importReadme,
  };
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
  const repoHomeRelativePath = `02 Repositories/${repoSlug}/00 Repo Home`;
  const dailyAppend = `- [${repoSlug}] `;

  const replacements = {
    __AGENTS_URI__: buildFileUri(path.join(repoRoot, "AGENTS.md")),
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
    __DAILY_APPEND_ENCODED__: encodeUriComponent(dailyAppend),
    __OWNER__: owner,
  };

  const vaultDirs = [
    "00 Inbox",
    "01 Dashboard",
    path.join("02 Repositories", repoSlug),
    path.join("02 Repositories", repoSlug, "01 Architecture"),
    path.join("02 Repositories", repoSlug, "02 Decisions"),
    path.join("02 Repositories", repoSlug, "03 Sessions"),
    path.join("02 Repositories", repoSlug, "04 Questions"),
    path.join("02 Repositories", repoSlug, "05 Maps"),
    path.join("02 Repositories", repoSlug, "06 Exports"),
    path.join("02 Repositories", repoSlug, "07 Archive"),
    "03 Daily",
    "04 Templates",
    path.join("05 Scripts", "templater"),
    path.join("06 Exports", "quickadd"),
    "06 Attachments",
    "99 Archive",
  ];

  await ensureDir(vaultPath);

  for (const relativeDir of vaultDirs) {
    await ensureDir(path.join(vaultPath, relativeDir));
  }

  const copiedFiles = await Promise.all([
    copyPlainFile(
      path.join(assetsRoot, "templates", "repo-home.md"),
      path.join(vaultPath, "04 Templates", "repo-home.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templates", "repo-session.md"),
      path.join(vaultPath, "04 Templates", "repo-session.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templates", "repo-decision.md"),
      path.join(vaultPath, "04 Templates", "repo-decision.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templates", "repo-question.md"),
      path.join(vaultPath, "04 Templates", "repo-question.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templates", "daily-note.md"),
      path.join(vaultPath, "04 Templates", "daily-note.md"),
      args.force,
    ),
    copyPlainFile(
      path.join(assetsRoot, "templater", "repo_context.js"),
      path.join(vaultPath, "05 Scripts", "templater", "repo_context.js"),
      args.force,
    ),
  ]);

  const quickAddExports = await buildQuickAddExports({
    assetsRoot,
    generatedOn,
    repoSlug,
  });

  const renderedFiles = await Promise.all([
    writeRenderedFile(
      path.join(vaultPath, "01 Dashboard", "Repository Index.md"),
      path.join(assetsRoot, "seed", "repository-index.md"),
      replacements,
      args.force,
    ),
    writeRenderedFile(
      path.join(vaultPath, "02 Repositories", repoSlug, "00 Repo Home.md"),
      path.join(
        assetsRoot,
        "seed",
        isCurrentRepo ? "playground-repo-home.md" : "generic-repo-home.md",
      ),
      replacements,
      args.force,
    ),
    writeRenderedFile(
      path.join(vaultPath, "05 Scripts", "Obsidian URI Cheatsheet.md"),
      path.join(assetsRoot, "seed", "uri-cheatsheet.md"),
      replacements,
      args.force,
    ),
    writeRenderedFile(
      path.join(vaultPath, "05 Scripts", "QuickAdd Recipes.md"),
      path.join(assetsRoot, "seed", "quickadd-recipes.md"),
      replacements,
      args.force,
    ),
  ]);

  const exportedFiles = await Promise.all([
    writePlainFile(
      path.join(
        vaultPath,
        "06 Exports",
        "quickadd",
        `${repoSlug}-repo-brain.quickadd.json`,
      ),
      JSON.stringify(quickAddExports.packageJson, null, 2),
      args.force,
    ),
    writePlainFile(
      path.join(
        vaultPath,
        "06 Exports",
        "quickadd",
        `${repoSlug}-repo-brain-data-snippet.json`,
      ),
      JSON.stringify(quickAddExports.dataSnippetJson, null, 2),
      args.force,
    ),
    writePlainFile(
      path.join(vaultPath, "06 Exports", "quickadd", "README.md"),
      quickAddExports.importReadme,
      args.force,
    ),
  ]);

  console.log(`Created or updated Obsidian starter files in ${vaultPath}`);
  console.log(`Repo slug: ${repoSlug}`);
  console.log(`Vault name: ${vaultName}`);
  logResults("Templates and helper scripts", copiedFiles);
  logResults("Seeded notes", renderedFiles);
  logResults("QuickAdd exports", exportedFiles);
  console.log("\nNext steps");
  console.log(
    "- Enable Templates, Daily Notes, Properties, Bases, and Bookmarks in Obsidian.",
  );
  console.log(
    "- Install QuickAdd, Templater, Dataview, Obsidian Git, and Advanced URI.",
  );
  console.log("- Point Templater's script folder to 05 Scripts/templater.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
