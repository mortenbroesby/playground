import { describe, expect, it } from "vitest";

import { BENCHMARK_HARNESS_SCAFFOLD } from "../src/index.ts";

describe("ai-context-engine benchmark harness scaffold", () => {
  it("declares the harness as internal to the ai-context-engine workspace", () => {
    expect(BENCHMARK_HARNESS_SCAFFOLD).toEqual({
      ownerPackage: "astrograph",
      workspacePath: "tools/ai-context-engine/bench",
    });
  });
});
