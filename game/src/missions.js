// Story missions M1-M4, the M5 Harbour Run checkpoint race, and taxi fares.
import { G, dist2d, clamp } from './config.js';
import { setBeacon } from './city.js';
import { showDialogue, showFanfare, toast, setObjective } from './hud.js';
import { Audio } from './audio.js';
import { saveGame } from './save.js';
export const MISSIONS=[
  {name:'M1 — First Run', reward:250},
  {name:'M2 — Hot Delivery', reward:400},
  {name:'M3 — Cool Off', reward:600},
  {name:'M4 — The Marina Score', reward:1200},
  {name:'M5 — Harbour Run', reward:500},
];
// Key locations
export const LOC={
  rosa:{x:20,z:-2,label:"Rosa at Café Delgado"},
  tito:{x:-140,z:-40,label:"Tito's Garage"},
  marina:{x:186,z:126,label:'the marina'},
  pharmacy:{x:-60,z:2,label:'Palmera Pharmacy'},
};
const BAGS=[[60,-100],[-100,60],[120,120],[-180,-140],[40,-190]];
let bagMeshes=[];
export function px(){ return G.currentCar?G.currentCar.x:G.player.x; }
export function pz(){ return G.currentCar?G.currentCar.z:G.player.z; }
export function near(x,z,d){ return dist2d(px(),pz(),x,z)<d; }
function completeMission(idx, reward, bonusText=''){
  G.cash+=reward;
  Audio.fanfare();
  showFanfare(MISSIONS[idx].name+' — Complete', reward, bonusText);
  G.missionIndex=idx+1; G.missionStage=0; G.missionTimer=0; G.missionBags=0;
  if(idx===3){ G.storyDone=true; setTimeout(()=>{},0); }
  saveGame();
}
export function startMission(i){
  // Jump straight into mission i (used by SOLANO hooks and normal flow).
  G.missionIndex=i; G.missionStage=0; G.missionTimer=0; G.missionBags=0;
  beginStage();
}
function setTarget(x,z){ G.missionTarget={x,z}; setBeacon('mission',x,z,true); }
function beginStage(){
  const i=G.missionIndex, s=G.missionStage;
  if(i===0){
    if(s===0){ setTarget(LOC.rosa.x,LOC.rosa.z); showDialogue('Rosa Delgado','Juno! Café Delgado, now. I have a package, you have legs and a borrowed car. Perfect match.',6); }
    if(s===1){ setTarget(LOC.tito.x,LOC.tito.z); showDialogue('Rosa Delgado',"Take this envelope to Tito at Tito's Garage, west side. Don't open it. Don't dent it.",6); }
  } else if(i===1){
    if(s===0){ setTarget(LOC.tito.x,LOC.tito.z); showDialogue('Tito Marlin','Rosa said you drive angry and park worse. Prove the first half right.',5); }
    if(s===1){ G.missionTimer=110; setTarget(LOC.marina.x,LOC.marina.z); showDialogue('Tito Marlin','Engine parts for Captain Sorin at the marina — clock is running, Juno. And take this pistol. Marina gets… discuss-y.',7); if(!G.hasPistol){ G.hasPistol=true; G.weapon='pistol'; } }
  } else if(i===2){
    if(s===0){ setTarget(LOC.marina.x,LOC.marina.z); showDialogue('Cpt. Ilya Sorin','Harbourmaster Sorin. You smell like trouble, courier. Good. I need trouble.',5); }
    if(s===1){ G.setWanted(3); showDialogue('Cpt. Ilya Sorin','The police think my crates are theirs. Shake a 3-star heat — lose them, then we talk money.',6); }
  } else if(i===3){
    if(s===0){ setTarget(LOC.marina.x,LOC.marina.z); showDialogue('Cpt. Ilya Sorin','Five cash bags, dropped round the city by a nervous friend. Collect them all. The heat will come.',6); }
    if(s===1){ spawnBags(); advanceBagTarget(); }
  } else if(i===4){
    if(s===0){ setTarget(LOC.marina.x,LOC.marina.z); }
  } else {
    G.missionTarget=null; setBeacon('mission',0,0,false);
  }
}
function spawnBags(){
  clearBags();
  const THREE=window.THREE;
  BAGS.forEach(([x,z])=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.5,0.6), new THREE.MeshLambertMaterial({color:0x3fae4a, emissive:0x14501c}));
    m.position.set(x,0.7,z); G.scene.add(m); bagMeshes.push({x,z,mesh:m,taken:false});
  });
}
function clearBags(){ for(const b of bagMeshes) G.scene.remove(b.mesh); bagMeshes=[]; }
function advanceBagTarget(){
  const b=bagMeshes.find(b=>!b.taken);
  if(b) setTarget(b.x,b.z); else setTarget(LOC.marina.x,LOC.marina.z);
}
export function objectiveText(){
  const i=G.missionIndex,s=G.missionStage;
  if(G.race.active) return `<b>Harbour Run:</b> checkpoint ${G.race.idx+1} of ${G.race.checkpoints.length} — ${G.race.t.toFixed(1)}s`;
  if(G.taxi.dest) return `<b>Taxi:</b> drive your passenger to the green marker`;
  if(G.taxi.passenger) return `<b>Taxi:</b> passenger aboard — follow the green blip`;
  if(i===0) return s===0?`<b>M1 First Run:</b> meet Rosa at Café Delgado`:`<b>M1 First Run:</b> deliver the envelope to Tito's Garage`;
  if(i===1) return s===0?`<b>M2 Hot Delivery:</b> see Tito at Tito's Garage`:`<b>M2 Hot Delivery:</b> reach the marina in ${Math.max(0,Math.ceil(G.missionTimer))}s`;
  if(i===2) return s===0?`<b>M3 Cool Off:</b> meet Cpt. Sorin at the marina`:`<b>M3 Cool Off:</b> lose the 3-star heat (stars left: ${G.wanted})`;
  if(i===3) return s===0?`<b>M4 The Marina Score:</b> meet Cpt. Sorin at the marina`:`<b>M4 The Marina Score:</b> collect cash bags ${G.missionBags}/5, then return to the marina`;
  if(i===4) return G.storyDone?`<b>M5 Harbour Run:</b> go to the marina start and press E to race`:`<b>M5</b> locked — finish the story first`;
  return `<b>Free roam:</b> taxi fares (green markers), Harbour Run at the marina, 10 golden conches ($50 each)`;
}
export function updateMissions(dt){
  const i=G.missionIndex, s=G.missionStage;
  if(i<5 && !G.race.active){
    if(s===0 && G.missionTarget && near(G.missionTarget.x,G.missionTarget.z,5)){
      // Arriving at a person: require on foot or slow car? accept either for flow.
      if(i===4){ /* race start handled by interact key */ }
      else { G.missionStage=1; Audio.sting(); beginStage(); }
    } else if(s===1){
      if(i===0 && near(LOC.tito.x,LOC.tito.z,6)){ completeMission(0,250,'Rosa\'s envelope, delivered unopened.'); beginStage(); }
      else if(i===1){
        G.missionTimer-=dt;
        if(near(LOC.marina.x,LOC.marina.z,7)){
          const bonus=G.missionTimer>40?100:0; if(bonus) G.cash+=bonus;
          completeMission(1,400, bonus?`Early by a mile — Tito slips you a $${bonus} time bonus.`:'Right on the wire.');
          beginStage();
        } else if(G.missionTimer<=0){ toast('Delivery failed — back to Tito.'); G.missionStage=0; beginStage(); }
      }
      else if(i===2){ if(G.wanted===0){ completeMission(2,600,'Heat lost. Sorin is impressed, briefly.'); beginStage(); } }
      else if(i===3){
        for(const b of bagMeshes){ if(!b.taken && dist2d(px(),pz(),b.x,b.z)<4.5){ b.taken=true; b.mesh.visible=false; G.missionBags++; Audio.coin(); toast(`Cash bag ${G.missionBags}/5`); G.raiseWanted(0.4); advanceBagTarget(); } }
        if(G.missionBags>=5){
          if(G.wanted<2) G.setWanted(2);
          if(near(LOC.marina.x,LOC.marina.z,7)){ clearBags(); completeMission(3,1200,'All five bags. The Marina Score is yours.'); const ss=document.getElementById('storyscreen'); if(ss) ss.classList.remove('hidden'); beginStage(); }
        }
      }
    }
    if(G.missionTarget && i!==4) setBeacon('mission',G.missionTarget.x,G.missionTarget.z,true);
  }
  updateRace(dt); updateTaxi(dt);
}
// ---------- M5 Harbour Run ----------
export const RACE_CPS=[{x:200,z:120},{x:120,z:160},{x:40,z:160},{x:-60,z:160},{x:-140,z:120},{x:-80,z:40},{x:0,z:-40},{x:40,z:-100}];
export function startRace(){
  if(!G.currentCar){ toast('Harbour Run needs a car — bring one to the start.'); return false; }
  G.race.active=true; G.race.idx=0; G.race.t=0; G.race.checkpoints=RACE_CPS; G.race.countdown=0;
  Audio.sting(); toast('HARBOUR RUN — follow the orange checkpoints!');
  const cp=RACE_CPS[0]; setBeacon('race',cp.x,cp.z,true); return true;
}
export function updateRace(dt){
  if(!G.race.active){ setBeacon('race',0,0,false); return; }
  G.race.t+=dt;
  const cp=G.race.checkpoints[G.race.idx]; if(!cp) return;
  setBeacon('race',cp.x,cp.z,true);
  if(dist2d(px(),pz(),cp.x,cp.z)<9){
    Audio.beep(G.race.idx===G.race.checkpoints.length-1);
    G.race.idx++;
    if(G.race.idx>=G.race.checkpoints.length){
      G.race.active=false; setBeacon('race',0,0,false);
      const t=G.race.t; const isBest=!G.race.best||t<G.race.best; if(isBest) G.race.best=t;
      G.cash+=500; Audio.fanfare();
      showFanfare('Harbour Run — Finished!',500,`Time ${t.toFixed(1)}s${isBest?' — new best time!':` (best ${G.race.best.toFixed(1)}s)`}`);
      if(G.missionIndex===4){ G.missionIndex=5; G.missionStage=0; }
      saveGame();
    } else { const n=G.race.checkpoints[G.race.idx]; setBeacon('race',n.x,n.z,true); toast(`Checkpoint ${G.race.idx}/${G.race.checkpoints.length} — ${G.race.t.toFixed(1)}s`); }
  }
}
// ---------- Taxi fares ----------
export function tryTaxiPickup(){
  if(!G.currentCar || G.taxi.passenger) return false;
  for(const p of G.peds){
    if(p.hail && dist2d(G.currentCar.x,G.currentCar.z,p.x,p.z)<6){
      p.hail=false; if(p.hailMesh)p.hailMesh.visible=false; p.state='inTaxi';
      G.taxi.passenger=p; G.taxi.t=0;
      const dests=[[ -160,-160],[160,-120],[0,120],[-40,-200],[200,40],[-200,80],[80,160]];
      const d=dests[Math.floor(G.rng()*dests.length)];
      G.taxi.dest={x:d[0],z:d[1]};
      setBeacon('taxi',d[0],d[1],true);
      showDialogue('Passenger','Thanks! Green marker on your map — fast gets a tip, friend.',4);
      Audio.beep(); return true;
    }
  }
  return false;
}
export function startTaxiHook(){
  // SOLANO helper: teleport the nearest hailer beside the player car.
  const p=G.peds.find(p=>p.hail); if(!p) return false;
  if(G.currentCar){ p.x=G.currentCar.x+3; p.z=G.currentCar.z+3; return tryTaxiPickup(); }
  p.x=G.player.x+2; p.z=G.player.z+2; return false;
}
export function updateTaxi(dt){
  if(G.taxi.passenger){
    G.taxi.t+=dt;
    if(G.taxi.dest && G.currentCar && dist2d(G.currentCar.x,G.currentCar.z,G.taxi.dest.x,G.taxi.dest.z)<7 && Math.abs(G.currentCar.speed)<3){
      const d0=dist2d(G.taxi.passenger.x,G.taxi.passenger.z,G.taxi.dest.x,G.taxi.dest.z);
      const fare=Math.max(15, Math.round(d0*0.9));
      const tip=G.taxi.t< Math.max(18,d0*0.9) ? Math.round(fare*0.5) : 0;
      const total=fare+tip;
      G.cash+=total; G.stats.taxiEarnings+=total; G.stats.taxiCount++;
      toast(`Taxi fare $${fare}${tip?` + $${tip} speed tip`:''} — total $${total}`);
      Audio.coin();
      const p=G.taxi.passenger; p.state='gone'; if(p.mesh)p.mesh.visible=false;
      G.taxi.passenger=null; G.taxi.dest=null; setBeacon('taxi',0,0,false); saveGame();
    }
  }
}
export function initMissions(){ if(G.missionIndex<5) beginStage(); }
