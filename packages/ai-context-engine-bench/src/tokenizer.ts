export function estimateTokens(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}
