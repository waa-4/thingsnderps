# Things & Derps

A browser lane-defense game. This cleaned v7.0 build begins Chapter 2 with World 1B.

## Clean structure

- `index.html` — page entry
- `css/game.css` — all game styling
- `js/main.js` — original core engine and shared content
- `js/chapter1.js` — consolidated Chapter 1 update layers
- `js/main2.js` — Chapter 2 and Testing Zone
- `assets/` — images grouped with Chapter 2 in `assets/chapter2/`
- `audio/` — soundtrack
- `mod/` and `pvp/` — separate modes
- `docs/` — old changelogs and notes

## Testing Zone

Open **Save Backup Terminal → Testing Zone**. Testing Mode snapshots the real save. Turning it off or reloading restores the snapshot. Testing wins and overrides are not written to the normal save.

## Chapter 2 audio

The build expects optional files named:

- `audio/chapter2-world1b.m4a`
- `audio/chapter2-world1b-boss.m4a`

When absent, the game falls back to an existing battle track.
