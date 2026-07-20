# Legacy Changelogs

## CHANGELOG-v2.7.txt

Plants Against Derps v2.7 - Fangame Forge Update

Main fixes:
- Removed/blocked accidental alien plant ids from plant configs.
- Fixed Odd Alien image to use assets/alien.png.
- Reinforced Alien Gunner ranged shooting settings.
- Fixed duplicated add-on levels so they extend World 4 instead of looping as World 3.
- Added World 4-16 through 4-20.
- Updated homepage UI with clearer update cards.
- Grouped level select by world.
- Grouped almanac plants/enemies like the level system.
- Added save migration from older PAD v2.5/v2.6 key.
- Added missing-image friendly config group structure.

New uploaded assets:
- Moss Cannon
- Kaboom Cannon
- Three-Gun Prototype config/art, hidden from normal loadout for now
- Guntank Boi
- Unknown Cubes
- Raging Boi

Modder/Fangame Forge:
- Rebuilt modder UI with tabs.
- Improved level editor with world/difficulty metadata.
- Added Plant Maker.
- Added Derp Maker.
- Added Fangame Pack JSON export.
- Added new enemy options and bigger wave limits.


## CHANGELOG-v2.8.txt

Plants Against Derps v2.8 - Clown Multiverse Update

Added:
- World 5: Clown Multiverse, 10 chaotic hard levels.
- World 6: The Edge teaser level.
- Blood Clown Moon system: every 30-60 seconds in World 5, the red board appears for 10 seconds and derps speed up.
- New music: clownmultiverse.m4a for World 5.
- New plants: Dark Missile Cannon, Egg of Power, Burnt Treegun, Overgrown Eye, Burning Eye, Mr. Orb.
- New derps: Egg of Power, Curse of the Derp, Puppet Derp, Clown Car, Clown Derp, Edge Void.
- Every 5th story level is tagged as a Challenge level and gets tougher pressure.

Balancing:
- Plant stacking cooldowns now have a soft cap so Tree Gun / Three-Gun style plants cannot turn into boss one-tappers too quickly.
- Bosses and elite enemies now resist rapid boss-melting damage sources.
- World 5 is intentionally spammy and hard, but starts with high Glow to keep it playable.

Editor:
- Fangame Forge dropdowns know about World 5/6 backgrounds, music, and new enemies.


## CHANGELOG-v2.9.txt

Plants Against Derps v2.9 — UI + PVP Connection Test

- Rebuilt homepage into Main Game, Tools & Extras, and central update sections.
- Added experimental PVP page.
- Create or join six-character rooms.
- Supabase Realtime Presence connection test.
- Plant/Derp role preference and simple assignment.
- Send test plant, derp, and ready actions between browsers.
- Added Local Two-Tab fallback using BroadcastChannel.
- Full loadouts, rerolls, 1250 Glow, and combat are planned after connection testing.
- Existing v2.8 save key is preserved.


## CHANGELOG-v3.0.txt

THINGS & DERPS v3.0

Main changes
- Renamed the game while preserving compatible old saves.
- Rebuilt the home screen with reliable links to Story, PvP, Minigames, upgrades, shop, almanac, custom levels, modder, and backups.
- Things now aim and shoot into nearby lanes, rotate toward targets, and never intentionally shoot backward.
- Ordinary shooters deal lower damage per hit but fire much faster.
- Most Derps are slower and substantially tougher.
- Stacked Things are drawn as multiple smaller copies that fit inside their tile.
- Added visible Thing/Derp traits in the almanac.
- Bosses are enlarged, tougher, and targetable from every lane.
- Added aimed projectiles, trails, multi-target behavior, combo rewards, boss warnings, target flashes, and a best-combo result.
- Added safer story-level startup and old-save migration.

PvP repairs
- Fixed old Derp DOM sprites accumulating every render.
- Fixed target selection around planted Things.
- PvP Things can support nearby lanes rather than only their exact row.
- Updated PvP branding and navigation.

Asset repairs
- Added fallbacks for four referenced-but-missing images so those entries no longer produce broken requests.


## CHANGELOG-v3.1-test.txt

Things & Derps v3.1 — SIMPLE UI TEST

- Removed the unstable multi-column homepage layer from index.html.
- Added a fixed, centered, single-panel test menu.
- Added black background with dark-blue grid lines.
- Added safe button wrappers so a broken screen reports its function name instead of leaving a blank page.
- Added a fallback error page if the homepage itself fails.
- Kept the v3.0 combat changes and original game content.
- This is intentionally not the final visual design. It is a stability/debug build.


## CHANGELOG-v3.2.txt

Things & Derps v3.2

- Fixed every non-PvP menu opening into an invisible/blank page.
- Root cause: legacy style.css hid all dynamically rendered .screen elements unless they had an active class.
- Added compatibility overrides for Story, Minigames, Upgrades, Shop, Almanac, Custom Levels, and Save Tools.
- Restored scrolling and responsive card layouts.


## CHANGELOG-v3.3.txt

Things & Derps v3.3 — Weather & Stack Lab

- Fixed save-key loading and added autosave every 5 seconds, on tab hide, and on close.
- Added mixed Thing stacking: any Thing can share a tile with any other, up to 6.
- Every stacked Thing attacks or produces independently.
- Intentionally preserved the ridiculous stacked Glow-maker economy exploit.
- Replaced broken minigame data with four stable test minigames.
- Added 30-second weather rolls:
  * 50% Clear
  * 25% Rain (attacks roughly 50% slower)
  * 25% Clouds (screen 10% darker, costs 80% less, producers stop)
- Added weather HUD countdown and visual rain.


## CHANGELOG-v4.0.txt

THINGS & DERPS v4.0 — FOUNDATION UPDATE

This update intentionally focuses on stability rather than adding the entire v5/v6 roadmap at once.

ADDED / CHANGED
- Rebuilt homepage using a simple black and dark-blue line theme.
- Unified menu styling across Story, Minigames, Upgrades, Shop, Stats, Custom Levels, and Save Tools.
- Added a working Settings screen.
- Added a visible save-status indicator and a Save Now button.
- Autosaves every four seconds, on tab hiding, and when closing/reloading.
- Added a screen-level error catcher so broken menu actions show an error instead of a blank page.
- Compact mobile loadout picker: smaller cards, 2–3 columns, sticky Start button, and shorter descriptions.
- Renamed visible Plant wording to Thing where safe, while preserving old ids/save formats for compatibility.
- Kept v3.3 weather, mixed stacks, cross-lane combat, and intentionally overpowered Glow-maker stacking.

NOT YET IN v4.0
- The giant combat feature list is planned for v5.
- Endless, tutorial, difficulties, hazards, events, and sandbox are planned for v6.


## CHANGELOG-v5.0.txt

THINGS & DERPS v5.0 COMBAT UPDATE

- Loading text is now: “Eating cinder bricks... Please wait!”
- Story victories darken the battlefield and show HOME / NEXT.
- Added an interactive tutorial button and tutorial battle.
- Stacking remains a core mechanic, but later members deal diminishing damage.
- Every projectile independently rolls x1.00–x1.50 damage and speed.
- Glow stacks remain intentionally very strong, but production has softer returns.
- After Chapter 2 is cleared, newly spawned Derps randomly roll x1–x4 HP.
- Tough Derps display their HP multiplier over their sprite.
- Updated stable home-screen copy for v5.
