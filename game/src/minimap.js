// Live canvas minimap: roads, sea, and colour-coded blips.
import { G, VROADS, HROADS } from './config.js';
export function drawMinimap(){
  const cv=document.getElementById('minimap'); if(!cv) return;
  const g=cv.getContext('2d'); const S=180, W2W=S/480; // world 480 -> 180px
  const toX=x=>(x+240)*W2W, toY=z=>(z+240)*W2W;
  g.clearRect(0,0,S,S);
  g.fillStyle='#24382a'; g.fillRect(0,0,S,S);
  g.fillStyle='#2e7fa8'; g.fillRect(0,toY(190),S,S-toY(190));
  g.fillStyle='#f0d49a'; g.fillRect(0,toY(168),S,toY(190)-toY(168));
  g.strokeStyle='#4a5058'; g.lineWidth=3;
  for(const x of VROADS){ g.beginPath(); g.moveTo(toX(x),0); g.lineTo(toX(x),S); g.stroke(); }
  for(const z of HROADS){ g.beginPath(); g.moveTo(0,toY(z)); g.lineTo(S,toY(z)); g.stroke(); }
  const dot=(x,z,c,r=3)=>{ g.fillStyle=c; g.beginPath(); g.arc(toX(x),toY(z),r,0,7); g.fill(); };
  for(const c of G.conches) if(!c.found) dot(c.x,c.z,'rgba(255,240,180,0.8)',1.6);
  for(const c of G.traffic) dot(c.x,c.z,'#9aa3ab',2);
  if(G.taxi.dest) dot(G.taxi.dest.x,G.taxi.dest.z,'#3ee06f',4);
  else for(const p of G.peds) if(p.hail) dot(p.x,p.z,'#3ee06f',3);
  if(G.race.active && G.race.checkpoints[G.race.idx]){ const cp=G.race.checkpoints[G.race.idx]; dot(cp.x,cp.z,'#ff7b1c',4.5); }
  else if(G.missionTarget) dot(G.missionTarget.x,G.missionTarget.z,'#ffd23e',4.5);
  const flash=Math.sin(G.time*8)>0;
  for(const c of G.policeCars) dot(c.x,c.z, flash?'#3060ff':'#ff3040',3.4);
  for(const o of G.officers) dot(o.x,o.z, flash?'#3060ff':'#ff3040',2.4);
  if(G.currentCar) dot(G.currentCar.x,G.currentCar.z,'#ffffff',3);
  // Player arrow (white, heading up-relative to world north)
  const p=G.player; if(!p) return;
  const px=toX(G.currentCar?G.currentCar.x:p.x), py=toY(G.currentCar?G.currentCar.z:p.z);
  const h=G.currentCar?G.currentCar.heading:(p.heading||0);
  g.save(); g.translate(px,py); g.rotate(Math.atan2(Math.sin(h),-Math.cos(h))+Math.PI);
  g.fillStyle='#ffffff'; g.beginPath(); g.moveTo(0,-6); g.lineTo(4,5); g.lineTo(-4,5); g.closePath(); g.fill(); g.restore();
}
