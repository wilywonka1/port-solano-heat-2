// Wanted system: police cars pursue and ram, foot officers at 3+ stars
// chase and fire tracers, heat decays out of sight, bust meter fills close up.
import { G, clamp, dist2d } from './config.js';
import { spawnCar, syncCarMesh, CAR_TYPES } from './vehicles.js';
import { makeHumanoid } from './player.js';
import { collide } from './city.js';
import { Audio } from './audio.js';
const T=()=>window.THREE;
let spawnTimer=0, shootTimer=0;
export function desiredPolice(){ return G.wanted<=0?0 : G.wanted===1?1 : G.wanted===2?2 : G.wanted===3?3 : G.wanted===4?4 : 5; }
export function spawnPoliceCar(){
  const p=G.player; if(!p) return;
  // Converge along the player's own road, 26-38m back, so pursuit actually
  // reaches the player instead of spawning across the map behind buildings.
  const h=G.currentCar?G.currentCar.heading:(p.heading||0);
  const behind=G.rng()>0.3;
  const d=26+G.rng()*12, lat=(G.rng()-0.5)*5;
  const dir=behind?-1:1;
  const x=clamp(p.x+Math.sin(h)*d*dir+Math.cos(h)*lat,-220,220), z=clamp(p.z+Math.cos(h)*d*dir-Math.sin(h)*lat,-220,185);
  const car=spawnCar(x,z,Math.atan2(p.x-x,p.z-z),4,0x18222e);
  car.isPolice=true; G.policeCars.push(car); return car;
}
export function spawnPoliceAt(x,z,heading,speed=0){
  const car=spawnCar(x,z,heading,4,0x18222e);
  car.isPolice=true; car.speed=speed; G.policeCars.push(car); return car;
}
export function spawnOfficer(){
  const p=G.player; if(!p) return;
  const mesh=makeHumanoid(0x1d3a6e,0x141c28); G.scene.add(mesh);
  const o={x:p.x+(G.rng()-0.5)*36, z:p.z+(G.rng()-0.5)*36, heading:0, mesh, phase:0, health:40, fallTimer:0};
  G.officers.push(o); return o;
}
export function clearPolice(){
  for(const c of G.policeCars){ G.scene.remove(c.mesh); const i=G.cars.indexOf(c); if(i>=0)G.cars.splice(i,1); }
  G.policeCars.length=0;
  for(const o of G.officers) G.scene.remove(o.mesh);
  G.officers.length=0;
}
export function updatePolice(dt, onPlayerHit, addTracer){
  const p=G.player; if(!p) return;
  const px=G.currentCar?G.currentCar.x:p.x, pz=G.currentCar?G.currentCar.z:p.z;
  spawnTimer-=dt;
  if(G.wanted>=1 && spawnTimer<=0){
    while(G.policeCars.length<desiredPolice()) spawnPoliceCar();
    if(G.wanted>=3 && G.officers.length<G.wanted-1 && G.officers.length<3) spawnOfficer();
    spawnTimer=1.4;
  }
  if(G.wanted<=0 && G.policeCars.length){ clearPolice(); }
  // Sight / decay
  let seen=false;
  for(const c of G.policeCars) if(dist2d(c.x,c.z,px,pz)<62) seen=true;
  for(const o of G.officers) if(dist2d(o.x,o.z,px,pz)<40) seen=true;
  if(seen) G.heatSeen=4; else G.heatSeen-=dt;
  if(G.wanted>0 && G.heatSeen<0){
    G.evadeTimer+=dt;
    const need = G.missionIndex===2 && G.missionStage===1 ? 2.2 : 9; // M3 teaches evasion, decays faster there
    if(G.evadeTimer>need){ G.setWanted(Math.max(0,G.wanted-1)); G.evadeTimer=0; if(G.wanted===0) clearPolice(); }
  } else G.evadeTimer=0;
  // Police cars: pursue, ram.
  for(const car of G.policeCars){
    const dx=px-car.x, dz=pz-car.z, d=Math.hypot(dx,dz);
    const want=Math.atan2(dx,dz);
    let diff=((want-car.heading+Math.PI*3)%(Math.PI*2))-Math.PI;
    car.heading+=clamp(diff,-2.0*dt,2.0*dt);
    const top=CAR_TYPES[4].top;
    const targetSpeed = d>14? top : d>5? top*0.55 : 8;
    car.speed+=(targetSpeed-car.speed)*Math.min(1,dt*1.6);
    const nx=car.x+Math.sin(car.heading)*car.speed*dt, nz=car.z+Math.cos(car.heading)*car.speed*dt;
    const c=collide(nx,nz,1.3);
    if(Math.abs(c.x-nx)>0.02){ car.speed*=0.4; car.heading+=0.6*dt; }
    car.x=c.x; car.z=c.z; syncCarMesh(car);
    if(d<3.2 && Math.abs(car.speed)>6 && G.currentCar){ /* ram shove */ G.currentCar.speed*=0.82; }
  }
  // Officers on foot
  shootTimer-=dt;
  for(const o of G.officers){
    if(o.fallTimer>0){ o.fallTimer-=dt; o.mesh.rotation.x=-Math.PI/2*0.9; o.mesh.position.set(o.x,0.25,o.z); continue; }
    o.mesh.rotation.x=0;
    const dx=px-o.x, dz=pz-o.z, d=Math.hypot(dx,dz);
    o.heading=Math.atan2(dx,dz);
    if(d>7){ const c=collide(o.x+Math.sin(o.heading)*4.4*dt, o.z+Math.cos(o.heading)*4.4*dt,0.45); o.x=c.x; o.z=c.z; o.phase+=dt*11; }
    o.mesh.position.set(o.x,0,o.z); o.mesh.rotation.y=o.heading;
    const u=o.mesh.userData; if(u){ const sw=Math.sin(o.phase)*0.45; u.legL.rotation.x=sw; u.legR.rotation.x=-sw; }
    if(d<30 && d>4 && shootTimer<=0 && G.wanted>=3){
      shootTimer=0.9+G.rng()*0.7;
      addTracer(o.x,1.35,o.z, px,1.1,pz, 0xff5040);
      Audio.shot();
      if(G.rng()<0.45) onPlayerHit(4+G.rng()*5);
    }
  }
  // Busted meter: police close while slow / on foot.
  const playerSpeed=G.currentCar?Math.abs(G.currentCar.speed):(G.player.speedNow||0);
  let close=false;
  for(const c of G.policeCars) if(dist2d(c.x,c.z,px,pz)<6.5) close=true;
  for(const o of G.officers) if(dist2d(o.x,o.z,px,pz)<3.4) close=true;
  if(G.wanted>=1 && close && playerSpeed<2.2){
    G.bustedTimer+=dt;
    if(G.bustedTimer>2.2){ G.bustedTimer=0; return 'busted'; }
  } else G.bustedTimer=Math.max(0,G.bustedTimer-dt*1.5);
  return null;
}
