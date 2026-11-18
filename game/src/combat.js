// Fists and the story pistol: hitscan with tracers and a muzzle flash.
import { G, dist2d } from './config.js';
import { Audio } from './audio.js';
import { hitPed } from './pedestrians.js';
const T=()=>window.THREE;
let tracers=[], flash=null, flashT=0;
export function initCombat(scene){
  const geo=new (T().BufferGeometry)(); geo.setAttribute('position', new (T().BufferAttribute)(new Float32Array(6),3));
  flash=new (T().Mesh)(new (T().SphereGeometry)(0.16,6,6), new (T().MeshBasicMaterial)({color:0xffd76a}));
  flash.visible=false; scene.add(flash);
}
export function addTracer(x1,y1,z1,x2,y2,z2,color=0xffe28a){
  const THREE=T();
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x2,y2,z2)]);
  const line=new THREE.Line(geo, new THREE.LineBasicMaterial({color, transparent:true, opacity:0.95}));
  G.scene.add(line); tracers.push({line, t:0.14});
}
export function updateCombat(dt){
  for(let i=tracers.length-1;i>=0;i--){ const tr=tracers[i]; tr.t-=dt; tr.line.material.opacity=Math.max(0,tr.t/0.14); if(tr.t<=0){ G.scene.remove(tr.line); tr.line.geometry.dispose(); tracers.splice(i,1); } }
  if(flashT>0){ flashT-=dt; if(flashT<=0 && flash) flash.visible=false; }
  if(G.reloading>0){ G.reloading-=dt; if(G.reloading<=0){ const need=12-G.ammo, take=Math.min(need,G.reserve); G.ammo+=take; G.reserve-=take; } }
}
function facing(){ return {x:Math.sin(G.currentCar?G.currentCar.heading:G.yaw), z:Math.cos(G.currentCar?G.currentCar.heading:G.yaw)}; }
export function punch(){
  const p=G.player; if(!p||G.currentCar) return;
  Audio.punch();
  const u=p.mesh.userData; if(u) u.armR.rotation.x=-1.6;
  const f=facing();
  for(const ped of G.peds){
    if(ped.state==='inTaxi'||ped.state==='gone') continue;
    if(dist2d(p.x+f.x*1.2,p.z+f.z*1.2,ped.x,ped.z)<1.3){ hitPed(ped,16); G.raiseWanted(0.55); return; }
  }
  for(const o of G.officers){ if(dist2d(p.x+f.x*1.2,p.z+f.z*1.2,o.x,o.z)<1.3){ o.health-=16; if(o.health<=0)o.fallTimer=4; G.raiseWanted(0.6); return; } }
}
export function shoot(){
  if(!G.hasPistol || G.weapon!=='pistol' || G.currentCar) return;
  if(G.reloading>0) return;
  if(G.ammo<=0){ Audio.beep(); G.reloading=0.1; reload(); return; }
  G.ammo--; Audio.shot();
  const p=G.player, f=facing();
  const ox=p.x+f.x*0.5, oz=p.z+f.z*0.5;
  let bestT=60, hit=null, hitKind=null;
  const test=(x,z,kind,obj)=>{ const dx=x-p.x, dz=z-p.z; const t=dx*f.x+dz*f.z; if(t<1||t>60) return; const perp=Math.abs(dx*f.z-dz*f.x); if(perp<0.9 && t<bestT){ bestT=t; hit=obj; hitKind=kind; } };
  for(const ped of G.peds){ if(ped.state!=='inTaxi'&&ped.state!=='gone') test(ped.x,ped.z,'ped',ped); }
  for(const o of G.officers) test(o.x,o.z,'officer',o);
  for(const c of G.cars){ if(c!==G.currentCar) test(c.x,c.z,'car',c); }
  const ex=p.x+f.x*bestT, ez=p.z+f.z*bestT;
  addTracer(ox,1.35,oz, ex,1.1,ez);
  if(flash){ flash.position.set(ox,1.35,oz); flash.visible=true; flashT=0.05; }
  if(hitKind==='ped'){ hitPed(hit,34); G.raiseWanted(0.8); }
  else if(hitKind==='officer'){ hit.health-=34; if(hit.health<=0)hit.fallTimer=5; G.raiseWanted(1); }
  else if(hitKind==='car'){ hit.health-=12; Audio.impact(); }
  else G.raiseWanted(0.35);
  if(G.ammo===0) reload();
}
export function reload(){ if(G.reserve>0 && G.ammo<12 && G.reloading<=0){ G.reloading=1.1; Audio.beep(); } }
