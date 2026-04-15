import { describe, expect, it } from "vitest";

import { BENCHMARK_PACKAGE_SCAFFOLD } from "../src/index.ts";

describe("ai-context-engine-bench scaffold", () => {
  it("declares the benchmark package boundary explicitly", () => {
    expect(BENCHMARK_PACKAGE_SCAFFOLD).toEqual({
      packageName: "@playground/ai-context-engine-bench",
      dependsOn: "@playground/ai-context-engine",
    });
  });
});
