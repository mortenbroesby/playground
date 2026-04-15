import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const createdDirs: string[] = [];

export async function createFixtureRepo(): Promise<string> {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "ai-context-engine-"));
  createdDirs.push(repoRoot);

  await mkdir(path.join(repoRoot, "src"), { recursive: true });
  await mkdir(path.join(repoRoot, "scripts"), { recursive: true });

  await writeFile(
    path.join(repoRoot, "src", "math.ts"),
    `import { formatLabel } from "./strings.js";

export const PI = 3.14;

export function area(radius: number): string {
  const value = PI * radius * radius;
  return formatLabel(value);
}
`,
  );

  await writeFile(
    path.join(repoRoot, "src", "strings.ts"),
    `export function formatLabel(value: number): string {
  return \`Area: \${value.toFixed(2)}\`;
}

export class Greeter {
  greet(name: string): string {
    return "Hello " + name;
  }
}
`,
  );

  await writeFile(
    path.join(repoRoot, "scripts", "ignored.txt"),
    "not code",
  );

  return repoRoot;
}

export async function cleanupFixtureRepos() {
  await Promise.all(
    createdDirs.splice(0).map(async (dir) => {
      await rm(dir, { recursive: true, force: true });
    }),
  );
}
