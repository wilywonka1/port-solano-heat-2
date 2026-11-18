// All DOM overlay: HUD, dialogue, fanfare, screens. Created here so
// index.html stays a thin shell.
import { G } from './config.js';
let el={};
export function buildHud(root){
  root.innerHTML=`
  <style>
    #hud{position:fixed;inset:0;pointer-events:none;font-family:Verdana,system-ui,sans-serif;color:#fff;z-index:5}
    .panel{background:rgba(16,20,28,.72);border:1px solid rgba(255,200,120,.45);border-radius:8px;padding:8px 12px}
    #topbar{position:absolute;top:10px;left:10px;display:flex;gap:10px;align-items:flex-start}
    #healthwrap{width:170px}#healthbar{height:12px;background:#3a2020;border-radius:6px;overflow:hidden}
    #healthfill{height:100%;width:100%;background:linear-gradient(90deg,#e23b2e,#f28c28)}
    #cash{font-size:20px;font-weight:bold;color:#8dff8a;text-shadow:0 1px 2px #000}
    #stars{font-size:22px;color:#ffd23e;letter-spacing:2px;text-shadow:0 0 6px #a60}
    #stars .off{color:rgba(255,255,255,.22)}
    #weapon{font-size:13px;color:#ffe9bb}
    #objective{position:absolute;top:10px;left:50%;transform:translateX(-50%);max-width:560px;text-align:center;font-size:15px}
    #objective b{color:#ffd23e}
    #speedo{position:absolute;right:14px;bottom:196px;font-size:26px;font-weight:bold;text-align:right;display:none}
    #speedo small{font-size:12px;color:#ffd9a0}
    #prompt{position:absolute;left:50%;bottom:118px;transform:translateX(-50%);font-size:15px;display:none}
    #dialogue{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);width:min(640px,92vw);display:none}
    #dialogue .who{color:#ffb35c;font-weight:bold;margin-bottom:4px}
    #fanfare{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);width:min(430px,90vw);text-align:center;display:none;background:linear-gradient(160deg,rgba(60,32,8,.94),rgba(20,16,24,.94));border:2px solid #ffb35c;border-radius:12px;padding:22px}
    #fanfare h2{margin:0 0 8px;color:#ffd23e;font-size:24px}#fanfare .rew{font-size:19px;color:#8dff8a}
    #toast{position:absolute;left:50%;top:86px;transform:translateX(-50%);font-size:16px;color:#fff;text-shadow:0 1px 3px #000;text-align:center}
    #racetimer{position:absolute;top:64px;right:14px;font-size:20px;display:none;text-align:right}
    #bustedmeter{position:absolute;left:50%;bottom:170px;transform:translateX(-50%);width:220px;display:none}
    #bustedmeter div{height:9px;background:#20242c;border-radius:5px;overflow:hidden}#bustedfill{height:100%;background:#e23b2e;width:0%}
    .screen{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;background:linear-gradient(180deg,rgba(30,20,40,.55),rgba(10,8,14,.88));z-index:20;color:#fff;font-family:Verdana,system-ui,sans-serif;text-align:center;padding:20px}
    .screen h1{font-size:52px;margin:0;color:#ffd9a0;text-shadow:0 3px 0 #a34a12,0 6px 24px #000;letter-spacing:1px}
    .screen h1 span{color:#ff7847}
    .screen p{max-width:620px;line-height:1.5;color:#f5e8d5}
    .btn{pointer-events:auto;background:#ff7847;color:#1c1005;border:0;border-radius:8px;padding:12px 30px;font-size:18px;font-weight:bold;cursor:pointer;margin:6px}
    .btn.alt{background:#2e4a7a;color:#fff}
    .keys{font-size:13px;color:#cfd8e6;line-height:1.9}
    .hidden{display:none!important}
  </style>
  <div id="hud">
    <div id="topbar">
      <div class="panel"><div id="cash">$120</div><div id="weapon">Fists</div></div>
      <div class="panel" id="healthwrap"><div style="font-size:11px;margin-bottom:3px">JUNO VALE</div><div id="healthbar"><div id="healthfill"></div></div><div id="stars"></div></div>
    </div>
    <div id="objective" class="panel"></div>
    <div id="racetimer" class="panel"></div>
    <div id="speedo" class="panel">0<br><small>km/h</small></div>
    <div id="prompt" class="panel"></div>
    <div id="bustedmeter"><div style="font-size:12px;text-align:center;color:#ff9a8a">BUSTED?</div><div><div id="bustedfill"></div></div></div>
    <div id="toast"></div>
    <div id="dialogue" class="panel"><div class="who"></div><div class="line"></div></div>
    <div id="fanfare"><h2 id="fan-title">Mission Complete</h2><div class="rew" id="fan-rew"></div><div id="fan-sub" style="margin-top:6px"></div><div style="margin-top:12px;font-size:12px;color:#cfd8e6">Press E or drive on to continue</div></div>
    <canvas id="minimap" width="180" height="180" style="position:absolute;right:12px;bottom:12px;border-radius:50%;border:2px solid rgba(255,200,120,.6);background:#1c2a33"></canvas>
  </div>
  <div id="startscreen" class="screen">
    <h1>SOLANO <span>HEAT</span></h1><div style="color:#ffb35c;letter-spacing:4px">— GOLDEN HOUR —</div>
    <p>Juno Vale, courier with a borrowed car and an empty wallet, takes one job from fixer <b>Rosa Delgado</b> in Port Solano — and by sunset the whole marina wants a piece of it. Drive, run jobs, dodge the heat, and finish the Marina Score.</p>
    <div><button class="btn" id="btn-start">Start New Game</button><button class="btn alt" id="btn-continue">Continue</button></div>
    <div class="keys">WASD move / drive &nbsp; Mouse look (click to lock) &nbsp; Shift sprint &nbsp; E enter / exit car &amp; interact<br>Space handbrake &nbsp; Click / F punch &nbsp; Click shoot (pistol) &nbsp; R reload &nbsp; Esc / P pause &nbsp; Missions: follow the gold beacon</div>
  </div>
  <div id="pausescreen" class="screen hidden"><h1>Paused</h1><p id="pausestats"></p><button class="btn" id="btn-resume">Resume</button></div>
  <div id="endscreen" class="screen hidden"><h1 id="end-title">BUSTED</h1><p id="end-text"></p><button class="btn" id="btn-respawn">Back on the street</button></div>
  <div id="storyscreen" class="screen hidden"><h1>Story Complete</h1><p>Juno delivered, dodged and scored — the Marina Score is done and Port Solano glows on without her. Free roam, taxi fares and the Harbour Run race are still yours.</p><button class="btn" id="btn-freeroam">Keep driving</button></div>`;
  for(const id of ['cash','weapon','healthfill','stars','objective','speedo','prompt','dialogue','fanfare','fan-title','fan-rew','fan-sub','toast','racetimer','bustedmeter','bustedfill','startscreen','pausescreen','endscreen','storyscreen','minimap','end-title','end-text','pausestats'])
    el[id]=document.getElementById(id);
  return el;
}
export function getEl(){ return el; }
let toastT=0;
export function toast(msg, dur=3){ if(el.toast){ el.toast.textContent=msg; toastT=dur; } }
export function showDialogue(who,line,dur=5){ G.dialogue={who,line}; G.dialogueTimer=dur; if(el.dialogue){ el.dialogue.style.display='block'; el.dialogue.querySelector('.who').textContent=who; el.dialogue.querySelector('.line').textContent=line; } }
export function showFanfare(title,reward,sub=''){
  G.fanfare={title,reward,sub};
  if(el.fanfare){ el['fan-title'].textContent=title; el['fan-rew'].textContent=reward>0?`+$${reward}`:''; el['fan-sub'].innerHTML=`${sub}<br>Total cash: $${G.cash}`; el.fanfare.style.display='block'; }
}
export function hideFanfare(){ G.fanfare=null; if(el.fanfare) el.fanfare.style.display='none'; }
export function updateHud(dt){
  if(!el.cash) return;
  el.cash.textContent='$'+G.cash;
  el.healthfill.style.width=Math.max(0,G.health)+'%';
  let s=''; for(let i=0;i<5;i++) s+= i<G.wanted? '★' : '<span class="off">★</span>';
  el.stars.innerHTML=s;
  el.weapon.textContent = G.weapon==='pistol' ? `Pistol — ${G.ammo} / ${G.reserve}${G.reloading>0?' (reloading…)':''}` : (G.hasPistol?'Fists (click car-free, 1/2 not needed — pistol ready on foot)':'Fists');
  if(G.currentCar){ el.speedo.style.display='block'; el.speedo.innerHTML=`${Math.round(Math.abs(G.speedKmh))}<br><small>km/h</small>`; } else el.speedo.style.display='none';
  if(toastT>0){ toastT-=dt; if(toastT<=0) el.toast.textContent=''; }
  if(G.dialogueTimer>0){ G.dialogueTimer-=dt; if(G.dialogueTimer<=0 && el.dialogue) el.dialogue.style.display='none'; }
  el.bustedmeter.style.display = G.bustedTimer>0.15? 'block':'none';
  el.bustedfill.style.width=Math.min(100,G.bustedTimer/2.2*100)+'%';
  if(G.race.active){ el.racetimer.style.display='block'; el.racetimer.innerHTML=`HARBOUR RUN<br>${G.race.t.toFixed(1)}s &nbsp; CP ${G.race.idx}/${G.race.checkpoints.length}${G.race.best?`<br><small style="font-size:12px">Best ${G.race.best.toFixed(1)}s</small>`:''}`; }
  else el.racetimer.style.display='none';
}
export function setObjective(html){ if(el.objective) el.objective.innerHTML=html; }
export function setPrompt(txt){ if(el.prompt){ if(txt){ el.prompt.style.display='block'; el.prompt.textContent=txt; } else el.prompt.style.display='none'; } }
export function showScreen(id){
  for(const s of ['startscreen','pausescreen','endscreen','storyscreen']){ if(el[s]) el[s].classList.toggle('hidden', s!==id); }
  if(!id) for(const s of ['startscreen','pausescreen','endscreen','storyscreen']) el[s]?.classList.add('hidden');
}
