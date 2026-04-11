# QuickAdd Package Export

These files are generated for repo-local QuickAdd setup.

## Files

- `playground-repo-brain.quickadd.json`
  Intended for QuickAdd's package import flow.
- `playground-repo-brain-data-snippet.json`
  Fallback snippet for manual merge into `.obsidian/plugins/quickadd/data.json`.

## Package import path

1. Open QuickAdd settings.
2. Choose `Import package...`.
3. Paste the contents of `playground-repo-brain.quickadd.json`.
4. Import the four template choices.
5. Keep template asset paths under `04 Templates/`.

## Fallback merge path

1. Back up `.obsidian/plugins/quickadd/data.json`.
2. Copy the generated `choices` entries from `playground-repo-brain-data-snippet.json`.
3. Merge them into the root `choices` array.

## Generated commands

- `Repo Brain: playground Repo Home` -> `quickadd:choice:b92f769a-5f12-4ec8-ba15-c0d5637ed4e3`
- `Repo Brain: playground Session` -> `quickadd:choice:7d4edee9-62af-4b08-a68b-96eb6d0800f7`
- `Repo Brain: playground Decision` -> `quickadd:choice:97ca94ae-f6a3-48fe-bfc5-e32d3ef89f3b`
- `Repo Brain: playground Question` -> `quickadd:choice:9a8276da-881d-435e-bfdf-9f1e9fa6f78d`
