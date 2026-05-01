import test from "node:test";
import assert from "node:assert/strict";

import {
  parseMemoryMarkdown,
  validateFrontmatter,
} from "../src/memory-schema.mjs";

test("parseMemoryMarkdown parses nested links and retention data", () => {
  const result = parseMemoryMarkdown({
    path: "vault/specs/rag-rebuild.md",
    content: `---
id: "mem-20260430-rag-rebuild"
type: "spec"
repo_slug: "playground"
title: "Rebuild RAG memory"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Rebuild the repository RAG."
tags:
  - "rag"
  - "memory"
keywords:
  - "hybrid retrieval"
links:
  parents: ["mem-20260430-playground-home"]
  children: []
  related: ["mem-20260430-generated-rag-indexes"]
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: true
---

# Rebuild RAG memory

## Goal

Ship the typed registry first.
`,
  });

  assert.equal(result.ok, true);
  assert.equal(result.frontmatter.type, "spec");
  assert.deepEqual(result.frontmatter.links.parents, [
    "mem-20260430-playground-home",
  ]);
  assert.deepEqual(result.frontmatter.links.related, [
    "mem-20260430-generated-rag-indexes",
  ]);
  assert.equal(result.frontmatter.retention.keep, true);
  assert.equal(result.frontmatter.retention.expires_after, null);
  assert.match(result.body, /# Rebuild RAG memory/);
});

test("parseMemoryMarkdown rejects malformed YAML", () => {
  const result = parseMemoryMarkdown({
    path: "vault/specs/rag-rebuild.md",
    content: `---
id: "mem-20260430-rag-rebuild"
links:
  parents:
    - "mem-20260430-playground-home"
  related: [oops
---

# Broken
`,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "frontmatter.invalid_yaml");
  assert.equal(result.error.path, "vault/specs/rag-rebuild.md");
});

test("parseMemoryMarkdown rejects missing frontmatter", () => {
  const result = parseMemoryMarkdown({
    path: "vault/specs/rag-rebuild.md",
    content: "# Missing frontmatter",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "frontmatter.missing_block");
});

test("validateFrontmatter accepts a valid spec note", () => {
  const result = validateFrontmatter({
    id: "mem-20260430-rag-rebuild",
    type: "spec",
    repo_slug: "playground",
    title: "Rebuild RAG memory",
    status: "active",
    created: "2026-04-30",
    updated: "2026-04-30",
    owner: "agent",
    summary: "Rebuild the repository RAG.",
    tags: ["rag", "memory"],
    keywords: ["hybrid retrieval"],
    links: {
      parents: [],
      children: [],
      related: [],
      supersedes: [],
      superseded_by: [],
    },
    retention: {
      review_after: "2026-05-30",
      expires_after: null,
      keep: true,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.type, "spec");
  assert.equal(result.value.retention.keep, true);
});

test("validateFrontmatter rejects invalid status for type", () => {
  const result = validateFrontmatter({
    id: "mem-20260430-example",
    type: "todo",
    repo_slug: "playground",
    title: "Bad todo",
    status: "accepted",
    created: "2026-04-30",
    updated: "2026-04-30",
    owner: "agent",
    summary: "This should fail.",
    tags: [],
    keywords: [],
    links: {
      parents: [],
      children: [],
      related: [],
      supersedes: [],
      superseded_by: [],
    },
    retention: {
      review_after: null,
      expires_after: null,
      keep: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "frontmatter.invalid_status_for_type");
});

test("validateFrontmatter rejects invalid date values", () => {
  const result = validateFrontmatter({
    id: "mem-20260430-example",
    type: "spec",
    repo_slug: "playground",
    title: "Bad dates",
    status: "active",
    created: "2026-4-30",
    updated: "2026-04-30",
    owner: "agent",
    summary: "This should fail.",
    tags: [],
    keywords: [],
    links: {
      parents: [],
      children: [],
      related: [],
      supersedes: [],
      superseded_by: [],
    },
    retention: {
      review_after: null,
      expires_after: null,
      keep: false,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "frontmatter.invalid_date");
});
