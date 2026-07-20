"use strict";

// ===== Migrated from things-derps-v30.js =====
"use strict";

// Things & Derps v3.0 gameplay layer.
// Kept separate so the large original game remains easy to compare and edit.
(function installThingsDerps30(){
  const oldSaveKey = CONFIG.saveKey;
  CONFIG.version = "v3.0 - Things & Derps";
  CONFIG.gameTitle = "Things & Derps";
  CONFIG.saveKey = "thingsAndDerps_v30_save";
  CONFIG.gameplay.maxPlantStack = 6;
  CONFIG.gameplay.comboWindow = 135;
  CONFIG.gameplay.crossLaneRange = 540;

  // Keep old saves during the rename.
  if (!localStorage.getItem(CONFIG.saveKey)) {
    const previous = localStorage.getItem(oldSaveKey);
    if (previous) localStorage.setItem(CONFIG.saveKey, previous);
  }

  const traitNames = {
    nature:"Nature", machine:"Machine", explosive:"Explosive", energy:"Energy",
    support:"Support", wall:"Wall", alien:"Alien", clown:"Clown", tough:"Tough",
    flying:"Flying", assassin:"Assassin", boss:"Boss", ranged:"Ranged"
  };

  function addTrait(obj, ...traits){
    obj.traits = Array.from(new Set([...(obj.traits || []), ...traits]));
  }

  // Rebalance: Things attack rapidly but each hit is weaker.
  for (const p of Object.values(CONFIG.plants)) {
    if (p.shooter) {
      p.projectileDamage = Math.max(2, Math.round((p.projectileDamage || 20) * 0.42));
      p.shootCooldown = Math.max(10, Math.round((p.shootCooldown || 110) * 0.34));
      p.projectileSpeed = Math.max(5.5, (p.projectileSpeed || 5) * 1.2);
      p.crossLane = true;
      addTrait(p, "ranged");
    }
    if (p.producer) addTrait(p, "support", "machine");
    if (p.wall) addTrait(p, "wall");
    if (p.fuse || p.areaRadius) addTrait(p, "explosive");
    if (/tree|rose|moss|mush|bush/i.test(p.name || "")) addTrait(p, "nature");
    if (/cannon|gun|panel|fridge|factory|drone/i.test(p.name || "")) addTrait(p, "machine");
  }

  // Derps are slower and tougher, giving rapid-fire Things time to focus them.
  for (const [id,e] of Object.entries(CONFIG.enemies)) {
    e.hp = Math.max(1, Math.round(e.hp * (e.fragile ? 1 : 1.7)));
    e.speed = Math.max(0.055, e.speed * (e.fragile ? 0.92 : 0.72));
    if (e.boss) { e.size = Math.max(1.75, e.size || 1); addTrait(e,"boss","tough"); }
    if (e.tags?.includes("alien") || /alien/i.test(id)) addTrait(e,"alien");
    if (/clown|puppet|curse/i.test(id)) addTrait(e,"clown");
    if (e.flying || e.tags?.includes("drone")) addTrait(e,"flying");
    if (e.rangedShooter) addTrait(e,"ranged");
    if (e.fragile || /assasin|assassin/i.test(id)) addTrait(e,"assassin");
    if (/armored|mecha|guntank|raging|unknown|egg/i.test(id)) addTrait(e,"tough");
  }

  const originalStartLevel = startLevel;
  startLevel = function startLevelTD(index=0,listName="levels",loadout=CONFIG.defaultLoadout){
    try {
      originalStartLevel(index,listName,loadout);
      if (!state) return;
      state.combo = 0;
      state.comboTimer = 0;
      state.highestCombo = 0;
      state.bossWarned = false;
      state.traitTipShown = false;
      state.texts.push({x:canvas.width/2,y:44,text:"Cross-lane targeting online",color:"#9dfcff",life:130});
    } catch (err) {
      console.error("Story start recovery", err);
      alert("That level had broken data, so it could not start. The error was printed to the console.");
      showLevelSelect();
    }
  };

  function targetFor(p, def){
    const candidates = state.enemies.filter(e => {
      if (e.hp <= 0 || e.x < p.x - 8) return false; // never shoot backward
      const enemyDef = CONFIG.enemies[e.type] || {};
      const laneDistance = Math.abs(e.row - p.row);
      return enemyDef.boss || laneDistance <= (def.crossLaneRows ?? 2);
    });
    candidates.sort((a,b) => {
      const ad = Math.hypot(a.x-p.x,(a.y-p.y)*1.35);
      const bd = Math.hypot(b.x-p.x,(b.y-p.y)*1.35);
      return ad-bd;
    });
    return candidates.find(e => Math.hypot(e.x-p.x,e.y-p.y) <= (def.range || CONFIG.gameplay.crossLaneRange));
  }

  function fireAimed(p,target,def){
    const dx=target.x-p.x, dy=target.y-p.y;
    const len=Math.max(1,Math.hypot(dx,dy));
    const speed=def.projectileSpeed || 6;
    state.projectiles.push({
      kind:"aimed", x:p.x+dx/len*24, y:p.y+dy/len*24,
      vx:dx/len*speed, vy:dy/len*speed,
      damage:def.projectileDamage || 8, fromPlant:p.id,
      radius:def.areaRadius || 0, life:150,
      color:def.bonusVsTags ? "#9dfcff" : "#ffe27a"
    });
    p.aimAngle=Math.atan2(dy,dx);
    p.aimFlash=8;
  }

  updatePlantShooter = function updatePlantShooterTD(p,def){
    if (p.cooldown>0){ p.cooldown--; return; }
    const target=targetFor(p,def);
    if (!target) return;

    if (def.fireType === "lob") fireLob(p,target,def);
    else {
      fireAimed(p,target,def);
      if (def.doubleShotChance && rand(1,100)<=def.doubleShotChance) {
        const snapshot={...target};
        setTimeout(()=>{ if(state && state.plants.includes(p)) fireAimed(p,snapshot,def); },45);
      }
      if (def.fireType === "multiLane" || def.fireType === "scatter" || def.fireType === "wideShot") {
        const extras=state.enemies.filter(e=>e!==target&&e.x>=p.x).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,def.fireType==="wideShot"?4:2);
        extras.forEach(e=>fireAimed(p,e,{...def,projectileDamage:Math.max(1,Math.round((def.projectileDamage||8)*.7))}));
      }
      if (def.fireType === "allLane") {
        state.enemies.filter(e=>e!==target&&e.x>=p.x).slice(0,6).forEach(e=>fireAimed(p,e,{...def,projectileDamage:Math.max(1,Math.round((def.projectileDamage||8)*.55))}));
      }
    }
    p.cooldown=getStackedCooldown(p,def);
    playSfx("shoot");
  };

  const originalUpdateProjectiles=updateProjectiles;
  updateProjectiles=function updateProjectilesTD(){
    for(const pr of [...state.projectiles]){
      if(pr.kind!=="aimed") continue;
      pr.x+=pr.vx; pr.y+=pr.vy; pr.life--;
      const hit=state.enemies.find(e=>Math.hypot(e.x-pr.x,e.y-pr.y)<e.hitbox*.72+8);
      if(hit){
        const res=calcDamage(pr.damage,pr.fromPlant,hit);
        damageEnemy(hit,res.dmg,res.crit);
        if(pr.radius) explode(pr.x,pr.y,pr.radius,pr.damage,pr.fromPlant);
        state.projectiles=state.projectiles.filter(x=>x!==pr);
      } else if(pr.life<=0||pr.x>canvas.width+60||pr.y<20||pr.y>canvas.height-10){
        state.projectiles=state.projectiles.filter(x=>x!==pr);
      }
    }
    originalUpdateProjectiles();
  };

  const originalDamageEnemy=damageEnemy;
  damageEnemy=function damageEnemyTD(e,dmg,crit=false){
    const before=e.hp;
    originalDamageEnemy(e,dmg,crit);
    if(before>0 && e.hp<=0 && state){
      state.combo=(state.combo||0)+1;
      state.comboTimer=CONFIG.gameplay.comboWindow;
      state.highestCombo=Math.max(state.highestCombo||0,state.combo);
      if(state.combo>1 && state.combo%5===0){
        const bonus=Math.min(25,state.combo);
        state.glow+=bonus;
        popText(e.x,e.y-24,`COMBO ${state.combo} +${bonus} Glow`,"#9dfcff");
      }
    }
  };

  const originalUpdateEffects=updateEffects;
  updateEffects=function updateEffectsTD(){
    originalUpdateEffects();
    if(!state) return;
    if(state.comboTimer>0) state.comboTimer--;
    else state.combo=0;
    for(const p of state.plants){ if(p.aimFlash>0)p.aimFlash--; }
    const boss=state.enemies.find(e=>(CONFIG.enemies[e.type]||{}).boss);
    if(boss && !state.bossWarned){
      state.bossWarned=true; state.shake=14;
      state.texts.push({x:canvas.width/2,y:78,text:"BOSS — ALL LANES CAN TARGET IT",color:"#ffcf55",life:180});
    }
  };

  // Display every stacked Thing as smaller copies inside the same tile.
  drawPlants=function drawPlantsTD(){
    for(const p of state.plants){
      const def=getPlantStats(p.id), img=getGameImage(def.img), count=Math.max(1,p.stack||1);
      const cols=count<=1?1:count<=4?2:3, rows=Math.ceil(count/cols);
      const unit=Math.min(62,Math.max(19,58/Math.max(cols,rows)*1.55));
      for(let i=0;i<count;i++){
        const cx=i%cols, cy=Math.floor(i/cols);
        const totalW=cols*unit, totalH=rows*unit;
        const x=p.x-totalW/2+cx*unit, y=p.y-totalH/2+cy*unit;
        ctx.save();
        if(count===1 && Number.isFinite(p.aimAngle)){
          ctx.translate(p.x,p.y); ctx.rotate(Math.max(-.75,Math.min(.75,p.aimAngle))); ctx.translate(-p.x,-p.y);
        }
        if(imageReady(img)) ctx.drawImage(img,x,y,unit,unit);
        else drawFallbackSquare(x,y,unit-2,unit-2,def.name);
        ctx.restore();
      }
      if(p.aimFlash>0){ctx.strokeStyle="rgba(157,252,255,.7)";ctx.beginPath();ctx.arc(p.x,p.y,34+p.aimFlash,0,Math.PI*2);ctx.stroke();}
      if(p.hp<p.maxHp){ctx.fillStyle="#000";ctx.fillRect(p.x-30,p.y+35,60,6);ctx.fillStyle="#49ff49";ctx.fillRect(p.x-30,p.y+35,60*Math.max(0,p.hp/p.maxHp),6);}
      if(count>1){ctx.fillStyle="rgba(0,0,0,.75)";ctx.fillRect(p.x+17,p.y-38,27,17);ctx.fillStyle="#eaff6a";ctx.font="bold 11px monospace";ctx.fillText(`x${count}`,p.x+21,p.y-25);}
    }
  };

  const originalDrawProjectiles=drawProjectiles;
  drawProjectiles=function drawProjectilesTD(){
    originalDrawProjectiles();
    for(const p of state.projectiles){
      if(p.kind!=="aimed")continue;
      ctx.strokeStyle=p.color||"#ffe27a";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x-p.vx*2.4,p.y-p.vy*2.4);ctx.lineTo(p.x,p.y);ctx.stroke();
    }
  };

  const originalDrawOverlay=drawOverlay;
  drawOverlay=function drawOverlayTD(txt){
    originalDrawOverlay(txt);
    if(state?.highestCombo>1){ctx.fillStyle="#9dfcff";ctx.font="bold 18px system-ui";ctx.textAlign="center";ctx.fillText(`Best combo: ${state.highestCombo}`,canvas.width/2,canvas.height/2+38);ctx.textAlign="left";}
  };

  const oldUpdateHud=updateHud;
  updateHud=function updateHudTD(){
    oldUpdateHud();
    const hud=document.getElementById("waveHud");
    if(hud && state?.combo>1) hud.textContent+=` • COMBO x${state.combo}`;
  };

  // More useful home page and safe links to every major mode.
  window.openPadPvp=()=>location.href="pvp/";
  showMenu=function showMenuTD(){
    currentScreen="menu"; state=null; playMusic(CONFIG.audio.menuTrack);
    setScreen(`<div class="td-home">
      <section class="panel td-hero"><div class="tiny">${CONFIG.version}</div><h1 class="title">Things &amp; Derps</h1><p class="sub">Rapid-fire cross-lane strategy, visual stacking, traits, giant multi-lane bosses, Story, PvP, and chaos.</p><div class="td-main-actions"><button class="btn good" onclick="showLevelSelect()">PLAY STORY</button><button class="btn td-pvp" onclick="openPadPvp()">PVP</button><button class="btn" onclick="showMinigames()">MINIGAMES</button></div>${currencyHtml()}</section>
      <section class="panel"><h2>Build & Progress</h2><div class="td-grid"><button class="btn" onclick="showUpgrades()">Upgrade Things</button><button class="btn" onclick="showLevelSelect()">Equip Loadout</button><button class="btn" onclick="showShop()">Twig Shop</button><button class="btn" onclick="showAlmanac()">Things, Derps & Traits</button></div></section>
      <section class="panel"><h2>Create & Repair</h2><div class="td-grid"><button class="btn" onclick="showCustomLevels()">Custom Levels</button><button class="btn" onclick="location.href='mod/'">Modder / Fangame Forge</button><button class="btn warn" onclick="showSaveBackup()">Save Backup</button><button class="btn" onclick="location.reload()">Reload Game</button></div><p class="tiny">v3.0 validates story startup and keeps old saves during the rename.</p></section>
    </div>`);
  };

  const oldShowAlmanac=showAlmanac;
  showAlmanac=function showAlmanacTD(){
    oldShowAlmanac();
    document.querySelectorAll(".card").forEach(card=>{
      const title=card.querySelector("h3")?.textContent;
      if(!title)return;
      const obj=[...Object.values(CONFIG.plants),...Object.values(CONFIG.enemies)].find(x=>x.name===title);
      if(obj?.traits?.length){card.insertAdjacentHTML("beforeend",`<div class="trait-row">${obj.traits.map(t=>`<span>${traitNames[t]||t}</span>`).join("")}</div>`);}
    });
  };

  // Replace the previous UI layer's already-rendered homepage.
  showMenu();
})();

// ===== Migrated from ui-test.js =====
"use strict";
(function installSimpleTestUI(){
  function safeCall(name){
    return function(){
      try{
        const fn=window[name];
        if(typeof fn!=="function") throw new Error(name+" is unavailable");
        fn();
      }catch(err){
        console.error(err);
        alert("This test button failed: "+name+"\nCheck the browser console for details.");
      }
    };
  }

  window.tdTestStory=safeCall("showLevelSelect");
  window.tdTestMinigames=safeCall("showMinigames");
  window.tdTestUpgrades=safeCall("showUpgrades");
  window.tdTestShop=safeCall("showShop");
  window.tdTestAlmanac=safeCall("showAlmanac");
  window.tdTestCustom=safeCall("showCustomLevels");
  window.tdTestSaves=safeCall("showSaveBackup");
  window.tdTestPvp=function(){ location.href="pvp/"; };

  window.showMenu=function showSimpleTestMenu(){
    try{
      currentScreen="menu";
      state=null;
      if(typeof playMusic==="function" && window.CONFIG?.audio?.menuTrack) playMusic(CONFIG.audio.menuTrack);
      const money=(typeof currencyHtml==="function") ? currencyHtml() : "";
      setScreen(`
        <main class="td-test-home">
          <section class="td-test-menu" aria-label="Things and Derps test menu">
            <h1>Things &amp; Derps</h1>
            <div class="version">Simple UI Test Build v3.2</div>
            <div class="currency">${money}</div>
            <div class="td-test-actions">
              <button class="btn primary" onclick="tdTestStory()">PLAY STORY</button>
              <button class="btn" onclick="tdTestPvp()">PVP TEST</button>
              <button class="btn" onclick="tdTestMinigames()">MINIGAMES</button>
              <button class="btn" onclick="tdTestUpgrades()">UPGRADES</button>
              <button class="btn" onclick="tdTestShop()">SHOP</button>
              <button class="btn" onclick="tdTestAlmanac()">STATS / ALMANAC</button>
              <button class="btn" onclick="tdTestCustom()">CUSTOM LEVELS</button>
              <button class="btn" onclick="tdTestSaves()">SAVE TOOLS</button>
              <button class="btn" onclick="location.reload()">RELOAD</button>
            </div>
            <p class="td-test-note">This intentionally uses a plain centered menu so we can verify every screen and button before rebuilding the final UI.</p>
          </section>
        </main>`);
    }catch(err){
      console.error("Simple menu failed",err);
      document.body.innerHTML='<main style="padding:24px;color:white;background:#02070b;min-height:100vh"><h1>Things & Derps</h1><p>The test menu failed to load. Open the browser console to see the error.</p><pre style="white-space:pre-wrap">'+String(err)+'</pre></main>';
    }
  };

  window.showMenu();
})();

// ===== Migrated from things-derps-v33.js =====
"use strict";

// Things & Derps v3.3 stability + sandbox update.
(function installThingsDerps33(){
  if (typeof CONFIG === "undefined") return;

  CONFIG.version = "v3.3 - Weather & Stack Lab";
  CONFIG.gameTitle = "Things & Derps";
  CONFIG.saveKey = "thingsAndDerps_v30_save";
  CONFIG.gameplay.maxPlantStack = 6;

  // v3.0 changed the save key after the original boot had already loaded.
  // Reload the correct key now, then keep writing it automatically.
  try { if (typeof loadSave === "function") loadSave(); } catch (err) { console.warn(err); }
  const autosave = () => { try { if (typeof saveGame === "function") saveGame(); } catch (err) { console.warn("Autosave failed", err); } };
  setInterval(autosave, 5000);
  addEventListener("pagehide", autosave);
  addEventListener("beforeunload", autosave);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") autosave(); });

  // Replace the unreliable inherited minigame list with simple, known-good games.
  const safeMinigames = [
    {
      name: "Rapid Fire Test", title: "Glow Spam Laboratory",
      desc: "Start rich, stack producers, and turn the board into projectile soup.",
      startGlow: 1200, background: "forest", music: "battle", lava: [],
      waves: [
        [{type:"basic",row:0,delay:40},{type:"basic",row:1,delay:70},{type:"basic",row:2,delay:100},{type:"basic",row:3,delay:130},{type:"basic",row:4,delay:160}],
        [{type:"fast",row:0,delay:70},{type:"fast",row:4,delay:100},{type:"armored",row:2,delay:180}],
        [{type:"ragingBoi",row:2,delay:180}]
      ]
    },
    {
      name: "Cross Lane Panic", title: "Everybody Yells Sideways",
      desc: "Enemies enter every row. Cross-lane targeting is the entire point.",
      startGlow: 800, background: "matrixGrid", music: "desert", lava: [[4,1],[4,3]],
      waves: [
        [{type:"basic",row:0,delay:50},{type:"basic",row:4,delay:50},{type:"fast",row:2,delay:120}],
        [{type:"armored",row:1,delay:80},{type:"armored",row:3,delay:120},{type:"alienGun",row:2,delay:220}],
        [{type:"droneSaw",row:0,delay:120},{type:"droneGun",row:4,delay:180}]
      ]
    },
    {
      name: "Weather Station", title: "Thirty Second Forecast",
      desc: "A longer battle made for testing Clear, Rain, and Clouds.",
      startGlow: 650, background: "cloud", music: "battle", lava: [],
      waves: [
        [{type:"basic",row:2,delay:120},{type:"basic",row:1,delay:420},{type:"basic",row:3,delay:720}],
        [{type:"fast",row:0,delay:180},{type:"fast",row:4,delay:480},{type:"armored",row:2,delay:900}],
        [{type:"guntankBoi",row:2,delay:900}]
      ]
    },
    {
      name: "Big Target", title: "Boss Target Practice",
      desc: "A giant enemy can be shot from every lane. Bring absurd stacks.",
      startGlow: 1500, background: "milkyway", music: "finalBoss", lava: [],
      waves: [
        [{type:"basic",row:0,delay:80},{type:"basic",row:4,delay:130}],
        [{type:"alienFinalBoss",row:2,delay:300}]
      ]
    }
  ];
  window.MINIGAMES = safeMinigames;
  CONFIG.minigames = safeMinigames;

  function weatherCost(def){
    if (!def || def.tool) return Number(def?.cost || 0);
    return state?.weather?.type === "clouds" ? Math.max(1, Math.ceil(def.cost * 0.20)) : def.cost;
  }

  function ensureStackData(p){
    if (!Array.isArray(p.stackUnits) || !p.stackUnits.length) {
      p.stackUnits = Array.from({length: Math.max(1, p.stack || 1)}, () => p.id);
    }
    p.stack = p.stackUnits.length;
    p.unitCooldowns = Array.isArray(p.unitCooldowns) ? p.unitCooldowns : [];
    p.unitTicks = Array.isArray(p.unitTicks) ? p.unitTicks : [];
    p.unitFuses = Array.isArray(p.unitFuses) ? p.unitFuses : [];
    while (p.unitCooldowns.length < p.stack) p.unitCooldowns.push(0);
    while (p.unitTicks.length < p.stack) p.unitTicks.push(Math.floor(Math.random()*50));
    while (p.unitFuses.length < p.stack) p.unitFuses.push(0);
  }

  function addToStack(existing, id, def){
    ensureStackData(existing);
    if (existing.stackUnits.length >= CONFIG.gameplay.maxPlantStack) {
      playSfx("no"); popText(existing.x, existing.y, "MAX STACK", "#ffef8a"); return;
    }
    const cost = weatherCost(def);
    if ((state.cooldowns[id] || 0) > 0 || state.glow < cost) {
      playSfx("no"); if (state.glow < cost) popText(existing.x, existing.y, "Need Glow", "#ffd36a"); return;
    }
    state.glow -= cost;
    state.cooldowns[id] = def.placementCooldown || 120;
    existing.stackUnits.push(id);
    existing.stack = existing.stackUnits.length;
    existing.unitCooldowns.push(0);
    existing.unitTicks.push(Math.floor(Math.random()*50));
    existing.unitFuses.push(def.fuse || 0);
    existing.maxHp += Math.max(5, Math.round(def.hp * 0.45));
    existing.hp = Math.min(existing.maxHp, existing.hp + Math.round(def.hp * 0.65));
    addParticles(existing.x, existing.y, "#caff6a", 14);
    popText(existing.x, existing.y, `MIX x${existing.stack}`, "#d8ff6a");
    playSfx("plant"); renderCards(); updateHud();
  }

  // Any Thing may now be stacked with any other Thing in the same tile.
  window.useSelectedOnCell = function useSelectedOnCellV33(col,row){
    const id = state.selectedPlant;
    const def = getPlantStats(id);
    if (!def) return;
    const key = `${col},${row}`;
    const existing = state.plants.find(p => p.col === col && p.row === row);

    if (def.tool === "remove") {
      if (existing) {
        state.plants = state.plants.filter(p => p !== existing);
        state.glow += Math.floor((existing.cost || 0) * CONFIG.gameplay.removeRefundPercent);
        popText(existing.x, existing.y, "Refund!", "#8ff"); playSfx("glow");
      }
      return;
    }
    if (state.lava.has(key)) { playSfx("no"); popText(GRID_X+col*CELL_W+20,GRID_Y+row*CELL_H+30,"NOPE","#f66"); return; }
    if ((state.cooldowns[id] || 0) > 0) { playSfx("no"); return; }
    const cost = weatherCost(def);
    if (state.glow < cost) { playSfx("no"); popText(GRID_X+col*CELL_W+15,GRID_Y+row*CELL_H+35,"Need Glow","#ffd36a"); return; }

    if (def.instantLaunch) {
      state.glow -= cost; state.cooldowns[id] = def.placementCooldown || 120;
      launchBeachBall(col,row,def); playSfx("shoot"); renderCards(); updateHud(); return;
    }
    if (existing) { addToStack(existing,id,def); return; }

    const c = cellCenter(col,row);
    state.glow -= cost; state.cooldowns[id] = def.placementCooldown || 120;
    state.plants.push({
      id,col,row,x:c.x,y:c.y,hp:def.hp,maxHp:def.hp,cost,
      stack:1,stackUnits:[id],unitCooldowns:[0],unitTicks:[Math.floor(Math.random()*50)],unitFuses:[def.fuse||0],
      tick:Math.floor(Math.random()*40),fuse:def.fuse||0,hitGlowCd:0
    });
    addParticles(c.x,c.y,"#7cff6b",8); playSfx("plant"); renderCards(); updateHud();
  };

  // Every member of a mixed stack keeps its own attack/producer timer.
  window.updatePlants = function updatePlantsV33(){
    for (const p of [...state.plants]) {
      ensureStackData(p);
      if (p.hitGlowCd > 0) p.hitGlowCd--;
      let removeWhole = false;
      for (let i=0; i<p.stackUnits.length; i++) {
        const unitId = p.stackUnits[i];
        const def = getPlantStats(unitId);
        if (!def) continue;
        p.unitTicks[i]++;

        if (def.producer && state.weather?.type !== "clouds") {
          const cd = getStackedProducerCooldown(p,def);
          if (p.unitTicks[i] % cd === 0) {
            // Intentionally ridiculous: each stacked producer runs independently,
            // while the old stack speed multiplier also remains.
            const produced = Math.round(def.produceAmount * (1 + (p.stack-1)*0.35));
            state.glow += produced;
            addParticles(p.x,p.y,"#ffe76a",8+p.stack);
            popText(p.x + (i%3-1)*12,p.y,`+${produced}`,"#ffe76a");
            playSfx("glow");
          }
        }

        if (def.shooter) {
          // Rain makes attacks approximately 50% slower.
          if (!(state.weather?.type === "rain" && state.tick % 3 === 0)) {
            const oldId = p.id;
            p.id = unitId;
            p.cooldown = p.unitCooldowns[i] || 0;
            updatePlantShooter(p,def);
            p.unitCooldowns[i] = p.cooldown || 0;
            p.id = oldId;
          }
        }

        if (def.fuse) {
          if (!p.unitFuses[i]) p.unitFuses[i] = def.fuse;
          p.unitFuses[i]--;
          if (p.unitFuses[i] <= 0) {
            explode(p.x,p.y,def.radius,def.damage,"kaboom");
            p.stackUnits.splice(i,1); p.unitCooldowns.splice(i,1); p.unitTicks.splice(i,1); p.unitFuses.splice(i,1); i--;
          }
        }
      }
      p.stack = p.stackUnits.length;
      if (!p.stack || p.hp <= 0 || removeWhole) state.plants = state.plants.filter(x=>x!==p);
    }
  };

  window.drawPlants = function drawPlantsV33(){
    for (const p of state.plants) {
      ensureStackData(p);
      const count=p.stackUnits.length, cols=count<=1?1:count<=4?2:3, rows=Math.ceil(count/cols);
      const unit=Math.min(62,Math.max(19,58/Math.max(cols,rows)*1.55));
      for(let i=0;i<count;i++){
        const id=p.stackUnits[i], def=getPlantStats(id), img=getGameImage(def.img);
        const cx=i%cols, cy=Math.floor(i/cols), totalW=cols*unit,totalH=rows*unit;
        const x=p.x-totalW/2+cx*unit,y=p.y-totalH/2+cy*unit;
        ctx.save();
        if(count===1 && Number.isFinite(p.aimAngle)){ctx.translate(p.x,p.y);ctx.rotate(Math.max(-.75,Math.min(.75,p.aimAngle)));ctx.translate(-p.x,-p.y);}
        if(imageReady(img)) ctx.drawImage(img,x,y,unit,unit); else drawFallbackSquare(x,y,unit-2,unit-2,def.name);
        ctx.restore();
      }
      if(p.aimFlash>0){ctx.strokeStyle="rgba(157,252,255,.7)";ctx.beginPath();ctx.arc(p.x,p.y,34+p.aimFlash,0,Math.PI*2);ctx.stroke();}
      if(p.hp<p.maxHp){ctx.fillStyle="#000";ctx.fillRect(p.x-30,p.y+35,60,6);ctx.fillStyle="#49ff49";ctx.fillRect(p.x-30,p.y+35,60*Math.max(0,p.hp/p.maxHp),6);}
      if(count>1){ctx.fillStyle="rgba(0,0,0,.75)";ctx.fillRect(p.x+17,p.y-38,27,17);ctx.fillStyle="#eaff6a";ctx.font="bold 11px monospace";ctx.fillText(`x${count}`,p.x+21,p.y-25);}
    }
  };

  // Weather begins clear. Every 30 seconds: 50% stays clear, 50% becomes Rain or Clouds.
  const previousStartLevel = startLevel;
  window.startLevel = function startLevelV33(index=0,listName="levels",loadout=CONFIG.defaultLoadout){
    previousStartLevel(index,listName,loadout);
    if (state) state.weather = {type:"clear", nextTick:state.tick + 30*60};
  };

  function rollWeather(){
    const old = state.weather?.type || "clear";
    const type = Math.random() < 0.5 ? "clear" : (Math.random() < 0.5 ? "rain" : "clouds");
    state.weather = {type,nextTick:state.tick+30*60};
    const labels={clear:"CLEAR",rain:"RAIN — ATTACKS SLOWER",clouds:"CLOUDS — 80% OFF, PRODUCERS STOP"};
    state.texts.push({x:canvas.width/2,y:70,text:labels[type],color:type==="rain"?"#8fd8ff":type==="clouds"?"#ddddff":"#fff59a",life:180});
    if (old !== type) renderCards();
  }

  const previousUpdateEffects = updateEffects;
  window.updateEffects = function updateEffectsV33(){
    previousUpdateEffects();
    if (!state) return;
    if (!state.weather) state.weather={type:"clear",nextTick:state.tick+30*60};
    if (state.tick >= state.weather.nextTick) rollWeather();
  };

  const previousDrawBackground = drawBackground;
  window.drawBackground = function drawBackgroundV33(){
    previousDrawBackground();
    if (!state?.weather) return;
    if (state.weather.type === "clouds") {
      ctx.fillStyle="rgba(0,0,0,.10)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    } else if (state.weather.type === "rain") {
      ctx.fillStyle="rgba(30,70,100,.10)"; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle="rgba(170,220,255,.38)"; ctx.lineWidth=2;
      for(let i=0;i<38;i++){
        const x=(i*83 + state.tick*5)%canvas.width, y=(i*47 + state.tick*9)%canvas.height;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+18);ctx.stroke();
      }
    }
  };

  const previousUpdateHud = updateHud;
  window.updateHud = function updateHudV33(){
    previousUpdateHud();
    const hud=document.getElementById("waveHud");
    if(hud && state?.weather){
      const label=state.weather.type==="clear"?"Clear":state.weather.type==="rain"?"Rain":"Clouds";
      const seconds=Math.max(0,Math.ceil((state.weather.nextTick-state.tick)/60));
      hud.textContent += ` • ${label} ${seconds}s`;
    }
  };

  window.renderCards = function renderCardsV33(){
    const bar=document.getElementById("plantBar"); if(!bar||!state)return;
    bar.innerHTML=state.loadout.map(id=>{
      const p=getPlantStats(id), cd=Math.ceil((state.cooldowns[id]||0)/60), selected=state.selectedPlant===id;
      const cost=weatherCost(p), sale=!p.tool && cost!==p.cost;
      return `<button class="plantCard ${selected?"selected":""} ${cd>0?"cool":""}" onclick="selectPlant('${id}')">
        <div class="name">${p.name}</div>${imgTag(p.img,38)}
        <div class="cost">${p.tool?"Tool":`${sale?`<s>${p.cost}</s> `:""}${cost} Glow`}</div>
        <div class="tiny">${cd>0?"CD "+cd+"s":p.role}</div></button>`;
    }).join("");
  };

  // Make the simple menu report the current build and save immediately before navigation.
  const oldShowMenu = window.showMenu;
  window.showMenu = function showMenuV33(){ autosave(); oldShowMenu(); const v=document.querySelector(".version"); if(v)v.textContent="Simple UI Test Build v3.3"; };

  autosave();
  showMenu();
})();

// ===== Migrated from v4-foundation.js =====
"use strict";
(function installThingsDerpsV4(){
  const VERSION="v4.0 Foundation";
  if(window.CONFIG){CONFIG.version=VERSION;CONFIG.gameTitle="Things & Derps";}

  const settingsKey="thingsAndDerps_v4_settings";
  const defaults={music:true,sfx:true,reducedMotion:false,compactMobile:true,autosave:true};
  let settings={...defaults};
  try{settings={...defaults,...JSON.parse(localStorage.getItem(settingsKey)||"{}")};}catch(_e){}
  window.td4Settings=settings;
  function saveSettings(){localStorage.setItem(settingsKey,JSON.stringify(settings));applySettings();}
  function applySettings(){
    document.documentElement.classList.toggle("td4-reduced-motion",!!settings.reducedMotion);
    document.body.classList.toggle("td4-compact-mobile",!!settings.compactMobile);
    try{
      if(window.CONFIG?.audio){CONFIG.audio.enabled=settings.music!==false;}
      if(window.musicEl) musicEl.muted=settings.music===false;
      if(window.sfxEl) sfxEl.muted=settings.sfx===false;
    }catch(_e){}
  }
  applySettings();

  let lastSaved=Date.now();
  function forceSave(label="Saved"){
    if(settings.autosave===false)return;
    try{if(typeof saveGame==="function")saveGame();lastSaved=Date.now();updateSaveText(label);}catch(e){console.warn("v4 save failed",e);updateSaveText("Save failed");}
  }
  function updateSaveText(prefix="Autosaved"){
    const el=document.getElementById("td4SaveStatus");if(el)el.textContent=`${prefix} • ${new Date(lastSaved).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  }
  window.td4ForceSave=()=>forceSave("Saved now");
  setInterval(()=>forceSave("Autosaved"),4000);
  addEventListener("pagehide",()=>forceSave("Saved"));
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")forceSave("Saved");});

  function call(name){
    try{forceSave("Saved");const fn=window[name];if(typeof fn!=="function")throw new Error(name+" is unavailable");fn();}
    catch(err){showCrash(name,err);}
  }
  window.td4Go=call;
  window.td4Pvp=()=>{forceSave("Saved");location.href="pvp/";};
  function showCrash(action,err){
    console.error(err);
    document.body.classList.remove("td4-loadout");
    const target=window.app||document.getElementById("app")||document.body;
    target.innerHTML=`<div class="td4-crash"><h1>That screen broke</h1><p><b>${action}</b> failed, but the rest of the website is still alive.</p><code>${String(err?.stack||err)}</code><br><br><button class="btn" onclick="showMenu()">Return to Menu</button></div>`;
  }

  window.showSettings=function showSettingsV4(){
    currentScreen="settings";state=null;document.body.classList.remove("td4-loadout");
    setScreen(`<div class="screen"><div class="topbar"><button class="btn" onclick="showMenu()">← Menu</button>${typeof currencyHtml==='function'?currencyHtml():''}</div><div class="td4-panel td4-settings"><h1 class="title">Settings</h1><div class="td4-setting"><div><b>Music</b><div class="tiny">Main menu and battle music.</div></div><input id="td4Music" type="checkbox" ${settings.music?'checked':''}></div><div class="td4-setting"><div><b>Sound effects</b><div class="tiny">Shots, clicks, explosions, and other noises.</div></div><input id="td4Sfx" type="checkbox" ${settings.sfx?'checked':''}></div><div class="td4-setting"><div><b>Compact mobile menus</b><div class="tiny">Keeps the Thing picker short instead of becoming an endless wall.</div></div><input id="td4Compact" type="checkbox" ${settings.compactMobile?'checked':''}></div><div class="td4-setting"><div><b>Reduced motion</b><div class="tiny">Cuts down decorative movement.</div></div><input id="td4Motion" type="checkbox" ${settings.reducedMotion?'checked':''}></div><div class="td4-setting"><div><b>Autosave</b><div class="tiny">Saves every four seconds and whenever the page closes.</div></div><input id="td4Autosave" type="checkbox" ${settings.autosave?'checked':''}></div><br><button class="btn good" onclick="td4ApplySettings()">Apply Settings</button> <button class="btn" onclick="td4ForceSave()">Save Now</button><p id="td4SaveStatus" class="td4-save"></p></div></div>`);updateSaveText("Last save");
  };
  window.td4ApplySettings=function(){
    settings.music=document.getElementById("td4Music").checked;settings.sfx=document.getElementById("td4Sfx").checked;settings.compactMobile=document.getElementById("td4Compact").checked;settings.reducedMotion=document.getElementById("td4Motion").checked;settings.autosave=document.getElementById("td4Autosave").checked;saveSettings();forceSave("Settings saved");if(typeof toast==='function')toast("Settings applied");
  };

  window.showMenu=function showFoundationMenu(){
    try{
      currentScreen="menu";state=null;document.body.classList.remove("td4-loadout");
      if(typeof playMusic==="function"&&settings.music!==false&&window.CONFIG?.audio?.menuTrack)playMusic(CONFIG.audio.menuTrack);
      const money=typeof currencyHtml==="function"?currencyHtml():"";
      setScreen(`<main class="td4-home"><section class="td4-shell"><div class="td4-panel"><h1 class="td4-title">Things<br>&amp; Derps</h1><div class="td4-version">${VERSION} • stable test interface</div><div class="td4-status">${money}</div><div class="td4-menu"><button class="btn good td4-mainplay" onclick="td4Go('showLevelSelect')">PLAY STORY</button><button class="btn" onclick="td4Pvp()">PVP</button><button class="btn" onclick="td4Go('showMinigames')">MINIGAMES</button><button class="btn" onclick="td4Go('showUpgrades')">UPGRADES</button><button class="btn" onclick="td4Go('showShop')">SHOP</button><button class="btn" onclick="td4Go('showAlmanac')">STATS</button><button class="btn" onclick="td4Go('showCustomLevels')">CUSTOM LEVELS</button><button class="btn" onclick="td4Go('showSaveBackup')">SAVE TOOLS</button><button class="btn" onclick="showSettings()">SETTINGS</button><button class="btn" onclick="location.reload()">RELOAD</button></div><div id="td4SaveStatus" class="td4-save"></div></div><aside class="td4-panel td4-news"><h2>Foundation update</h2><p><strong>The goal of this build is reliability.</strong> It keeps the v3.3 combat, mixed stacking, ridiculous Glow-maker stacks, cross-lane attacks, and weather while replacing the unstable homepage layer.</p><p>Menus now share one dark-blue/black style, mobile cards are compact, saves run constantly, and failed menu actions show an error page instead of turning the website blank.</p><p class="tiny">The large combat and world expansions are still planned for v5 and v6. This version gives them a safer base.</p></aside></section></main>`);updateSaveText("Autosave ready");
    }catch(err){showCrash("showMenu",err);}
  };

  // Add mobile/loadout classes without rewriting the old, working picker logic.
  const oldPicker=window.showLoadoutPicker;
  if(typeof oldPicker==="function")window.showLoadoutPicker=function(i,list){document.body.classList.add("td4-loadout");return oldPicker(i,list);};
  const oldRender=window.renderLoadoutPicker;
  if(typeof oldRender==="function")window.renderLoadoutPicker=function(){document.body.classList.add("td4-loadout");const result=oldRender();const panels=document.querySelectorAll('.screen > .panel');if(panels[0])panels[0].classList.add('td4-sticky-start');return result;};
  ["showLevelSelect","showMinigames","showUpgrades","showShop","showAlmanac","showCustomLevels","showSaveBackup"].forEach(name=>{
    const fn=window[name];if(typeof fn!=="function")return;window[name]=function(...args){document.body.classList.remove("td4-loadout");try{return fn(...args);}catch(err){showCrash(name,err);}};
  });

  // Rewrite only visible legacy wording, leaving ids/save formats intact for compatibility.
  const observer=new MutationObserver(()=>{
    const root=window.app||document.getElementById('app');if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(!node.nodeValue)continue;
      node.nodeValue=node.nodeValue.replace(/Plants Against Derps/gi,'Things & Derps').replace(/Upgrade Plants/gi,'Upgrade Things').replace(/Pick Your Bullcrap/gi,'Pick Your Things').replace(/plants\b/gi,'Things').replace(/plant\b/gi,'Thing');
    }
  });
  const appNode=window.app||document.getElementById('app');if(appNode)observer.observe(appNode,{childList:true,subtree:true});

  forceSave("Loaded and saved");
  showMenu();
})();

// ===== Migrated from v5-combat.js =====
"use strict";
(function installThingsDerpsV5(){
  if(typeof CONFIG==="undefined") return;
  const VERSION="v5.0 Combat Update";
  CONFIG.version=VERSION;
  CONFIG.gameTitle="Things & Derps";

  const stackDamage=[1,0.88,0.78,0.69,0.61,0.54];
  const stackSpeed=[1,0.98,0.96,0.94,0.92,0.90];
  const producerScale=[1,0.82,0.70,0.61,0.54,0.48];

  function chapterTwoCleared(){ return !!(window.save?.cleared?.["2-10"]); }
  function randomBulletMult(){ return 1 + Math.random()*0.5; }
  function stackIndexFor(p){ return Math.max(0,Math.min(5,Number(p?._td5StackIndex||0))); }

  // Diminishing returns keep stacking essential without making one tile an unbeatable minigun.
  const oldShooter=window.updatePlantShooter;
  window.updatePlantShooter=function updatePlantShooterV5(p,def){
    const i=stackIndexFor(p);
    const dmgRand=randomBulletMult();
    const speedRand=randomBulletMult();
    const adjusted={
      ...def,
      projectileDamage:Math.max(1,(def.projectileDamage||8)*stackDamage[i]*dmgRand),
      projectileSpeed:Math.max(1,(def.projectileSpeed||6)*stackSpeed[i]*speedRand)
    };
    return oldShooter(p,adjusted);
  };

  // Mark which member of a mixed stack is currently acting, then use the existing stable loop.
  const oldUpdatePlants=window.updatePlants;
  window.updatePlants=function updatePlantsV5(){
    if(state?.plants){
      for(const p of state.plants){
        if(Array.isArray(p.stackUnits)){
          // v3.3 loops immediately after this wrapper begins. A rotating index gives each shot
          // a fair diminishing-return tier without rewriting the whole stable plant system.
          p._td5StackCycle=((p._td5StackCycle||0)+1)%Math.max(1,p.stackUnits.length);
          p._td5StackIndex=p._td5StackCycle;
        }
      }
    }
    return oldUpdatePlants();
  };

  // Producer output still becomes hilariously strong, but later members contribute less.
  const oldGetProducerCd=window.getStackedProducerCooldown;
  window.getStackedProducerCooldown=function getStackedProducerCooldownV5(p,def){
    const base=oldGetProducerCd(p,def);
    const count=Math.max(1,Number(p?.stack||1));
    return Math.round(base/Math.max(.58,producerScale[Math.min(5,count-1)]));
  };

  // After Chapter 2, every new Derp randomly rolls x1-x4 HP.
  const oldSpawnEnemy=window.spawnEnemy;
  window.spawnEnemy=function spawnEnemyV5(sp){
    const before=state?.enemies?.length||0;
    const copy={...(sp||{})};
    let mult=1;
    if(chapterTwoCleared()){
      mult=1+Math.floor(Math.random()*4);
      const def=CONFIG.enemies[copy.type]||CONFIG.enemies.basic;
      copy.hp=Math.round(Number(copy.hp||def.hp)*mult);
    }
    oldSpawnEnemy(copy);
    const e=state?.enemies?.[before];
    if(e){ e.td5HpMult=mult; e.td5BaseMaxHp=e.maxHp; }
  };

  const oldDrawEnemies=window.drawEnemies;
  window.drawEnemies=function drawEnemiesV5(){
    oldDrawEnemies();
    if(!state?.enemies) return;
    ctx.save();ctx.font="bold 12px monospace";ctx.textAlign="center";
    for(const e of state.enemies){
      if((e.td5HpMult||1)>1){
        ctx.fillStyle="rgba(0,0,0,.78)";ctx.fillRect(e.x-18,e.y-54*(e.size||1),36,17);
        ctx.fillStyle="#ffe66d";ctx.fillText(`x${e.td5HpMult}`,e.x,e.y-41*(e.size||1));
      }
    }
    ctx.restore();
  };

  // Tutorial level and live objective panel.
  const tutorial={
    name:"Tutorial",title:"Stacking Is The Point",
    desc:"Learn Glow, shooting, cross-lane support, weather, and the intentionally silly stack system.",
    startGlow:500,background:"forest",music:"battle",lava:[],
    waves:[
      [{type:"basic",row:2,delay:180}],
      [{type:"basic",row:1,delay:240},{type:"basic",row:3,delay:360}],
      [{type:"armored",row:2,delay:480}],
      [{type:"mechaDerp",row:2,delay:600}]
    ]
  };
  if(!CONFIG.minigames.some(x=>x.name===tutorial.name)) CONFIG.minigames.unshift(tutorial);
  window.MINIGAMES=CONFIG.minigames;

  window.showTutorial=function showTutorialV5(){
    const i=CONFIG.minigames.findIndex(x=>x.name===tutorial.name);
    const loadout=["glowMush","rosegun","twigShotgun","treeGun","soggyMattress"].filter(id=>CONFIG.plants[id]&&(!window.isPlantUnlocked||isPlantUnlocked(id)));
    startLevel(i,"minigames",loadout.length?loadout:CONFIG.defaultLoadout);
    if(!state)return;
    state.td5Tutorial={step:0};
    const wrap=document.querySelector('.gameWrap');
    if(wrap) wrap.insertAdjacentHTML('beforeend','<aside id="td5Tutorial" class="td5-tutorial"></aside>');
    updateTutorialPanel();
  };

  function tutorialText(step){
    return [
      ["1. Place a Thing","Tap a Thing card, then place it on the board."],
      ["2. Make Glow","Place Glow Mush. Producers fund the rest of your defense."],
      ["3. Stack it","Place another Thing on an occupied tile. Mixed stacks can hold six Things."],
      ["4. Cross-lane support","Shooters rotate toward Derps in nearby lanes, but never fire backward."],
      ["5. Weather","Rain slows attacks. Clouds cut costs by 80% but stop Glow makers."],
      ["6. Survive","Stacks lose a little damage per member, so spread and stack together. Beat the boss!"]
    ][Math.min(5,step)];
  }
  function updateTutorialPanel(){
    const el=document.getElementById('td5Tutorial');if(!el||!state?.td5Tutorial)return;
    const [h,p]=tutorialText(state.td5Tutorial.step);
    el.innerHTML=`<b>${h}</b><span>${p}</span><small>Stacking is powerful on purpose. It is just no longer an infinite Twig Shotgun death laser.</small>`;
  }
  const oldEffects=window.updateEffects;
  window.updateEffects=function updateEffectsV5(){
    oldEffects();
    if(!state?.td5Tutorial)return;
    const t=state.td5Tutorial;
    const maxStack=Math.max(0,...state.plants.map(p=>p.stack||1));
    const hasProducer=state.plants.some(p=>(p.stackUnits||[p.id]).some(id=>CONFIG.plants[id]?.producer));
    if(t.step===0&&state.plants.length)t.step=1;
    else if(t.step===1&&hasProducer)t.step=2;
    else if(t.step===2&&maxStack>=2)t.step=3;
    else if(t.step===3&&state.kills>=2)t.step=4;
    else if(t.step===4&&state.tick>=30*60)t.step=5;
    updateTutorialPanel();
  };

  // Story victory stays over the battlefield and offers Home / Next.
  window.winGame=function winGameV5(){
    if(!state||state.won)return;
    state.won=true;state.running=false;
    const reward=rand(CONFIG.currency.minWinReward,CONFIG.currency.maxWinReward)+Math.floor(state.kills/5);
    const sticks=state.listName==="minigames"?2:1;
    save.twigs+=reward;save.sticks+=sticks;
    if(state.listName==="levels") save.cleared[state.level.name]=true;
    if(state.listName==="minigames") save.bestMinigames[state.level.name]=true;
    const newly=[];
    for(const [id,p] of Object.entries(CONFIG.plants)){
      if(p.unlockAt===state.level.name&&!save.unlockedPlants[id]){save.unlockedPlants[id]=true;newly.push(p.name);}
    }
    saveGame();playMusic(CONFIG.audio.victoryTrack);playSfx("win");
    const isStory=state.listName==="levels";
    const nextExists=isStory&&state.index+1<CONFIG.levels.length;
    const overlay=document.createElement('div');overlay.className='td5-victory';
    overlay.innerHTML=`<section><h1>LEVEL COMPLETE!</h1><p>+${reward} Twigs • +${sticks} Sticks</p>${newly.length?`<p>Unlocked: ${newly.join(', ')}</p>`:''}<p class="tiny">Best combo: ${state.highestCombo||0}</p><div><button class="btn" onclick="showMenu()">HOME</button>${nextExists?`<button class="btn good" onclick="showLoadoutPicker(${state.index+1},'levels')">NEXT</button>`:''}</div></section>`;
    document.body.appendChild(overlay);
  };

  // Add tutorial access and v5 copy to the stable v4 home screen.
  const oldMenu=window.showMenu;
  window.showMenu=function showMenuV5(){
    document.querySelectorAll('.td5-victory').forEach(x=>x.remove());
    oldMenu();
    const menu=document.querySelector('.td4-menu');
    if(menu&&!document.getElementById('td5TutorialBtn')){
      const b=document.createElement('button');b.id='td5TutorialBtn';b.className='btn';b.textContent='TUTORIAL';b.onclick=showTutorial;
      menu.insertBefore(b,menu.children[1]||null);
    }
    const ver=document.querySelector('.td4-version');if(ver)ver.textContent=`${VERSION} • stacking, randomized firepower, tougher Derps`;
    const news=document.querySelector('.td4-news');if(news)news.innerHTML='<h2>Combat update</h2><p>Stacks now use diminishing damage, while every bullet rolls between x1 and x1.5 damage and speed.</p><p>After clearing Chapter 2, Derps randomly spawn with x1 to x4 HP. Story wins now leave the battlefield visible behind Home and Next buttons.</p><p class="tiny">Glow stacks remain intentionally ridiculous—just less instantly infinite.</p>';
  };

  showMenu();
})();

// ===== Migrated from v6-world.js =====
"use strict";
(function installThingsDerpsV6(){
  if(typeof CONFIG==="undefined") return;
  const VERSION="v6.0 The Big Update";
  CONFIG.version=VERSION; CONFIG.gameTitle="Things & Derps";

  Object.assign(CONFIG.images,{
    foamCube:"assets/foamcube.png", jetSpike:"assets/jetspike.png", factory:"assets/factory.png",
    lightningCoil:"assets/lightningcoil.png", mrGlock:"assets/mr-glock.png", beachBall:"assets/cheesewheel.png"
  });
  // New official MS Paint Things. Beach Ball keeps its old id for save compatibility, but is now Cheese Wheel.
  Object.assign(CONFIG.plants,{
    foamCube:{name:"Foam Cube",cost:35,hp:70,img:"foamCube",desc:"The cheap cube mascot. Somehow armed.",role:"Starter Shooter",shooter:true,fireType:"straight",shootCooldown:92,projectileDamage:10,projectileSpeed:5.5,placementCooldown:90},
    mrGlock:{name:"Mr. Glock",cost:90,hp:72,img:"mrGlock",desc:"Tiny gun. Concerning confidence.",role:"Rapid Shooter",shooter:true,fireType:"straight",shootCooldown:42,projectileDamage:7,projectileSpeed:7.2,placementCooldown:165},
    lightningCoil:{name:"Lightning Coil",cost:160,hp:95,img:"lightningCoil",desc:"Electric nonsense that covers nearby lanes.",role:"Electric Multi-Lane",shooter:true,fireType:"multiLane",shootCooldown:145,projectileDamage:34,projectileSpeed:8,placementCooldown:280},
    jetSpike:{name:"Jet Spike",cost:105,hp:210,img:"jetSpike",desc:"A flying-looking wall that forgot to fly away.",role:"Armored Shooter",shooter:true,wall:true,fireType:"straight",shootCooldown:155,projectileDamage:22,projectileSpeed:5.8,placementCooldown:230},
    factory:{name:"Factory",cost:140,hp:125,img:"factory",desc:"Manufactures Glow and suspicious smoke.",role:"Big Producer",producer:true,produceAmount:48,produceCooldown:980,placementCooldown:260}
  });
  Object.assign(CONFIG.plants.beachBall,{name:"Cheese Wheel",img:"beachBall",desc:"Launches a wheel of cheese into a tile and rolls back. Physics approved.",damage:115,radius:112});
  CONFIG.defaultLoadout=["campfr","foamCube","treeGun","mrGlock","cheeseWheel"].map(x=>x==="cheeseWheel"?"beachBall":x);
  for(const id of ["foamCube","mrGlock","lightningCoil","jetSpike","factory"]){
    if(window.save?.unlockedPlants) save.unlockedPlants[id]=true;
  }

  const tips=["Teaching Foam Cube geometry...","Polishing Mr. Glock...","Rolling the Cheese Wheel uphill...","Warning the Derps...","Trying to balance Twig Shotgun...","Stacking different Things incorrectly...","Finding more cinder bricks...","Asking Factory where the smoke came from..."];
  const loading=document.getElementById("loading");
  if(loading){
    loading.innerHTML=`<div><h1>Things &amp; Derps</h1><p><b>Eating cinder bricks... Please wait!</b></p><small id="td6LoadTip"></small></div>`;
    let i=0; const el=document.getElementById("td6LoadTip"); if(el){el.textContent=tips[0];setInterval(()=>{if(document.body.contains(el))el.textContent=tips[++i%tips.length];},650);}
  }

  function generatedLevel(name,title,waves,startGlow=700,bg="matrixGrid"){
    return {name,title,desc:"A v6 generated mode level.",startGlow,background:bg,music:"battle",waves,lava:[]};
  }
  function spam(types,count,gap=45){return Array.from({length:count},(_,i)=>({type:types[i%types.length],row:i%5,delay:i?gap:120}));}
  const endless=generatedLevel("ENDLESS-50","Endless-ish: 50 Waves",Array.from({length:50},(_,w)=>spam(w>38?["mechaDerp","armored","fast"]:w>20?["armored","fast","basic"]:["basic","fast"],Math.min(3+Math.floor(w/3),18),Math.max(18,70-w))),900,"matrixGrid");
  const bossRush=generatedLevel("BOSS-RUSH","Boss Rush",Array.from({length:10},(_,w)=>[{type:w%3===0?"alienGod":"mechaDerp",row:w%5,delay:150},{type:"armored",row:(w+2)%5,delay:100}]),1200,"milkyway");
  const challenge=generatedLevel("CHAOS-CHALLENGE","Randomized Chaos",Array.from({length:16},(_,w)=>spam(["basic","fast","armored","droneGun","alienGun"],5+w,35)),800,"glitchArchive");
  for(const lv of [endless,bossRush,challenge]) if(!CONFIG.minigames.some(x=>x.name===lv.name)) CONFIG.minigames.push(lv);

  window.td6StartMode=function(name){
    const i=CONFIG.minigames.findIndex(x=>x.name===name);
    const roster=["factory","foamCube","mrGlock","lightningCoil","jetSpike","beachBall"].filter(id=>CONFIG.plants[id]);
    startLevel(i,"minigames",roster.slice(0,5));
  };

  // Next now removes the victory UI and starts the next story level immediately with the same loadout.
  window.td6NextLevel=function(index,encoded){
    document.querySelectorAll('.td5-victory,.td6-victory').forEach(x=>x.remove());
    const loadout=JSON.parse(decodeURIComponent(encoded||"%5B%5D"));
    const old=document.querySelector('.gameWrap'); if(old) old.classList.add('td6-fadeout');
    setTimeout(()=>startLevel(index,"levels",loadout.length?loadout:CONFIG.defaultLoadout),220);
  };
  const oldWin=window.winGame;
  window.winGame=function winGameV6(){
    const wasTutorial=!!state?.td6Tutorial;
    const nextIndex=state?.index+1; const list=state?.listName; const load=(state?.loadout||[]).filter(x=>x!=="removeTool");
    oldWin();
    if(wasTutorial){
      localStorage.setItem("thingsAndDerps_v6_tutorialDone","1");
      const box=document.querySelector('.td5-victory section');
      if(box) box.innerHTML='<h1>You are now le pro 🤑</h1><p>now get sent to home screen</p><button class="btn good" onclick="showMenu()">HOME</button>';
      return;
    }
    if(list==="levels"){
      const next=document.querySelector('.td5-victory .good');
      if(next && nextIndex<CONFIG.levels.length){next.setAttribute('onclick',`td6NextLevel(${nextIndex},'${encodeURIComponent(JSON.stringify(load))}')`);next.textContent="NEXT LEVEL";}
    }
  };

  const tutorial=generatedLevel("V6-TUTORIAL","Basic Tutorial",[[{type:"basic",row:2,delay:780}],[{type:"basic",row:1,delay:260},{type:"basic",row:3,delay:300}]],350,"forest");
  if(!CONFIG.minigames.some(x=>x.name===tutorial.name)) CONFIG.minigames.unshift(tutorial);
  window.td6Tutorial=function(){
    const i=CONFIG.minigames.findIndex(x=>x.name===tutorial.name);
    startLevel(i,"minigames",["campfr","treeGun","foamCube","factory","mrGlock"]);
    if(!state)return; state.td6Tutorial={step:0};
    const wrap=document.querySelector('.gameWrap'); if(wrap)wrap.insertAdjacentHTML('beforeend','<aside id="td6Coach" class="td6-coach"></aside>');
    td6Coach();
  };
  const lines=["Welecome to the game!","Select Campfir.","Place that on a tile!","Stack 3 more...","money glitch 😂","Once you have enough place Tree Gun!","Any attacker works too.","Derp incoming. Very careful."];
  function td6Coach(){const e=document.getElementById('td6Coach');if(e&&state?.td6Tutorial)e.innerHTML=`<b>${lines[Math.min(lines.length-1,state.td6Tutorial.step)]}</b><small>Different Things can share one tile.</small>`;}
  const oldEffects=window.updateEffects;
  window.updateEffects=function updateEffectsV6(){
    oldEffects(); if(!state?.td6Tutorial)return;
    const t=state.td6Tutorial, plants=state.plants||[];
    const hasCamp=plants.some(p=>(p.stackUnits||[p.id]).includes("campfr"));
    const maxStack=Math.max(0,...plants.map(p=>(p.stackUnits||[p.id]).length));
    const hasAttacker=plants.some(p=>(p.stackUnits||[p.id]).some(id=>CONFIG.plants[id]?.shooter));
    if(t.step===0)t.step=1;
    else if(t.step===1&&state.selectedPlant==="campfr")t.step=2;
    else if(t.step===2&&hasCamp)t.step=3;
    else if(t.step===3&&maxStack>=4)t.step=4;
    else if(t.step===4&&state.glow>=75)t.step=5;
    else if(t.step===5&&hasAttacker)t.step=6;
    else if(t.step===6&&state.tick>450)t.step=7;
    td6Coach();
  };
  const oldLose=window.loseGame;
  window.loseGame=function loseGameV6(){
    const tut=!!state?.td6Tutorial; oldLose();
    if(tut){const panel=document.querySelector('.panel');if(panel)panel.insertAdjacentHTML('afterbegin','<h2>Let\'s try again, you can stack different things!</h2>');}
  };

  const oldMenu=window.showMenu;
  window.showMenu=function showMenuV6(){
    document.querySelectorAll('.td5-victory,.td6-victory').forEach(x=>x.remove()); oldMenu();
    const menu=document.querySelector('.td4-menu');
    if(menu&&!document.getElementById('td6Modes')){
      const group=document.createElement('div');group.id='td6Modes';group.className='td6-modegroup';
      group.innerHTML='<button class="btn" onclick="td6StartMode(\'ENDLESS-50\')">ENDLESS</button><button class="btn" onclick="td6StartMode(\'BOSS-RUSH\')">BOSS RUSH</button><button class="btn" onclick="td6StartMode(\'CHAOS-CHALLENGE\')">CHALLENGE</button>';
      menu.appendChild(group);
    }
    const tutorialBtn=document.getElementById('td5TutorialBtn');if(tutorialBtn){tutorialBtn.textContent='TUTORIAL';tutorialBtn.onclick=td6Tutorial;}
    const ver=document.querySelector('.td4-version');if(ver)ver.textContent=`${VERSION} • world modes + official MS Paint Things`;
    const news=document.querySelector('.td4-news');if(news)news.innerHTML='<h2>The Big Update</h2><p>Six official Things join the roster: Foam Cube, Mr. Glock, Lightning Coil, Jet Spike, Factory, and Cheese Wheel.</p><p>New players are sent into a playable stacking tutorial. Story Next now loads the next level directly instead of throwing you back through menus.</p><p>Endless-ish 50 Waves, Boss Rush, and a randomized Challenge mode are now playable.</p>';
  };

  saveGame(); showMenu();
  if(!localStorage.getItem("thingsAndDerps_v6_tutorialDone")) setTimeout(()=>td6Tutorial(),180);
})();

// ===== Migrated from v6-chapters.js =====
"use strict";
(function installThingsDerpsV61(){
  if(typeof CONFIG==="undefined") return;
  const VERSION="v6.1 Chapters & The Edge";
  CONFIG.version=VERSION;

  // New art/background keys.
  Object.assign(CONFIG.images,{
    derpfieldB:"assets/bg-derpfield-b.png",
    insaneStar:"assets/extra/insanestar.png",
    insaneStarMini:"assets/extra/insanestar-miniboss.png",
    starEye:"assets/extra/star-eye-finalboss.png"
  });

  // Upgrades stay meaningful, but no longer multiply into instant wins after two stacks.
  // Existing save levels are preserved; only their live stat curve is gentler.
  CONFIG.upgrades.hpBoostPerLevel=10;
  CONFIG.upgrades.damageBoostPerLevel=2.4;
  CONFIG.upgrades.producerBoostPerLevel=2.2;

  // The Edge roster: stars plus weak, annoying mirrored Things.
  Object.assign(CONFIG.enemies,{
    insaneStar:{name:"Insane Star",hp:520,speed:.26,damage:15,img:"insaneStar",size:1.05,desc:"A star that has made several bad decisions."},
    insaneStarMini:{name:"Insane Star Miniboss",hp:3600,speed:.12,damage:37,img:"insaneStarMini",size:1.7,boss:true,desc:"Large, loud, and spawning during the worst possible moment."},
    starEye:{name:"Star Eye",hp:18000,speed:.055,damage:65,img:"starEye",size:2.7,boss:true,rangedShooter:true,multiShot:true,shootCooldown:95,shotDamage:26,shotSpeed:5.2,desc:"It saw the stacking strategy and took notes."},
    evilFoam:{name:"Evil Foam Cube",hp:230,speed:.2,damage:8,img:"foamCube",size:.82,rangedShooter:true,shootCooldown:105,shotDamage:9,shotSpeed:4.4,evilThing:true},
    evilGlock:{name:"Evil Mr. Glock",hp:190,speed:.18,damage:7,img:"mrGlock",size:.82,rangedShooter:true,shootCooldown:52,shotDamage:6,shotSpeed:6.5,evilThing:true},
    evilCoil:{name:"Evil Lightning Coil",hp:420,speed:.12,damage:14,img:"lightningCoil",size:.95,rangedShooter:true,multiShot:true,shootCooldown:155,shotDamage:15,shotSpeed:4.8,evilThing:true},
    evilFactory:{name:"Evil Factory",hp:700,speed:.075,damage:23,img:"factory",size:1.08,evilThing:true},
    evilJet:{name:"Evil Jet Spike",hp:620,speed:.16,damage:28,img:"jetSpike",size:1.02,evilThing:true}
  });

  function spam(types,count,gap=55,start=90){
    return Array.from({length:count},(_,i)=>({type:types[i%types.length],row:i%5,delay:i?gap:start}));
  }
  function level(name,title,desc,waves,startGlow=900,background="theEdge",extra={}){
    return {name,title,desc,waves,startGlow,background,music:"edge",lava:[],world:6,...extra};
  }

  // Replace the old teaser and complete World 6.
  const world6=[
    level("6-1","At The Edge","The safe part of the game has ended.",[
      spam(["insaneStar","edgeVoid","curseDerp"],14,52),
      spam(["insaneStar","evilFoam","evilGlock"],20,44),
      spam(["insaneStarMini","insaneStar","evilFoam"],16,58)
    ],900),
    level("6-2","Stars Should Not Walk","They do anyway, and they brought guns.",[
      spam(["insaneStar","insaneStar","evilGlock"],22,38),
      spam(["evilFoam","evilJet","insaneStar"],24,40),
      spam(["insaneStarMini","evilGlock","evilFoam","insaneStar"],28,43)
    ],975),
    level("6-3","The Derps Learned Placement","Enemy Things are weaker than yours. There are also far too many of them.",[
      spam(["evilFactory","evilFoam","evilFoam","evilGlock"],25,42),
      spam(["evilCoil","evilJet","evilGlock","insaneStar"],28,40),
      spam(["evilFactory","evilCoil","insaneStarMini","evilFoam"],30,46)
    ],1050),
    level("6-4","Everything At Once","Bosses are now treated like regular wave ingredients.",[
      spam(["mechaDerp","insaneStar","evilGlock","armored"],30,34),
      spam(["alienGod","clownCar","evilCoil","insaneStar"],30,38),
      spam(["insaneStarMini","mechaDerp","evilFactory","insaneStar"],36,40)
    ],1150,{lava:[[3,0],[3,4],[5,1],[5,3]]}),
    level("6-5","Edge Spam Department","Nobody approved this many enemies.",[
      spam(["insaneStar","evilFoam","evilGlock","fast"],38,28),
      spam(["evilCoil","evilJet","insaneStar","curseDerp"],42,30),
      spam(["insaneStarMini","insaneStarMini","evilFactory","evilGlock","insaneStar"],44,34)
    ],1250,{challenge:true,lava:[[2,0],[2,2],[2,4],[6,1],[6,3]]}),
    level("6-6","STAR EYE","The entire world is the boss now.",[
      spam(["insaneStar","evilFoam","evilGlock"],25,30),
      [{type:"starEye",row:2,delay:100},...spam(["insaneStar","evilCoil","evilFactory"],30,34,140)],
      [{type:"starEye",row:2,delay:100},{type:"insaneStarMini",row:0,delay:180},{type:"insaneStarMini",row:4,delay:210},...spam(["evilFoam","evilGlock","evilJet","insaneStar"],40,28,240)]
    ],1450,{boss:true,difficulty:"Chapter Boss",lava:[[4,0],[4,1],[4,3],[4,4]]})
  ];
  const remove6=new Set(CONFIG.levels.map((lv,i)=>String(lv.name).startsWith("6-")?i:-1).filter(i=>i>=0));
  CONFIG.levels=CONFIG.levels.filter((_,i)=>!remove6.has(i));
  CONFIG.levels.push(...world6);

  // Chapter 2 begins with World 1B. It deliberately reuses familiar enemies with huge buffs and modifiers.
  const world1B=[
    {name:"1B-1",title:"Derpfield... No.",desc:"A rebuilt memory of Derpfield. Every enemy is much stronger.",startGlow:1100,background:"derpfieldB",music:"edge",world:"1B",chapter:2,bWorld:true,waves:[spam(["basic","fast","armored"],24,42),spam(["armored","mechaDerp","fast"],28,44),spam(["insaneStar","armored","basic"],32,40)],lava:[]},
    {name:"1B-2",title:"Wrong Grass",desc:"The field remembers your old strategies and answers with spam.",startGlow:1200,background:"derpfieldB",music:"edge",world:"1B",chapter:2,bWorld:true,waves:[spam(["fast","evilFoam","basic"],30,34),spam(["evilGlock","armored","fast"],34,36),spam(["insaneStarMini","evilFoam","mechaDerp"],34,40)],lava:[[3,1],[3,3]]},
    {name:"1B-3",title:"The First Level Is Angry",desc:"World 1 has stopped pretending to be beginner friendly.",startGlow:1300,background:"derpfieldB",music:"edge",world:"1B",chapter:2,bWorld:true,waves:[spam(["armored","evilGlock","insaneStar"],36,30),spam(["mechaDerp","evilCoil","fast"],36,34),spam(["insaneStarMini","evilFactory","armored","insaneStar"],40,36)],lava:[[2,0],[2,4],[6,2]]},
    {name:"1B-4",title:"Checkerboard Collapse",desc:"Even the floor is no longer fully trustworthy.",startGlow:1400,background:"derpfieldB",music:"edge",world:"1B",chapter:2,bWorld:true,waves:[spam(["evilJet","evilFoam","fast","armored"],40,28),spam(["insaneStar","evilCoil","mechaDerp"],42,30),spam(["insaneStarMini","evilFactory","evilGlock","armored"],45,32)],lava:[[1,1],[1,3],[4,0],[4,4],[7,2]]},
    {name:"1B-5",title:"Derpfield B Boss","desc":"The distorted field produces one final unreasonable wave.",startGlow:1550,background:"derpfieldB",music:"finalBoss",world:"1B",chapter:2,bWorld:true,boss:true,challenge:true,waves:[spam(["evilFoam","evilGlock","insaneStar"],44,26),spam(["insaneStarMini","mechaDerp","evilCoil"],44,30),[{type:"starEye",row:2,delay:100},...spam(["insaneStar","evilFactory","evilJet","armored"],50,26,180)]],lava:[[2,0],[2,2],[2,4],[6,0],[6,2],[6,4]]}
  ];
  CONFIG.levels=CONFIG.levels.filter(lv=>!String(lv.name).startsWith("1B-"));
  CONFIG.levels.push(...world1B);

  // Chapter labels for all original worlds.
  const worldNames={1:"Derpfield",2:"Sand Machines",3:"Alien Rising",4:"Derpy Way",5:"Clown Multiverse",6:"The Edge","1B":"Derpfield B"};
  for(const lv of CONFIG.levels){
    if(String(lv.name).match(/^[1-6]-/)){lv.chapter=1;lv.world=Number(String(lv.name).split("-")[0]);}
    if(String(lv.name).startsWith("1B-")){lv.chapter=2;lv.world="1B";}
  }

  // B-world enemies get a visible random modifier and a severe stat boost.
  const oldSpawnEnemy=window.spawnEnemy;
  window.spawnEnemy=function spawnEnemyV61(sp){
    const before=state?.enemies?.length||0;
    const copy={...(sp||{})};
    let modifier=null;
    if(state?.level?.bWorld){
      const def=CONFIG.enemies[copy.type]||CONFIG.enemies.basic;
      const mods=[
        {name:"GIANT",hp:4.2,speed:.82,damage:1.45,size:1.28},
        {name:"FURIOUS",hp:2.8,speed:1.7,damage:1.35,size:1},
        {name:"CHARGED",hp:3.3,speed:1.15,damage:1.8,size:1.05},
        {name:"B",hp:3.6,speed:1.25,damage:1.5,size:1.1}
      ];
      modifier=mods[Math.floor(Math.random()*mods.length)];
      copy.hp=Math.round(Number(copy.hp||def.hp)*modifier.hp);
      copy.speed=Number(copy.speed||def.speed)*modifier.speed;
      copy.damage=Number(copy.damage||def.damage)*modifier.damage;
      copy.size=Number(copy.size||def.size||1)*modifier.size;
    }
    oldSpawnEnemy(copy);
    const e=state?.enemies?.[before];
    if(e&&modifier)e.td61Modifier=modifier.name;
  };

  // Actual per-member stack tiers. A two-stack remains strong; later members lose more output.
  const oldShooter=window.updatePlantShooter;
  const tiers=[1,.72,.56,.45,.37,.31];
  window.updatePlantShooter=function updatePlantShooterV61(p,def){
    const count=Math.max(1,Array.isArray(p?.stackUnits)?p.stackUnits.length:Number(p?.stack||1));
    const idx=p._td61ShotTier||0;
    p._td61ShotTier=(idx+1)%count;
    const tier=tiers[Math.min(idx,tiers.length-1)];
    return oldShooter(p,{...def,projectileDamage:Math.max(1,(def.projectileDamage||8)*tier)});
  };

  // Extra producer restraint, especially after upgrades.
  const oldProducerCd=window.getStackedProducerCooldown;
  window.getStackedProducerCooldown=function getStackedProducerCooldownV61(p,def){
    const count=Math.max(1,Number(p?.stack||1));
    return Math.round(oldProducerCd(p,def)*(1+Math.max(0,count-1)*.16));
  };

  const oldDrawEnemies=window.drawEnemies;
  window.drawEnemies=function drawEnemiesV61(){
    oldDrawEnemies();
    if(!state?.enemies)return;
    ctx.save();ctx.textAlign="center";ctx.font="bold 11px monospace";
    for(const e of state.enemies){
      const def=CONFIG.enemies[e.type]||{};
      if(def.evilThing){
        ctx.globalAlpha=.32;ctx.fillStyle="#ff163d";ctx.fillRect(e.x-30*(e.size||1),e.y-30*(e.size||1),60*(e.size||1),60*(e.size||1));ctx.globalAlpha=1;
        ctx.fillStyle="#ff6b7d";ctx.fillText("EVIL THING",e.x,e.y+45*(e.size||1));
      }
      if(e.td61Modifier){ctx.fillStyle="#000c";ctx.fillRect(e.x-30,e.y-66*(e.size||1),60,16);ctx.fillStyle="#ecff75";ctx.fillText(e.td61Modifier,e.x,e.y-54*(e.size||1));}
    }
    ctx.restore();
  };

  function chapterTwoUnlocked(){return !!save?.cleared?.["6-6"];}
  window.showLevelSelect=function showChapterSelectV61(){
    currentScreen="levels";state=null;document.body.classList.remove("td4-loadout");
    if(typeof playMusic==="function")playMusic(CONFIG.audio.menuTrack);
    const chapters=[
      {id:1,title:"CHAPTER 1",subtitle:"The Original Journey",worlds:[1,2,3,4,5,6],locked:false},
      {id:2,title:"CHAPTER 2",subtitle:"The Other Side",worlds:["1B"],locked:!chapterTwoUnlocked()}
    ];
    const html=chapters.map(ch=>`<section class="td61-chapter ${ch.locked?'locked':''}"><header><h2>${ch.title}</h2><p>${ch.subtitle}</p></header>${ch.locked?'<div class="td61-lock">Beat STAR EYE in 6-6 to unlock.</div>':ch.worlds.map(w=>{
      const levels=CONFIG.levels.map((lv,i)=>({lv,i})).filter(x=>String(x.lv.world)===String(w));
      return `<div class="td61-world"><h3>${String(w).includes('B')?'World '+w:'World '+w+' — '+worldNames[w]}</h3><div class="cards">${levels.map(({lv,i})=>{
        const prev=CONFIG.levels[i-1];
        let unlocked=String(lv.name).endsWith('-1')?true:!!save.cleared?.[prev?.name];
        if(lv.chapter===2)unlocked=chapterTwoUnlocked()&&(String(lv.name)==='1B-1'||!!save.cleared?.[prev?.name]);
        return `<article class="card ${unlocked?'':'locked'}"><h4>${lv.name} — ${lv.title}</h4><p>${lv.desc||''}</p><small>${save.cleared?.[lv.name]?'CLEARED ✓':lv.difficulty||''}</small><button class="btn ${unlocked?'good':''}" ${unlocked?`onclick="showLoadoutPicker(${i},'levels')"`:'disabled'}>${unlocked?'PLAY':'LOCKED'}</button></article>`;
      }).join('')}</div></div>`;
    }).join('')}</section>`).join('');
    setScreen(`<main class="screen td61-select"><div class="topbar"><button class="btn" onclick="showMenu()">← HOME</button>${typeof currencyHtml==='function'?currencyHtml():''}</div><h1>STORY</h1>${html}</main>`);
  };

  // Keep direct Next loading, but never cross into locked Chapter 2 accidentally.
  const oldNext=window.td6NextLevel;
  window.td6NextLevel=function td61Next(index,encoded){
    const next=CONFIG.levels[index];
    if(next?.chapter===2&&!chapterTwoUnlocked()){showLevelSelect();return;}
    document.querySelectorAll('.td5-victory,.td6-victory').forEach(x=>x.remove());
    return oldNext(index,encoded);
  };

  // Chapter completion copy and version text.
  const oldWin=window.winGame;
  window.winGame=function winGameV61(){
    const wonName=state?.level?.name;
    oldWin();
    if(wonName==="6-6"){
      save.cleared["6-6"]=true;saveGame();
      const box=document.querySelector('.td5-victory section');
      if(box){box.insertAdjacentHTML('afterbegin','<p class="td61-unlock">CHAPTER 2 UNLOCKED — THE OTHER SIDE</p>');}
    }
  };

  const oldMenu=window.showMenu;
  window.showMenu=function showMenuV61(){
    oldMenu();
    const ver=document.querySelector('.td4-version');if(ver)ver.textContent=`${VERSION} • Chapter 1 complete + World 1B`;
    const news=document.querySelector('.td4-news');if(news)news.innerHTML='<h2>Chapters & The Edge</h2><p>Worlds 1–6 now form Chapter 1. Beat Star Eye to unlock Chapter 2 and the heavily buffed Derpfield B.</p><p>World 6 now uses Insane Stars, minibosses, Star Eye, and weak but heavily spammed Evil Things.</p><p>Upgrade and stack scaling was reduced without removing the power fantasy.</p>';
  };

  saveGame();showMenu();
})();
