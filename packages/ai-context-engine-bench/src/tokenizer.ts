import { get_encoding } from "tiktoken";

export const BENCHMARK_TOKENIZER = "cl100k_base";

let encoder: ReturnType<typeof get_encoding> | null = null;

function getEncoder() {
  if (!encoder) {
    encoder = get_encoding(BENCHMARK_TOKENIZER);
  }

  return encoder;
}

export function countTokens(value: string): number {
  return getEncoder().encode(value).length;
}

export function disposeTokenizer() {
  encoder?.free();
  encoder = null;
}
