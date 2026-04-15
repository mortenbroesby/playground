import { afterEach, describe, expect, it } from "vitest";

import {
  BENCHMARK_TOKENIZER,
  countTokens,
  disposeTokenizer,
} from "../src/index.ts";

describe("benchmark tokenizer", () => {
  afterEach(() => {
    disposeTokenizer();
  });

  it("uses the cl100k_base tokenizer for exact token accounting", () => {
    expect(BENCHMARK_TOKENIZER).toBe("cl100k_base");
    expect(countTokens("hello world")).toBe(2);
    expect(
      countTokens(`export function area(radius: number): number {
  return radius * radius * 3.14;
}
`),
    ).toBe(21);
  });
});
