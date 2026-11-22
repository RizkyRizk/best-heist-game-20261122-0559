[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/RizkyRizk/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/RizkyRizk/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# Velvet Vault — Midnight at the Halcyon Gallery

A top-down stealth heist game for the [make.fun bounty](https://make.fun/bounty/best-heist-game-20261122-0559).
You are Wren, a cat-burglar breaking into the Halcyon Gallery at midnight to
steal **the Sunken Star**, a sapphire locked in the central vault case — then
slip out through the skylight exit before the Night Wardens catch you.

## How to play

- **WASD / Arrow keys** — move
- **Shift** — sneak (slower, smaller detection radius)
- **E** — grab loot / the Sunken Star / a smoke-pellet cache
- **Q, Space, or mouse click** — throw a smoke pellet (blocks vision cones, 3 max)
- **P / Esc** — pause, **M** — mute, **R** — retry when caught

Three routes reach the vault: the Main Hall, the West Corridor behind the
display cases, and the Service Passage. Guards patrol with visible vision
cones (yellow, orange when suspicious, red when alert); wall cameras sweep in
cyan and raise the alarm fastest. The alarm meter rises while you are seen
and falls while you are hidden — at 100% the alarm trips and the run is over.
Optional side loot (a portrait, a brooch, a relic) adds score, and a clean,
low-alarm getaway earns the best rating.

## Run it

Open `game/index.html` in a desktop browser (no network needed), or serve the
`game/` folder with any static server. To build the submission bundle:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Canvas 2D + vanilla JS + synthesized WebAudio only — no libraries, no assets.
