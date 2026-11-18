// Solano Heat: Golden Hour — main loop, input, car entry, crime triggers,
// respawn flow, shot hooks and the window.SOLANO debug surface.
import { G, clamp, dist2d, onRoad, makeRng } from './config.js';
import { buildCity, updateCity, collide } from './city.js';
import { Audio } from './audio.js';
import { createPlayer, updatePlayer, updateCamera, teleport } from './player.js';
import { spawnTraffic } from './traffic.js';
import { updateTraffic } from './traffic.js';
import { spawnPeds, updatePeds, hitPed } from './pedestrians.js';
import { driveCar, carAt, syncCarMesh } from './vehicles.js';
import { updatePolice, clearPolice, spawnPoliceAt } from './police.js';
import { initCombat, updateCombat, punch, shoot, reload, addTracer } from './combat.js';
import { buildHud, updateHud, setObjective, setPrompt, toast, showDialogue, showFanfare, hideFanfare, showScreen, getEl } from './hud.js';
import { drawMinimap } from './minimap.js';
import { saveGame, loadGame, applySave, hasSave } from './save.js';
import { initMissions, updateMissions, objectiveText, startMission, startRace, tryTaxiPickup, startTaxiHook, LOC } from './missions.js';
const THREE=window.THREE;
const params=new URLSearchParams(location.search);
G.seed=parseInt(params.get('seed')||'1',10)||1; G.rng=makeRng(G.seed);
G.shotMode=params.get('shot');
// Renderer / scene
const renderer=new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(1, window.devicePixelRatio||1));
renderer.setSize(innerWidth, innerHeight);
document.getElementById('app').appendChild(renderer.domElement);
G.renderer=renderer;
const scene=new THREE.Scene(); G.scene=scene;
const camera=new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(-8,4,-10); G.camera=camera;
buildHud(document.getElementById('ui'));
buildCity(scene);
createPlayer(scene);
spawnTraffic(); spawnPeds(scene); initCombat(scene);
initMissions();
camera.position.set(G.player.x-7,3.2,G.player.z-7);
// ---------- Input ----------
addEventListener('keydown',e=>{
  G.keys[e.code]=true; Audio.ensure();
  if(e.code==='KeyE') interact();
  if(e.code==='KeyF') punch();
  if(e.code==='KeyR') reload();
  if(e.code==='KeyP'||e.code==='Escape'){ if(G.started && !G.over) togglePause(); }
  if(['ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup',e=>{ G.keys[e.code]=false; });
addEventListener('mousemove',e=>{
  if(document.pointerLockElement===renderer.domElement){
    G.yaw-=e.movementX*0.0026; G.pitch=clamp(G.pitch-e.movementY*0.0022,-0.55,0.55);
  }
});
renderer.domElement.addEventListener('click',()=>{
  Audio.ensure();
  if(G.started && !G.currentCar && document.pointerLockElement!==renderer.domElement) renderer.domElement.requestPointerLock?.();
  else if(G.started && !G.currentCar) shootOrPunch();
});
function shootOrPunch(){ if(G.weapon==='pistol'&&G.hasPistol) shoot(); else punch(); }
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
// ---------- Car entry / interaction ----------
function interact(){
  if(G.fanfare){ hideFanfare(); return; }
  if(!G.started||G.paused||G.over) return;
  if(G.currentCar){
    const c=G.currentCar; G.currentCar=null;
    G.player.x=c.x+Math.cos(c.heading)*2.2; G.player.z=c.z-Math.sin(c.heading)*2.2;
    const cc=collide(G.player.x,G.player.z,0.5); G.player.x=cc.x; G.player.z=cc.z;
    G.player.mesh.visible=true; Audio.ensure(); return;
  }
  // Race start?
  if(G.missionIndex===4 && dist2d(G.player.x,G.player.z,LOC.marina.x,LOC.marina.z)<8){ /* needs car; toast in startRace */ }
  const car=carAt(G.player.x,G.player.z,4.2);
  if(car){
    const wasParked=car.parked;
    car.parked=false;
    const ti=G.traffic.indexOf(car); if(ti>=0){ G.traffic.splice(ti,1); }
    const pi=G.policeCars.indexOf(car); if(pi>=0){ G.policeCars.splice(pi,1); }
    G.currentCar=car; G.player.mesh.visible=false;
    if(wasParked){ G.raiseWanted(0.55); toast('Car taken — heat rising'); Audio.impact(); }
    tryTaxiPickup();
    return;
  }
  // On-foot race start prompt is handled by driving to marina; nothing else.
}
function togglePause(){
  G.paused=!G.paused;
  const el=getEl();
  if(G.paused){ showScreen('pausescreen'); const ps=document.getElementById('pausestats'); if(ps) ps.innerHTML=`Cash $${G.cash} · Conches ${G.conchFound.size}/10 · Taxi earnings $${G.stats.taxiEarnings} (${G.stats.taxiCount} fares)${G.race.best?` · Harbour Run best ${G.race.best.toFixed(1)}s`:''}`; }
  else showScreen(null);
}
// ---------- End states ----------
function endState(kind){
  G.over=true; clearPolice(); G.setWanted(0);
  const fine=Math.min(200, Math.max(25, Math.floor(G.cash*0.15)));
  G.cash=Math.max(0,G.cash-fine);
  const el=getEl();
  document.getElementById('end-title').textContent= kind==='busted'?'BUSTED':'WASTED';
  document.getElementById('end-text').textContent= kind==='busted'
    ? `The Port Solano police walk Juno to a cell for the night. $${fine} in fines and fees. She is out by golden hour.`
    : `Juno wakes up outside Palmera Pharmacy with a headache and a $${fine} clinic bill. The city kept spinning without her.`;
  showScreen('endscreen'); saveGame();
}
function respawn(){
  G.over=false; G.health=100; G.bustedTimer=0;
  if(G.currentCar) G.currentCar=null;
  G.player.mesh.visible=true;
  teleport(6,14); G.player.heading=Math.PI; G.yaw=Math.PI;
  showScreen(null);
}
// ---------- Start flow ----------
function startGame(useSave){
  Audio.ensure();
  if(useSave){ const s=loadGame(); if(s){ applySave(s); // re-place conches visibility
      for(const c of G.conches){ c.found=G.conchFound.has(c.idx); c.mesh.visible=!c.found; }
      G.missionIndex=s.missionIndex??0; initMissions();
    } }
  G.started=true; showScreen(null);
  if(!useSave) showDialogue('Rosa Delgado','Juno Vale. One envelope, one garage, no detours. Café Delgado — gold beacon. Go.',6);
  saveGame();
}
document.getElementById('btn-start')?.addEventListener('click',()=>startGame(false));
document.getElementById('btn-continue')?.addEventListener('click',()=>startGame(true));
document.getElementById('btn-resume')?.addEventListener('click',togglePause);
document.getElementById('btn-respawn')?.addEventListener('click',respawn);
document.getElementById('btn-freeroam')?.addEventListener('click',()=>showScreen(null));
if(!hasSave()){ const b=document.getElementById('btn-continue'); if(b) b.style.opacity='0.45'; }
// ---------- Shot hooks ----------
function arrangeShot(){
  const mode=G.shotMode; if(!mode) return;
  G.started=true; showScreen(null);
  if(mode==='cover'){
    teleport(-3,10); G.player.heading=0.9; G.yaw=2.4; G.pitch=-0.08;
    // Deterministic two-way traffic on the spawn street + a near pedestrian.
    const t0=G.traffic[0], t1=G.traffic[1];
    if(t0){ t0.x=2.6; t0.z=-26; t0.heading=0; t0.ai={vertical:true,dir:1,speed:10,target:null}; }
    if(t1){ t1.x=-2.6; t1.z=34; t1.heading=Math.PI; t1.ai={vertical:true,dir:-1,speed:10,target:null}; }
    const pd=G.peds[1]; if(pd){ pd.x=-6; pd.z=4; pd.state='wander'; }
    camera.position.set(-4,2.2,20);
    G.missionIndex=0; G.missionStage=0; initMissions();
    showDialogue('Rosa Delgado','Golden hour, Juno. Café Delgado is two streets over — envelope first, sunset second.',0);
    G.dialogueTimer=999; // keep objective visible, dialogue optional: hide it for cover
    const d=document.getElementById('dialogue'); if(d)d.style.display='none'; G.dialogueTimer=0;
  } else if(mode==='chase'){
    const car=G.cars.find(c=>c.isStarter)||G.cars[0];
    if(car){ car.parked=false; G.currentCar=car; car.x=0; car.z=-20; car.heading=0; car.speed=16; G.player.mesh.visible=false; }
    G.setWanted(3); G.missionIndex=1; G.missionStage=1; G.missionTimer=95; G.missionTarget={x:LOC.marina.x,z:LOC.marina.z};
    // Two cruisers already on the tail, either side, inside the camera cone.
    spawnPoliceAt(-3.2,-31,0,17); spawnPoliceAt(3.4,-36,0,17);
    const d=document.getElementById('dialogue'); if(d)d.style.display='none'; G.dialogueTimer=0;
    camera.position.set(0,4,-32);
  } else if(mode==='mission'){
    teleport(-136,-36); G.player.heading=Math.PI; G.yaw=Math.PI; G.pitch=-0.05;
    camera.position.set(-136,2.4,-29);
    G.missionIndex=1; G.missionStage=0; initMissions();
    showDialogue('Tito Marlin',"At Tito's Garage we fix cars and bad decisions. Rosa's envelope buys you both — marina run, clock running.",999);
    G.dialogueTimer=999;
  } else if(mode==='beach'){
    // Golden Hour cover drive: Juno's yellow sports car (the starter, type 3
    // in a sunflower yellow) on the beachfront road, angled east-south-east
    // so the marina boats ahead and the beach umbrellas to starboard share
    // the frame, with the downtown skyline behind them.
    const car=G.cars.find(c=>c.isStarter)||G.cars.find(c=>c.type===3);
    if(car){ car.parked=false; G.currentCar=car; car.x=148; car.z=160.5; car.heading=Math.PI/2-0.42; car.speed=24; G.player.mesh.visible=false; }
    // One traffic car cruising the same beachfront road ahead of Juno.
    const ahead=G.traffic.find(c=>c!==car);
    if(ahead){ ahead.x=174; ahead.z=157.4; ahead.heading=Math.PI/2; ahead.speed=11; ahead.ai={vertical:false,dir:1,speed:11,target:null}; }
    const d=document.getElementById('dialogue'); if(d)d.style.display='none'; G.dialogueTimer=0;
    camera.position.set(124,2.6,158);
  }
}
// ---------- Main loop ----------
let last=performance.now(), minimapAcc=0, crimeAcc=0;
function loop(now){
  requestAnimationFrame(loop);
  let dt=Math.min(0.05,(now-last)/1000); last=now;
  if(!G.started||G.paused||G.over){ renderer.render(scene,camera); return; }
  G.time+=dt;
  // Driving
  if(G.currentCar){
    const c=G.currentCar;
    const input={ throttle:(G.keys['KeyW']?1:0)+(G.keys['KeyS']?-1:0), steer:(G.keys['KeyA']?1:0)+(G.keys['KeyD']?-1:0), brake:!!G.keys['Space'] };
    if((G.shotMode==='beach'||G.shotMode==='chase') && c.speed<22 && c.speed>-1) input.throttle=1; // shot scenes cruise
    // Note steer sign: A should turn left (heading increases in our convention when moving +z?) tested via smoke.
    const hit=driveCar(c,input,dt);
    G.player.x=c.x; G.player.z=c.z; G.player.heading=c.heading;
    G.speedKmh=c.speed*3.6;
    if(hit){ Audio.impact(); if(Math.abs(c.speed)>4) G.raiseWanted(0.12); }
    // Hit peds with car
    for(const ped of G.peds){ if(ped.state!=='inTaxi'&&ped.state!=='gone'&&ped.fallTimer<=0&&dist2d(c.x,c.z,ped.x,ped.z)<1.7&&Math.abs(c.speed)>3){ hitPed(ped,40); Audio.impact(); G.raiseWanted(0.7); toast('Pedestrian down!'); } }
    // Reckless: sidewalk driving at speed
    crimeAcc+=dt;
    if(crimeAcc>0.7){ crimeAcc=0; if(Math.abs(c.speed)>10 && !onRoad(c.x,c.z)) G.raiseWanted(0.22); }
    // Taxi pickup check continuously (passenger may hail while you roll up)
    if(!G.taxi.passenger) tryTaxiPickup();
    // Race start while in car at marina
    if(G.missionIndex===4 && !G.race.active && dist2d(c.x,c.z,LOC.marina.x,LOC.marina.z)<9 && G.keys['KeyE']){ startRace(); }
  } else {
    updatePlayer(dt);
    // Walk into race start area hint
  }
  updateTraffic(dt); updatePeds(dt);
  const ev=updatePolice(dt,(dmg)=>{ G.health-=dmg; }, addTracer);
  if(ev==='busted'){ endState('busted'); }
  updateCombat(dt); updateMissions(dt); updateCity(dt);
  // Conches
  const cx=G.currentCar?G.currentCar.x:G.player.x, cz=G.currentCar?G.currentCar.z:G.player.z;
  for(const conch of G.conches){ if(!conch.found && dist2d(cx,cz,conch.x,conch.z)<2.6){ conch.found=true; conch.mesh.visible=false; G.conchFound.add(conch.idx); G.cash+=50; Audio.coin(); toast(`Golden conch ${G.conchFound.size}/10 — +$50`); saveGame(); } }
  if(G.health<=0 && !G.over) endState('wasted');
  // Prompt
  let prompt='';
  if(G.fanfare) prompt='Press E to continue';
  else if(!G.currentCar){ const car=carAt(G.player.x,G.player.z,4.2); if(car) prompt='Press E to get in the car'; else if(G.missionIndex===4&&dist2d(G.player.x,G.player.z,LOC.marina.x,LOC.marina.z)<8) prompt='Harbour Run: bring a car here, then press E in the car to race'; }
  else prompt='E exit car · Space handbrake';
  setPrompt(prompt);
  setObjective(objectiveText());
  updateHud(dt); Audio.update(dt);
  updateCamera(dt);
  minimapAcc+=dt; if(minimapAcc>0.12){ minimapAcc=0; drawMinimap(); }
  G.saveTick=(G.saveTick||0)+dt; if(G.saveTick>8){ G.saveTick=0; saveGame(); }
  renderer.render(scene,camera);
}
requestAnimationFrame(loop);
if(G.shotMode){ // arrange after first frames so traffic/peds exist
  setTimeout(()=>{ arrangeShot(); drawMinimap(); updateHud(0); setObjective(objectiveText()); },350);
}
// ---------- SOLANO debug / smoke surface ----------
window.SOLANO={
  get state(){ return {cash:G.cash, health:G.health, wanted:G.wanted, missionIndex:G.missionIndex, missionStage:G.missionStage, storyDone:G.storyDone, hasPistol:G.hasPistol, race:{...G.race, checkpoints:undefined}, taxi:{hasPassenger:!!G.taxi.passenger, dest:G.taxi.dest}, conches:G.conchFound.size, police:G.policeCars.length, officers:G.officers.length, inCar:!!G.currentCar, started:G.started}; },
  setWanted(n){ G.setWanted(n); },
  teleport(x,z){ teleport(x,z); },
  startMission(i){ startMission(i); },
  giveWeapon(){ G.hasPistol=true; G.weapon='pistol'; G.ammo=12; },
  startTaxi(){ return startTaxiHook(); },
  startRace(){ return startRace(); },
  raceState(){ return {active:G.race.active, idx:G.race.idx, t:G.race.t, best:G.race.best}; },
  playerState(){ const p=G.player; return {x:p.x,z:p.z,heading:p.heading,inCar:!!G.currentCar, carSpeed:G.currentCar?G.currentCar.speed:0, health:G.health}; },
  missionState(){ return {index:G.missionIndex, stage:G.missionStage, target:G.missionTarget, bags:G.missionBags}; },
  start(useSave=false){ startGame(useSave); },
  enterCar(){ interact(); },
  cash(){ return G.cash; },
};
