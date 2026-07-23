# Things & Derps Creator Studio

Open `mod/index.html` through the website, or press **Open Creator Studio** from the game.

## Normal workflow

1. Create a mod or load an installed one.
2. Add levels, Things, enemies, worlds, styling, and assets.
3. Press **Save**. This installs and enables the mod in browser storage.
4. Return to the game and reload the page.
5. Use **Installed Mods** to enable, disable, edit, import, or delete packs.

## Sharing

Press **Export .tadmod**. The downloaded file is a readable JSON mod package with a `.tadmod` extension. Images and sounds added through Asset Manager are embedded in the file.

## Updating the base game safely

The mod system is intentionally separated from the original game:

- `mod/` contains the Creator Studio.
- `js/mod-runtime.js` applies enabled mods.
- `index.html` has one extra script tag for the runtime.
- Existing game data remains in the original game scripts.

When replacing the game with a newer repository version, preserve the `mod/` folder, `js/mod-runtime.js`, and the runtime script tag in `index.html`. Installed mods remain in the browser unless site storage is cleared.

## Current V1 support

- Add or replace levels by level name
- Add Things
- Add enemies
- Organize world metadata
- Change general colors, font, borders, and corner radius
- Import images and audio into mod packages
- Install, enable, disable, edit, export, import, and delete mods

A broken mod is skipped by the runtime and reported in the browser console instead of intentionally stopping the base game.

## Creator Studio v2: editable base game

Open `mod/index.html` and choose **Load Editable Base Game**. The studio ships with a generated catalog containing every current Thing, Derp type, level, world, chapter, background key, music track, and major gameplay setting. Existing IDs replace base-game entries when the pack is enabled; cloned or new IDs add content.

The generated snapshot is isolated in `mod/base-catalog.js`, so future game updates can regenerate that one file without rebuilding the editor.
