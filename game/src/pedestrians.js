// Pedestrians: wander the sidewalks, flee danger, fall (non-graphically)
// when clipped, and a few hail taxis with a green marker.
import { G, VROADS, HROADS, clamp } from './config.js';
import { makeHumanoid } from './player.js';
import { collide } from './city.js';
const T=()=>window.THREE;
const SHIRTS=[0x58a05c,0xe0a32e,0x7fb3d5,0xef6f9c,0xf2e3c6,0x9b7fd4,0x3aa79b];
export function spawnPeds(scene){
  for(let i=0;i<22;i++){
    const mesh=makeHumanoid(SHIRTS[i%SHIRTS.length], 0x33404f, [0xd9a066,0x8a5a34,0xf0c8a0][i%3]);
    scene.add(mesh);
    const vertical=G.rng()>0.5;
    const road=vertical? VROADS[Math.floor(G.rng()*VROADS.length)] : HROADS[Math.floor(G.rng()*(HROADS.length-1))];
    const along=-200+G.rng()*400;
    const p={ x: vertical? road+8.5 : along, z: vertical? along : road+8.5,
      heading:G.rng()*Math.PI*2, mesh, phase:G.rng()*6, state:'wander', timer:2+G.rng()*4,
      health:30, fallTimer:0, hail:false, walkSpeed:1.6+G.rng()*0.9 };
    G.peds.push(p);
  }
  // Three taxi hailers at fixed, findable spots.
  const hailSpots=[[12,44],[-48,130],[168,44]];
  hailSpots.forEach(([x,z],i)=>{
    const p=G.peds[i*3]; if(!p) return;
    p.x=x; p.z=z; p.hail=true; p.state='hail';
    const marker=new (T().Mesh)(new (T().ConeGeometry)(0.45,1.0,4), new (T().MeshBasicMaterial)({color:0x3ee06f}));
    marker.rotation.x=Math.PI; marker.position.set(x,2.9,z); scene.add(marker); p.hailMesh=marker;
  });
}
export function updatePeds(dt){
  const px=G.player?G.player.x:0, pz=G.player?G.player.z:0;
  const cx=G.currentCar?G.currentCar.x:px, cz=G.currentCar?G.currentCar.z:pz;
  const dangerSpeed=G.currentCar?Math.abs(G.currentCar.speed):0;
  for(const p of G.peds){
    if(p.state==='inTaxi'){ p.mesh.visible=false; continue; }
    if(p.state==='gone'){ p.mesh.visible=false; continue; }
    p.mesh.visible=true;
    if(p.fallTimer>0){
      p.fallTimer-=dt; p.mesh.rotation.x=-Math.PI/2*0.9; p.mesh.position.set(p.x,0.25,p.z);
      if(p.fallTimer<=0){ p.mesh.rotation.x=0; p.health=30; }
      continue;
    }
    let move=0;
    const dDanger=Math.hypot(cx-p.x,cz-p.z);
    if((dangerSpeed>7 && dDanger<11) || (G.wanted>=2 && dDanger<8)){
      p.state = p.hail? 'hailFlee':'flee';
      const away=Math.atan2(p.x-cx,p.z-cz);
      p.heading=away; move=5.2;
    } else if(p.state==='flee'){ p.state='wander'; }
    else if(p.state==='hail'){ move=0; p.mesh.position.set(p.x,0,p.z); if(p.hailMesh){ p.hailMesh.rotation.y+=dt*3; p.hailMesh.position.y=2.9+Math.sin(G.time*3)*0.15; } syncPed(p,dt,0); continue; }
    else {
      p.timer-=dt;
      if(p.timer<=0){ p.timer=2+G.rng()*5; p.heading=G.rng()*Math.PI*2; }
      move=p.walkSpeed;
    }
    if(move>0){
      const nx=p.x+Math.sin(p.heading)*move*dt, nz=p.z+Math.cos(p.heading)*move*dt;
      const c=collide(nx,nz,0.4);
      if(Math.abs(c.x-nx)>0.01||Math.abs(c.z-nz)>0.01) p.heading+=Math.PI*0.6;
      p.x=clamp(c.x,-224,224); p.z=clamp(c.z,-224,190);
    }
    p.phase+=dt*(move>3?12:7);
    syncPed(p,dt,move);
  }
}
function syncPed(p,dt,move){
  p.mesh.position.set(p.x,0,p.z); p.mesh.rotation.y=p.heading;
  const sw=move>0?Math.sin(p.phase)*0.45:0; const u=p.mesh.userData;
  if(u){ u.legL.rotation.x=sw; u.legR.rotation.x=-sw; u.armL.rotation.x=-sw*0.7; u.armR.rotation.x=sw*0.7; }
}
export function hitPed(p, dmg){
  p.health-=dmg;
  if(p.health<=0 && p.fallTimer<=0){ p.fallTimer=3.5; if(p.hail){ p.hail=false; if(p.hailMesh)p.hailMesh.visible=false; } }
}
