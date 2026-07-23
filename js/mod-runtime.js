// Things & Derps Mod Runtime v1
// Kept separate from the base game so future game updates are easier to merge.
(() => {
  "use strict";
  const KEY = "td_mods_v1";
  const ACTIVE_KEY = "td_active_mods_v1";
  const clone = value => JSON.parse(JSON.stringify(value));
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const registry = read(KEY, []);
  const active = new Set(read(ACTIVE_KEY, []));
  const applied = [];
  const errors = [];

  function mergeObject(target, source) {
    if (!source || typeof source !== "object") return;
    for (const [key, value] of Object.entries(source)) target[key] = clone(value);
  }

  function resolveAsset(pack, ref) {
    if (!ref || typeof ref !== "string") return ref;
    const asset = (pack.assets || []).find(a => a.id === ref || a.name === ref);
    return asset?.data || ref;
  }

  function applyPack(pack) {
    if (!pack || !pack.id) throw new Error("Missing mod id");
    const content = pack.content || pack;
    mergeObject(CONFIG.images, content.images);
    mergeObject(CONFIG.backgrounds, content.backgrounds);
    if (content.audio?.tracks) mergeObject(CONFIG.audio.tracks, content.audio.tracks);

    for (const item of content.things || content.plants || []) {
      if (!item?.id) continue;
      const def = clone(item);
      delete def.id;
      if (def.img) def.img = resolveAsset(pack, def.img);
      CONFIG.plants[item.id] = def;
    }
    for (const item of content.enemies || content.derps || []) {
      if (!item?.id) continue;
      const def = clone(item);
      delete def.id;
      if (def.img) def.img = resolveAsset(pack, def.img);
      CONFIG.enemies[item.id] = def;
    }
    for (const level of content.levels || []) {
      if (!level?.name) continue;
      const copy = clone(level);
      copy.modId = pack.id;
      const i = CONFIG.levels.findIndex(x => x.name === copy.name);
      if (i >= 0) CONFIG.levels[i] = copy; else CONFIG.levels.push(copy);
    }
    if (content.theme) applyTheme(content.theme);
    applied.push(pack.id);
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const vars = {
      "--td-mod-bg": theme.background,
      "--td-mod-panel": theme.panel,
      "--td-mod-text": theme.text,
      "--td-mod-accent": theme.accent,
      "--td-mod-outline": theme.outline,
      "--td-mod-radius": Number.isFinite(Number(theme.radius)) ? `${theme.radius}px` : undefined,
      "--td-mod-font": theme.font
    };
    for (const [name, value] of Object.entries(vars)) if (value) root.style.setProperty(name, value);
    document.body.classList.add("td-modded-theme");
    let style = document.getElementById("td-mod-theme-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "td-mod-theme-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      body.td-modded-theme{background:var(--td-mod-bg,#050914)!important;color:var(--td-mod-text,#fff);font-family:var(--td-mod-font,inherit)}
      body.td-modded-theme .panel,body.td-modded-theme .screen>section{background:var(--td-mod-panel,#0b1324)!important;border-color:var(--td-mod-outline,#fff)!important;border-radius:var(--td-mod-radius,8px)!important}
      body.td-modded-theme .btn,body.td-modded-theme button{border-color:var(--td-mod-outline,#fff)!important;border-radius:var(--td-mod-radius,8px)!important}
      body.td-modded-theme .btn.good,body.td-modded-theme .btn.on{background:var(--td-mod-accent,#17345f)!important}
    `;
  }

  for (const pack of registry) {
    if (!active.has(pack.id)) continue;
    try { applyPack(pack); } catch (error) { errors.push(`${pack.name || pack.id}: ${error.message}`); }
  }

  window.TDMods = {
    registry, active, applied, errors,
    install(pack) {
      if (!pack?.id) throw new Error("This mod has no id.");
      const list = read(KEY, []);
      const i = list.findIndex(x => x.id === pack.id);
      if (i >= 0) list[i] = pack; else list.push(pack);
      write(KEY, list);
    },
    setEnabled(id, enabled) {
      const set = new Set(read(ACTIVE_KEY, []));
      enabled ? set.add(id) : set.delete(id);
      write(ACTIVE_KEY, [...set]);
    }
  };

  if (applied.length || errors.length) {
    console.info("Things & Derps mods applied:", applied);
    if (errors.length) console.warn("Mod errors:", errors);
    setTimeout(() => { try { if (typeof window.showMenu === "function") window.showMenu(); } catch {} }, 0);
  }
})();
