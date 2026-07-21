"use strict";
(function installChapter2AndTestingZone(){
  if (typeof CONFIG === "undefined") return;

  const VERSION = "v7.0 Forgotten Fields";
  CONFIG.version = VERSION;
  CONFIG.gameTitle = "Things & Derps";

  Object.assign(CONFIG.backgrounds, {
    derpfieldB: "assets/chapter2/backgrounds/world-1b.jpg",
    derpforest: "assets/chapter2/backgrounds/derpforest.jpg"
  });
  Object.assign(CONFIG.images, {
    derpfieldB: "assets/chapter2/backgrounds/world-1b.jpg",
    derpforest: "assets/chapter2/backgrounds/derpforest.jpg",
    sakuraHeadsplitter: "assets/chapter2/things/sakura-headsplitter.png",
    spiderStump: "assets/chapter2/things/spider-stump-gun.png",
    meltedDerp: "assets/chapter2/enemies/melted-derptriangle.png",
    derpStar: "assets/chapter2/enemies/homunculus-derpstar.png",
    decayedDerp: "assets/chapter2/enemies/rotting-derp.png"
  });

  Object.assign(CONFIG.plants, {
    sakuraHeadsplitter: {name:"Sakura Headsplitter",cost:300,hp:165,img:"sakuraHeadsplitter",desc:"Every five seconds, branches rise and crash into every lane. Massive damage to Chapter 2 enemies.",role:"Chapter 2 Global Striker",shooter:true,fireType:"multiLane",shootCooldown:300,projectileDamage:72,projectileSpeed:9,bonusVsTags:["chapter2"],bonusMultiplier:3.2,placementCooldown:420,unlockAt:"1B-3"},
    spiderStump: {name:"Spider Stump",cost:95,hp:80,img:"spiderStump",desc:"Extremely fast and cheap. Fires into three nearby lanes and is meant to be spammed.",role:"Chapter 2 Spam Shooter",shooter:true,fireType:"multiLane",shootCooldown:38,projectileDamage:8,projectileSpeed:8.5,placementCooldown:55,unlockAt:"1B-1"}
  });
  Object.assign(CONFIG.enemies, {
    meltedDerp:{name:"Melted Derptriangle",hp:980,speed:.22,damage:22,img:"meltedDerp",size:1.08,tags:["chapter2","decayed"],desc:"A triangle that did not survive storage correctly."},
    derpStar:{name:"Homunculus Derpstar",hp:740,speed:.42,damage:18,img:"derpStar",size:1.0,tags:["chapter2","star"],desc:"A false star made from an abandoned idea."},
    decayedDerp:{name:"Rotting Derp",hp:1550,speed:.13,damage:34,img:"decayedDerp",size:1.18,tags:["chapter2","decayed"],desc:"Slow, damaged, and much harder to remove than expected."}
  });

  function spam(types,count,gap=45,start=100){return Array.from({length:count},(_,i)=>({type:types[i%types.length],row:i%5,delay:i?gap:start}));}
  const replacements=[
    {name:"1B-1",title:"The Field Was Left Running",desc:"Derpfield returns as an unused, fog-filled memory. Spider Stump is unlocked after clearing it.",startGlow:900,background:"derpfieldB",music:"world1B",world:"1B",chapter:2,bWorld:true,waves:[spam(["meltedDerp","basic","derpStar"],18,48),spam(["meltedDerp","fast","derpStar"],24,42),spam(["decayedDerp","meltedDerp","derpStar"],25,44)],lava:[]},
    {name:"1B-2",title:"Overlapping Instruments",desc:"Nothing in this level agrees on what genre it belongs to.",startGlow:1050,background:"derpfieldB",music:"world1B",world:"1B",chapter:2,bWorld:true,waves:[spam(["derpStar","derpStar","meltedDerp"],28,35),spam(["decayedDerp","evilFoam","meltedDerp"],30,38),spam(["decayedDerp","derpStar","evilGlock"],34,36)],lava:[[3,1],[3,3]]},
    {name:"1B-3",title:"Branches From Above",desc:"The Sakura Headsplitter joins after this level. Chapter 2 enemies begin arriving in full groups.",startGlow:1200,background:"derpfieldB",music:"world1B",world:"1B",chapter:2,bWorld:true,waves:[spam(["decayedDerp","meltedDerp","derpStar"],34,32),spam(["meltedDerp","evilCoil","derpStar"],38,31),spam(["decayedDerp","decayedDerp","derpStar","meltedDerp"],42,30)],lava:[[2,0],[2,4],[6,2]]},
    {name:"1B-4",title:"Checkerboard Collapse",desc:"The decayed world fights with old and new enemies at once.",startGlow:1350,background:"derpfieldB",music:"world1B",world:"1B",chapter:2,bWorld:true,waves:[spam(["derpStar","evilJet","meltedDerp","fast"],42,27),spam(["decayedDerp","evilCoil","meltedDerp"],44,29),spam(["insaneStarMini","decayedDerp","derpStar","meltedDerp"],48,30)],lava:[[1,1],[1,3],[4,0],[4,4],[7,2]]},
    {name:"1B-5",title:"THE UNUSED BOSS",desc:"A breakcore remake of the beginning, now filled with everything that was left behind.",startGlow:1550,background:"derpfieldB",music:"world1BBoss",world:"1B",chapter:2,bWorld:true,boss:true,challenge:true,waves:[spam(["meltedDerp","derpStar","decayedDerp"],48,24),spam(["insaneStarMini","decayedDerp","evilCoil"],48,27),[{type:"starEye",row:2,delay:100},...spam(["decayedDerp","derpStar","meltedDerp","evilFactory"],56,24,170)]],lava:[[2,0],[2,2],[2,4],[6,0],[6,2],[6,4]]}
  ];
  CONFIG.levels = CONFIG.levels.filter(l=>!String(l.name).startsWith("1B-"));
  CONFIG.levels.push(...replacements);

  // Optional Chapter 2 audio names. Existing battle tracks remain safe fallbacks until files are replaced.
  CONFIG.audio.tracks.world1B = "audio/chapter2/derptheme1b.m4a";
  CONFIG.audio.tracks.derpforest = "audio/chapter2/derpforest.m4a";
  CONFIG.audio.tracks.world1BBoss = CONFIG.audio.tracks.world1BBoss || "audio/chapter2-world1b-boss.m4a";
  for (const key of ["world1B","world1BBoss"]){
    if (!music[key]) { music[key]=new Audio(CONFIG.audio.tracks[key]); music[key].loop=true; music[key].volume=CONFIG.audio.musicVolume; music[key].addEventListener("error",()=>{ music[key]=music.battle || music.world1; },{once:true}); }
  }


  // -------- Evil Thing tile spawning --------
  // Evil Things are removed from normal wave queues. Their types are remembered per level,
  // then they materialize on board tiles over time instead.
  const EVIL_THING_TYPES = new Set(
    Object.keys(CONFIG.enemies).filter(id => CONFIG.enemies[id]?.evilThing)
  );

  // Stationary versions still need a way to fight from their tile.
  Object.assign(CONFIG.enemies.evilFactory, {
    rangedShooter:true, shootCooldown:185, shotDamage:18, shotSpeed:4.2
  });
  Object.assign(CONFIG.enemies.evilJet, {
    rangedShooter:true, shootCooldown:92, shotDamage:13, shotSpeed:6.2
  });

  for (const level of CONFIG.levels) {
    const pool = new Set(level.evilThingPool || []);
    if (!Array.isArray(level.waves)) continue;
    level.waves = level.waves.map(wave => {
      if (!Array.isArray(wave)) return wave;
      return wave.filter(spawn => {
        if (spawn && EVIL_THING_TYPES.has(spawn.type)) {
          pool.add(spawn.type);
          return false;
        }
        return true;
      });
    });
    if (pool.size) {
      level.evilThingPool = [...pool];
      level.evilThingTileSpawns = true;
    }
  }

  function setupEvilThingTiles(){
    if (!state?.level?.evilThingTileSpawns) return;
    state.evilThingTiles = {
      pool:[...(state.level.evilThingPool || [])],
      nextTick: state.tick + rand(330, 570),
      maximumTiles: state.level.boss ? 9 : 7
    };
  }

  function spawnEvilThingOnTile(){
    const sys = state?.evilThingTiles;
    if (!sys?.pool?.length) return;
    const placed = state.enemies.filter(e => e.evilThingTile);
    const stackable = placed.filter(e => (e.evilThingStack || 1) < 4);

    // Stacking is intentionally uncommon. Reaching x4 requires several lucky rolls.
    if (stackable.length && Math.random() < 0.13) {
      const target = stackable[rand(0, stackable.length - 1)];
      const def = CONFIG.enemies[target.type] || {};
      target.evilThingStack = Math.min(4, (target.evilThingStack || 1) + 1);
      const hpGain = Math.round(Number(def.hp || target.maxHp) * 0.7);
      target.maxHp += hpGain;
      target.hp += hpGain;
      target.damage = Number(def.damage || target.damage) * (1 + 0.22 * (target.evilThingStack - 1));
      target.shotDamageMult = 1 + 0.24 * (target.evilThingStack - 1);
      state.texts.push({x:target.x,y:target.y-45,text:`EVIL STACK x${target.evilThingStack}`,color:'#ff6677',life:80});
      return;
    }

    if (placed.length >= sys.maximumTiles) return;
    const occupied = new Set(placed.map(e => `${e.evilThingCol}:${e.row}`));
    const choices=[];
    for(let col=4; col<COLS; col++) for(let row=0; row<ROWS; row++) {
      if(!occupied.has(`${col}:${row}`)) choices.push({col,row});
    }
    if(!choices.length) return;
    const tile=choices[rand(0,choices.length-1)];
    const type=sys.pool[rand(0,sys.pool.length-1)];
    const before=state.enemies.length;
    spawnEnemy({type,row:tile.row});
    const enemy=state.enemies[before];
    if(!enemy)return;
    const center=cellCenter(tile.col,tile.row);
    enemy.x=center.x;
    enemy.y=center.y;
    enemy.speed=0;
    enemy.baseSpeed=0;
    enemy.evilThingTile=true;
    enemy.evilThingCol=tile.col;
    enemy.evilThingStack=1;
    enemy.hitbox=Math.max(enemy.hitbox,46*(enemy.size||1));
    state.texts.push({x:enemy.x,y:enemy.y-45,text:'EVIL THING PLACED',color:'#ff6677',life:75});
  }

  function updateEvilThingTiles(){
    const sys=state?.evilThingTiles;
    if(!sys || state.tick < sys.nextTick) return;
    spawnEvilThingOnTile();
    sys.nextTick=state.tick+rand(390,780);
  }

  // -------- Temporary Testing Mode --------
  const TEST_SNAPSHOT="td_testing_snapshot_v1";
  const TEST_FLAGS="td_testing_flags_v1";
  let testingMode=false;
  let testingFlags={chapter1:false,chapter2:false,allLevels:false,allThings:false,maxThings:false,infiniteGlow:false,invincibleBase:false,oneHit:false,noCooldowns:false};
  const realSaveGame=window.saveGame;

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function active(){return testingMode;}
  function restoreSnapshot(){
    const raw=sessionStorage.getItem(TEST_SNAPSHOT);
    if(!raw)return;
    try{ save=JSON.parse(raw); fixSave(); localStorage.setItem(CONFIG.saveKey,JSON.stringify(save)); }
    finally{ sessionStorage.removeItem(TEST_SNAPSHOT); sessionStorage.removeItem(TEST_FLAGS); }
  }
  // A reload while testing always returns to the real save.
  if(sessionStorage.getItem(TEST_SNAPSHOT)) restoreSnapshot();

  window.saveGame=function saveGameTestingSafe(){
    if(active()){ fixSave(); return; }
    return realSaveGame();
  };
  function applyFlags(){
    if(!active())return;
    if(testingFlags.chapter1||testingFlags.allLevels) for(const l of CONFIG.levels.filter(x=>x.chapter===1)) save.cleared[l.name]=true;
    if(testingFlags.chapter2||testingFlags.allLevels){ save.cleared["6-6"]=true; for(const l of CONFIG.levels.filter(x=>x.chapter===2)) save.cleared[l.name]=true; }
    if(testingFlags.allThings) for(const id of Object.keys(CONFIG.plants)) save.unlockedPlants[id]=true;
    if(testingFlags.maxThings) for(const id of Object.keys(CONFIG.plants)) save.upgrades[id]=CONFIG.upgrades.maxLevel;
    sessionStorage.setItem(TEST_FLAGS,JSON.stringify(testingFlags));
  }
  window.tdTestingEnable=function(){
    if(active())return;
    sessionStorage.setItem(TEST_SNAPSHOT,JSON.stringify(clone(save)));
    testingMode=true; document.body.classList.add("testing-mode"); applyFlags(); showSaveBackup(); toast("Testing Mode enabled. Real progress is protected.");
  };
  window.tdTestingDisable=function(){
    if(!active()&&!sessionStorage.getItem(TEST_SNAPSHOT))return;
    restoreSnapshot(); testingMode=false; document.body.classList.remove("testing-mode"); showSaveBackup(); toast("Testing changes reverted.");
  };
  window.tdTestingToggle=function(key,checked){ testingFlags[key]=!!checked; applyFlags(); showSaveBackup(); };
  window.tdTestingNumber=function(kind){
    if(!active())return;
    const value=Math.max(0,Number(prompt(kind==="trash"?"Temporary Trash amount:":"Temporary starting Glow:",kind==="trash"?save.sticks:1000)||0));
    if(kind==="trash") save.sticks=value; else testingFlags.startGlow=value;
    applyFlags(); showSaveBackup();
  };
  window.tdTestingReset=function(){ if(!active())return; restoreSnapshot(); testingMode=true; sessionStorage.setItem(TEST_SNAPSHOT,JSON.stringify(clone(save))); testingFlags={chapter1:false,chapter2:false,allLevels:false,allThings:false,maxThings:false,infiniteGlow:false,invincibleBase:false,oneHit:false,noCooldowns:false}; showSaveBackup(); };

  const oldStart=window.startLevel;
  window.startLevel=function startLevelTesting(index,listName,selected){
    oldStart(index,listName,selected);
    setupEvilThingTiles();
    if(active()&&state){ if(Number.isFinite(testingFlags.startGlow))state.glow=testingFlags.startGlow; const banner=document.createElement("div");banner.className="testing-banner";banner.textContent="TESTING MODE — PROGRESS WILL NOT SAVE";document.body.appendChild(banner); }
  };
  const oldEffects=window.updateEffects;
  window.updateEffects=function updateEffectsTesting(){
    updateEvilThingTiles();
    if(active()&&state){ if(testingFlags.infiniteGlow)state.glow=Math.max(state.glow,99999); if(testingFlags.noCooldowns)for(const k of Object.keys(state.cooldowns||{}))state.cooldowns[k]=0; if(testingFlags.oneHit)for(const e of state.enemies||[])e.hp=Math.min(e.hp,1); if(testingFlags.invincibleBase)for(const e of state.enemies||[])e.x=Math.max(e.x,GRID_X-20); }
    return oldEffects();
  };
  const oldWin=window.winGame;
  window.winGame=function winGameTesting(){ if(!active())return oldWin(); const snap=clone(save); oldWin(); save=snap; fixSave(); const box=document.querySelector('.td5-victory section'); if(box)box.insertAdjacentHTML('afterbegin','<p class="td61-unlock">TEST WIN — REAL SAVE UNCHANGED</p>'); };

  const oldSaveScreen=window.showSaveBackup;
  window.showSaveBackup=function showSaveBackupWithTesting(){
    oldSaveScreen();
    const screen=document.querySelector('.screen'); if(!screen)return;
    const checked=k=>testingFlags[k]?'checked':'';
    screen.insertAdjacentHTML('beforeend',`<section class="panel testing-zone"><h2>Testing Zone</h2><p class="sub">Testing Mode creates a temporary copy of your save. Turning it off—or reloading—restores the real save.</p><button class="btn ${active()?'bad':'good'}" onclick="${active()?'tdTestingDisable()':'tdTestingEnable()'}">${active()?'TURN OFF & REVERT':'ACTIVATE TESTING MODE'}</button><fieldset ${active()?'':'disabled'}><legend>Temporary overrides</legend><label><input type="checkbox" ${checked('chapter1')} onchange="tdTestingToggle('chapter1',this.checked)"> All Chapter 1 levels cleared</label><label><input type="checkbox" ${checked('chapter2')} onchange="tdTestingToggle('chapter2',this.checked)"> All Chapter 2 levels cleared</label><label><input type="checkbox" ${checked('allLevels')} onchange="tdTestingToggle('allLevels',this.checked)"> Every current level cleared</label><label><input type="checkbox" ${checked('allThings')} onchange="tdTestingToggle('allThings',this.checked)"> Unlock all Things</label><label><input type="checkbox" ${checked('maxThings')} onchange="tdTestingToggle('maxThings',this.checked)"> Max Thing levels</label><label><input type="checkbox" ${checked('infiniteGlow')} onchange="tdTestingToggle('infiniteGlow',this.checked)"> Infinite Glow</label><label><input type="checkbox" ${checked('invincibleBase')} onchange="tdTestingToggle('invincibleBase',this.checked)"> Invincible base</label><label><input type="checkbox" ${checked('oneHit')} onchange="tdTestingToggle('oneHit',this.checked)"> One-hit enemies</label><label><input type="checkbox" ${checked('noCooldowns')} onchange="tdTestingToggle('noCooldowns',this.checked)"> Disable placement cooldowns</label><div class="stack"><button class="btn" onclick="tdTestingNumber('trash')">Set temporary Trash</button><button class="btn" onclick="tdTestingNumber('glow')">Set starting Glow</button><button class="btn" onclick="tdTestingReset()">Reset testing changes</button></div></fieldset></section>`);
  };

  const oldMenu=window.showMenu;
  window.showMenu=function showMenuV7(){
    document.querySelectorAll('.testing-banner').forEach(x=>x.remove()); oldMenu();
    const ver=document.querySelector('.td4-version'); if(ver)ver.textContent=`${VERSION} • Chapter 2 begins`;
    const news=document.querySelector('.td4-news'); if(news)news.innerHTML='<h2>Forgotten Fields</h2><p>Chapter 2 begins with the decayed Derpfield B, five rebuilt stages, three new Derps, Spider Stump, and Sakura Headsplitter.</p><p>The Save Backup Terminal now includes a safe Testing Zone whose changes revert when Testing Mode ends.</p>';
  };
  showMenu();
})();

// ===== Things & Derps vB.1.0 refresh =====
(function installVersionB(){
  "use strict";
  if(typeof CONFIG === "undefined") return;

  const VERSION = "vB.1.0";
  const STORY_LOADOUT_LIMIT = 10;
  const ENDLESS_NAME = "ENDLESS-50"; // old save-compatible id
  CONFIG.version = VERSION;
  CONFIG.gameplay.maxLoadoutPlants = STORY_LOADOUT_LIMIT;

  const isEndlessLevel = (level) => !!level && level.name === ENDLESS_NAME;
  const endlessIndex = () => (CONFIG.minigames || []).findIndex(isEndlessLevel);
  const endlessLevel = () => (CONFIG.minigames || [])[endlessIndex()];

  const endless = endlessLevel();
  if(endless){
    endless.title = "True Endless";
    endless.desc = "Loops forever. After wave 30, enemies shuffle and each wave gains one extra random enemy. Every 50 waves you may add five more Things.";
    endless.endless = true;
    endless.waves = endless.waves.slice(0,30);
  }

  // The normal game now allows ten Things. Endless temporarily removes the picker cap.
  const oldShowLoadoutPicker = window.showLoadoutPicker;
  window.showLoadoutPicker = function showLoadoutPickerB(index,listName){
    const level = getLevelList(listName)?.[index];
    CONFIG.gameplay.maxLoadoutPlants = isEndlessLevel(level) ? 9999 : STORY_LOADOUT_LIMIT;
    return oldShowLoadoutPicker(index,listName);
  };

  const oldToggleLoadout = window.toggleLoadout;
  window.toggleLoadout = function toggleLoadoutB(id){
    return oldToggleLoadout(id);
  };

  const oldStartPickedLevel = window.startPickedLevel;
  window.startPickedLevel = function startPickedLevelB(){
    const level = pendingLoadout && getLevelList(pendingLoadout.listName)?.[pendingLoadout.index];
    CONFIG.gameplay.maxLoadoutPlants = isEndlessLevel(level) ? 9999 : STORY_LOADOUT_LIMIT;
    const result = oldStartPickedLevel();
    CONFIG.gameplay.maxLoadoutPlants = STORY_LOADOUT_LIMIT;
    return result;
  };

  const oldStartLevelB = window.startLevel;
  window.startLevel = function startLevelB(index=0,listName="levels",loadout=CONFIG.defaultLoadout){
    const level = getLevelList(listName)?.[index];
    CONFIG.gameplay.maxLoadoutPlants = isEndlessLevel(level) ? 9999 : STORY_LOADOUT_LIMIT;
    const result = oldStartLevelB(index,listName,loadout);
    CONFIG.gameplay.maxLoadoutPlants = STORY_LOADOUT_LIMIT;
    if(state && isEndlessLevel(state.level)){
      state.tdEndless = {
        baseWaves: JSON.parse(JSON.stringify(state.level.waves.slice(0,30))),
        checkpointShown: 0
      };
    }
    return result;
  };

  function shuffle(list){
    const copy=[...list];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }

  function randomEnemyPool(){
    const preferred=["basic","fast","armored","droneGun","alienGun","mechaDerp","meltedDerp","derpStar","decayedDerp"];
    const pool=preferred.filter(id=>CONFIG.enemies[id]);
    return pool.length?pool:Object.keys(CONFIG.enemies).filter(id=>!CONFIG.enemies[id]?.evilThing);
  }

  function createEndlessWave(waveNumber){
    const sys=state.tdEndless;
    const base=sys.baseWaves[(waveNumber-1)%sys.baseWaves.length] || [];
    const wave=shuffle(base.map(s=>({...s,row:Math.floor(Math.random()*ROWS)})));
    const extras=Math.max(0,waveNumber-30);
    const pool=randomEnemyPool();
    const maxDelay=Math.max(90,...wave.map(s=>Number(s.delay||0)));
    for(let i=0;i<extras;i++){
      wave.push({
        type:pool[Math.floor(Math.random()*pool.length)],
        row:Math.floor(Math.random()*ROWS),
        delay:maxDelay+15+i*12
      });
    }
    return shuffle(wave);
  }

  function availableCheckpointThings(){
    return Object.keys(CONFIG.plants)
      .filter(id=>id!=="removeTool" && isPlantUnlocked(id) && !state.loadout.includes(id));
  }

  window.tdBCheckpointSelection = new Set();
  window.tdBToggleCheckpointThing = function(id){
    const picked=window.tdBCheckpointSelection;
    if(picked.has(id)) picked.delete(id);
    else if(picked.size<5) picked.add(id);
    else { toast("Choose up to 5 more Things."); return; }
    document.querySelectorAll("[data-tdb-thing]").forEach(btn=>{
      const on=picked.has(btn.dataset.tdbThing);
      btn.textContent=(on?"[x] ":"[ ] ")+(CONFIG.plants[btn.dataset.tdbThing]?.name||btn.dataset.tdbThing);
    });
    const count=document.getElementById("tdbCheckpointCount");if(count)count.textContent=`${picked.size} / 5 selected`;
  };
  window.tdBContinueEndless = function(){
    if(!state?.tdEndless)return;
    for(const id of window.tdBCheckpointSelection){ if(!state.loadout.includes(id))state.loadout.push(id); }
    window.tdBCheckpointSelection.clear();
    document.getElementById("tdbCheckpoint")?.remove();
    renderCards();
    state.running=true;
  };

  function showCheckpoint(waveNumber){
    if(!state?.tdEndless)return;
    state.running=false;
    window.tdBCheckpointSelection.clear();
    const choices=availableCheckpointThings();
    const overlay=document.createElement("div");
    overlay.id="tdbCheckpoint";
    overlay.className="td5-victory";
    overlay.innerHTML=`<section class="tdb-checkpoint-box"><h1>WAVE ${waveNumber}</h1><p>The battle is paused. Add up to 5 more Things.</p><p id="tdbCheckpointCount" class="tiny">0 / 5 selected</p><div class="stack">${choices.length?choices.map(id=>`<button class="btn" data-tdb-thing="${id}" onclick="tdBToggleCheckpointThing('${id}')">[ ] ${CONFIG.plants[id]?.name||id}</button>`).join(""):"<p>Every unlocked Thing is already equipped.</p>"}</div><br><button class="btn good" onclick="tdBContinueEndless()">CONTINUE ENDLESS</button></section>`;
    document.body.appendChild(overlay);
  }

  const oldUpdateWavesB=window.updateWaves;
  window.updateWaves=function updateWavesB(){
    if(state?.tdEndless && state.waveIndex>=state.level.waves.length){
      state.level.waves.push(createEndlessWave(state.waveIndex+1));
    }
    const before=state?.waveIndex;
    const result=oldUpdateWavesB();
    if(state?.tdEndless && state.waveIndex!==before && state.waveIndex>0 && state.waveIndex%50===0 && state.tdEndless.checkpointShown!==state.waveIndex){
      state.tdEndless.checkpointShown=state.waveIndex;
      showCheckpoint(state.waveIndex);
    }
    return result;
  };

  const oldCheckEndB=window.checkEnd;
  window.checkEnd=function checkEndB(){
    if(state?.tdEndless)return;
    return oldCheckEndB();
  };

  const oldUpdateHudB=window.updateHud;
  window.updateHud=function updateHudB(){
    const result=oldUpdateHudB();
    if(state?.tdEndless){
      const waveHud=document.getElementById("waveHud");
      if(waveHud)waveHud.textContent=`Wave ${state.waveIndex+1} • Endless • ${state.gameSpeed}x`;
    }
    return result;
  };

  // Final, intentionally plain homepage. No news bubble or decorative image panel.
  window.showMenu=function showMenuVersionB(){
    document.querySelectorAll('.testing-banner,#tdbCheckpoint').forEach(x=>x.remove());
    CONFIG.gameplay.maxLoadoutPlants=STORY_LOADOUT_LIMIT;
    currentScreen="menu";state=null;document.body.classList.remove("td4-loadout");
    if(typeof playMusic==="function"&&window.CONFIG?.audio?.menuTrack)playMusic(CONFIG.audio.menuTrack);
    const money=typeof currencyHtml==="function"?currencyHtml():"";
    setScreen(`<main class="td4-home"><section class="td4-shell"><div class="td4-panel"><h1 class="td4-title">Things &amp; Derps</h1><div class="td4-version">${VERSION}</div><div class="td4-status">${money}</div><nav class="td4-menu"><button class="btn td4-mainplay" onclick="td4Go('showLevelSelect')">STORY</button><button class="btn" onclick="td4Go('showMinigames')">MINIGAMES / ENDLESS</button><button class="btn" onclick="td4Pvp()">PVP</button><button class="btn" onclick="td4Go('showUpgrades')">UPGRADES</button><button class="btn" onclick="td4Go('showShop')">SHOP</button><button class="btn" onclick="td4Go('showAlmanac')">STATS</button><button class="btn" onclick="td4Go('showCustomLevels')">CUSTOM LEVELS</button><button class="btn" onclick="td4Go('showSaveBackup')">SAVE TOOLS</button><button class="btn" onclick="showSettings()">SETTINGS</button></nav><div id="td4SaveStatus" class="td4-save"></div></div></section></main>`);
  };

  // Fix old hard-coded picker wording while keeping all save ids compatible.
  const observerB=new MutationObserver(()=>{
    document.querySelectorAll('.screen .sub').forEach(el=>{
      if(el.textContent.includes('choose up to 9999')) el.textContent=el.textContent.replace(/choose up to 9999 Things?/i,'choose any number of Things');
    });
  });
  const appB=document.getElementById('app');if(appB)observerB.observe(appB,{childList:true,subtree:true});

  showMenu();
})();
