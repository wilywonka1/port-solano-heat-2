// Traffic AI: cars loop the road grid, turning at intersections, plus
// parked stealable cars sprinkled along kerbs.
import { G, VROADS, HROADS, clamp } from './config.js';
import { spawnCar, syncCarMesh } from './vehicles.js';
export function spawnTraffic(){
  const spots=[];
  for(let i=0;i<14;i++){
    const vertical=i%2===0;
    const road=vertical? VROADS[1+Math.floor(G.rng()*(VROADS.length-2))] : HROADS[Math.floor(G.rng()*(HROADS.length-1))];
    const along=-180+G.rng()*360;
    const dir=G.rng()>0.5?1:-1;
    let x,z,heading;
    if(vertical){ x=road+(dir>0?2.6:-2.6); z=along; heading=dir>0?0:Math.PI; }
    else { z=road+(dir>0?-2.6:2.6); x=along; heading=dir>0?Math.PI/2:-Math.PI/2; }
    const car=spawnCar(x,z,heading, Math.floor(G.rng()*4));
    car.ai={vertical, dir, speed:11+G.rng()*5, target:null};
    G.traffic.push(car); spots.push(car);
  }
  // Parked, stealable cars.
  for(let i=0;i<16;i++){
    const vertical=G.rng()>0.4;
    const road=vertical? VROADS[Math.floor(G.rng()*VROADS.length)] : HROADS[Math.floor(G.rng()*(HROADS.length-1))];
    const along=-200+Math.floor(G.rng()*20)*20+6;
    let x,z,heading;
    if(vertical){ x=road+5.6; z=along; heading=0; } else { z=road+5.6; x=along; heading=Math.PI/2; }
    const car=spawnCar(x,z,heading, Math.floor(G.rng()*4), undefined, true);
    car.parked=true;
  }
  // Juno's starter sports car near spawn, and a spare sedan by the beach road.
  const mine=spawnCar(4,-6,Math.PI,3,0xffc21c,true); mine.parked=true; mine.isStarter=true;
  const beach=spawnCar(60,154,Math.PI/2,0,0x3a6ea8,true); beach.parked=true;
}
function nextTarget(car){
  // Drive to the next intersection along current axis, then maybe turn.
  const a=car.ai;
  if(a.vertical){
    const ahead=HROADS.filter(z=> a.dir>0 ? z>car.z+4 : z<car.z-4);
    const nz=a.dir>0? Math.min(...ahead, 999) : Math.max(...ahead, -999);
    if(!isFinite(nz)||Math.abs(nz)>230){ a.dir*=-1; car.heading+=Math.PI; return; }
    a.target={x:car.x, z:nz};
  } else {
    const ahead=VROADS.filter(x=> a.dir>0 ? x>car.x+4 : x<car.x-4);
    const nx=a.dir>0? Math.min(...ahead, 999) : Math.max(...ahead, -999);
    if(!isFinite(nx)||Math.abs(nx)>230){ a.dir*=-1; car.heading+=Math.PI; return; }
    a.target={x:nx, z:car.z};
  }
}
export function updateTraffic(dt){
  for(const car of G.traffic){
    if(car===G.currentCar) continue;
    const a=car.ai; if(!a) continue;
    if(!a.target) nextTarget(car);
    if(!a.target) continue;
    const dx=a.target.x-car.x, dz=a.target.z-car.z;
    const d=Math.hypot(dx,dz);
    if(d<3){
      // At an intersection: 45% turn.
      if(G.rng()<0.45){ a.vertical=!a.vertical; a.dir=G.rng()>0.5?1:-1; }
      a.target=null;
      // Snap to the correct lane offset for the (possibly new) axis.
      if(a.vertical){ const road=VROADS.reduce((b,r)=>Math.abs(r-car.x)<Math.abs(b-car.x)?r:b,VROADS[0]); car.x=road+(a.dir>0?2.6:-2.6); car.heading=a.dir>0?0:Math.PI; }
      else { const road=HROADS.reduce((b,r)=>Math.abs(r-car.z)<Math.abs(b-car.z)?r:b,HROADS[0]); car.z=road+(a.dir>0?-2.6:2.6); car.heading=a.dir>0?Math.PI/2:-Math.PI/2; }
      continue;
    }
    const want=Math.atan2(dx,dz);
    let diff=((want-car.heading+Math.PI*3)%(Math.PI*2))-Math.PI;
    car.heading+=clamp(diff,-1.6*dt,1.6*dt);
    // Slow for the player if close ahead.
    let sp=a.speed;
    const px=G.currentCar?G.currentCar.x:G.player?.x, pz=G.currentCar?G.currentCar.z:G.player?.z;
    if(px!==undefined && Math.hypot(px-car.x,pz-car.z)<9) sp=4;
    car.speed+=(sp-car.speed)*Math.min(1,dt*2);
    car.x+=Math.sin(car.heading)*car.speed*dt;
    car.z+=Math.cos(car.heading)*car.speed*dt;
    syncCarMesh(car);
  }
}
