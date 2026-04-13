# Uplink Game — Keyboard Layout & Pointer Mode (Apr 13)

## Changes

### QWERTY stagger keyboard in bottom-left
- Tap keyboard moved from inside tool button panel to fixed bottom-left of log area (x=28, y=383)
- Layout now uses QWERTY rows with stagger offsets: Q-Y / A-H / Z-B (17 keys total)
- Each row offset right by 14px (0.25 key pitch) to mimic physical keyboard stagger
- Key size increased to 52×34 for easier touch targets

### Pointer/touch multiplier
- Mouse/touch taps on keyboard keys apply a silent 1.6× progress multiplier
- No visual for the multiplier — it's a passive benefit for pointer device users

### Correct key flash
- `+HIT` flash animates upward from a key when the highlighted target key is hit
- Fires for both keyboard and pointer input (reward is for the correct key, not the input method)

### Mouse mode keyboard
- Tap keyboard now shown in mouse mode too (spawns when tool is activated via click)
- Tween auto-progress and tap bonuses stack — pointer taps can complete a tool early
- Physical keyboard also works in mouse mode (events registered unconditionally)
- Tool label stays `[EXECUTING...]` in mouse mode; keyboard shows highlighted target key
