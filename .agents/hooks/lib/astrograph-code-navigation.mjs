function buildReason(lines) {
  return lines.join(' ');
}

export function getAstrographBlockedExplorationReason(kind) {
  switch (kind) {
    case 'bash-search':
    case 'glob':
    case 'grep':
      return buildReason([
        'Use Astrograph for indexed code exploration.',
        'Start with `query_code` for broad code search.',
        'Use `get_file_tree` or `get_repo_outline` when you need structure instead of text search.',
        'Use direct file reads only for exact edit context or non-code support files.',
      ]);
    case 'large-read':
      return buildReason([
        'Large code read detected.',
        'Use `get_file_outline` first to inspect the file shape cheaply.',
        'If you need to find the right file, start with `query_code`.',
        'If the index may be stale or missing, use `diagnostics` and then `index_folder`.',
        'Targeted `Read` with `offset` or `limit` is fine.',
      ]);
    default:
      return buildReason([
        'Use Astrograph for indexed code exploration.',
        'Start with `query_code`.',
      ]);
  }
}
