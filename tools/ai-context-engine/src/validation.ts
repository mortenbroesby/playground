import type {
  ContextBundleOptions,
  SearchSymbolsOptions,
} from "./types.ts";

export function parseCliOptionalNumber(
  args: Record<string, string>,
  key: string,
): number | undefined {
  const value = args[key];
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric argument --${key}: ${value}`);
  }

  return parsed;
}

export function parseMcpOptionalNumber(
  params: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = params[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric argument: ${key}`);
  }

  return value;
}

export function requirePositiveNumber(value: number, name: string): number {
  if (value <= 0) {
    throw new Error(`${name} must be positive`);
  }

  return value;
}

export function requireNonNegativeNumber(value: number, name: string): number {
  if (value < 0) {
    throw new Error(`${name} must be non-negative`);
  }

  return value;
}

export function validateSearchSymbolsOptions(
  input: Pick<SearchSymbolsOptions, "limit">,
): void {
  if (input.limit !== undefined) {
    requirePositiveNumber(input.limit, "limit");
  }
}

export function normalizeContextBundleSeeds(
  input: Pick<ContextBundleOptions, "query" | "symbolIds">,
): Pick<ContextBundleOptions, "query" | "symbolIds"> {
  const query = input.query?.trim() ? input.query.trim() : undefined;
  const symbolIds = input.symbolIds
    ?.map((symbolId) => symbolId.trim())
    .filter(Boolean);

  if (!query && (!symbolIds || symbolIds.length === 0)) {
    throw new Error("getContextBundle requires a non-empty query or symbolIds");
  }

  return {
    query,
    symbolIds,
  };
}

export function validateContextBundleOptions(
  input: Pick<ContextBundleOptions, "query" | "symbolIds" | "tokenBudget">,
): Pick<ContextBundleOptions, "query" | "symbolIds"> {
  if (input.tokenBudget !== undefined) {
    requirePositiveNumber(input.tokenBudget, "tokenBudget");
  }

  return normalizeContextBundleSeeds(input);
}

export function validateRankedContextOptions(input: {
  tokenBudget?: number;
}): void {
  if (input.tokenBudget !== undefined) {
    requirePositiveNumber(input.tokenBudget, "tokenBudget");
  }
}

export function validateSymbolSourceOptions(input: {
  contextLines?: number;
}): void {
  if (input.contextLines !== undefined) {
    requireNonNegativeNumber(input.contextLines, "contextLines");
  }
}
