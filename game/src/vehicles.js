// Car factory and arcade driving physics shared by player, traffic, police.
import { G, clamp, angleLerp } from './config.js';
import { collide } from './city.js';
const T=()=>window.THREE;
export const CAR_TYPES=[
  {name:'sedan', len:4.4, wid:1.9, h:0.62, cabH:0.55, top:34, accel:15, colors:[0xc23b2e,0x3a6ea8,0xd9d9d9,0x2e2e34,0xe0a32e]},
  {name:'hatch', len:3.8, wid:1.8, h:0.66, cabH:0.6, top:30, accel:14, colors:[0x58a05c,0xe07b39,0x7fb3d5,0xf2e3c6]},
  {name:'truck', len:5.4, wid:2.1, h:0.9, cabH:0.8, top:27, accel:11, colors:[0x8a8f98,0x5d6d7e,0xa85732]},
  {name:'sports', len:4.2, wid:1.9, h:0.45, cabH:0.4, top:44, accel:21, colors:[0xffc21c,0xd81b60,0x12b5a5]},
  {name:'police', len:4.5, wid:1.95, h:0.62, cabH:0.55, top:40, accel:19, colors:[0x18222e]},
];
export function makeCarMesh(typeIdx, color){
  const THREE=T(); const t=CAR_TYPES[typeIdx];
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(t.wid,t.h,t.len), new THREE.MeshLambertMaterial({color}));
  body.position.y=0.55; g.add(body);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(t.wid*0.82,t.cabH,t.len*0.42), new THREE.MeshLambertMaterial({color: typeIdx===4?0xf2f2f2:0x223243}));
  cab.position.set(0,0.55+t.h/2+t.cabH/2-0.08,-0.15); g.add(cab);
  if(typeIdx===4){
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(t.wid+0.04,0.22,t.len*0.7), new THREE.MeshBasicMaterial({color:0x2e6fd8}));
    stripe.position.y=0.62; g.add(stripe);
    const bar=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.16,0.4), new THREE.MeshBasicMaterial({color:0xff3040}));
    bar.position.set(0,1.32,-0.15); bar.name='lightbar'; g.add(bar);
  }
  const wg=new THREE.CylinderGeometry(0.36,0.36,0.25,10), wm=new THREE.MeshLambertMaterial({color:0x14161a});
  const wheelPos=[[-t.wid/2, -t.len/2+0.8],[t.wid/2,-t.len/2+0.8],[-t.wid/2,t.len/2-0.8],[t.wid/2,t.len/2-0.8]];
  const wheels=[];
  for(const [wx,wz] of wheelPos){ const w=new THREE.Mesh(wg,wm); w.rotation.z=Math.PI/2; w.position.set(wx,0.36,wz); g.add(w); wheels.push(w); }
  // Blob shadow for the golden-hour long-shadow feel, cheap and stable.
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(t.wid+1.6,t.len+1.8), new THREE.MeshBasicMaterial({color:0x2a1a08, transparent:true, opacity:0.28}));
  sh.rotation.x=-Math.PI/2; sh.position.set(0.7,0.03,0.5); g.add(sh);
  const hl=new THREE.Mesh(new THREE.BoxGeometry(t.wid*0.8,0.14,0.08), new THREE.MeshBasicMaterial({color:0xffe9a8}));
  hl.position.set(0,0.62,t.len/2+0.02); g.add(hl);
  g.userData.wheels=wheels; g.userData.lightbar=g.children.find(c=>c.name==='lightbar');
  return g;
}
export function spawnCar(x,z,heading,typeIdx,color,parked=false){
  const t=CAR_TYPES[typeIdx];
  const mesh=makeCarMesh(typeIdx, color ?? t.colors[Math.floor(G.rng()*t.colors.length)]);
  mesh.position.set(x,0,z); mesh.rotation.y=heading; G.scene.add(mesh);
  const car={x,z,heading,speed:0,type:typeIdx,mesh,parked,driver:null,health:100,steer:0,wheelSpin:0};
  G.cars.push(car); return car;
}
export function syncCarMesh(car){
  car.mesh.position.set(car.x,0,car.z);
  car.mesh.rotation.y=car.heading;
  car.wheelSpin+=car.speed*0.06;
  for(const w of car.mesh.userData.wheels) w.rotation.x=car.wheelSpin;
  const lb=car.mesh.userData.lightbar;
  if(lb) lb.material.color.setHex(Math.sin(G.time*10)>0?0xff3040:0x3060ff);
}
// Arcade step: input = {throttle -1..1, steer -1..1, brake bool}
export function driveCar(car, input, dt){
  const t=CAR_TYPES[car.type];
  if(input.brake && Math.abs(car.speed)>1){ car.speed-=Math.sign(car.speed)*26*dt; }
  else if(input.throttle!==0){
    car.speed+=input.throttle*t.accel*dt*(car.speed*input.throttle<0?1.8:1);
  } else {
    car.speed-=car.speed*0.55*dt; if(Math.abs(car.speed)<0.05)car.speed=0;
  }
  car.speed=clamp(car.speed,-t.top*0.42,t.top);
  const steerTarget=input.steer*0.55*(Math.abs(car.speed)>0.5?1:0);
  car.steer+=(steerTarget-car.steer)*Math.min(1,dt*8);
  if(Math.abs(car.speed)>0.2){
    const turn=car.steer*(car.speed>0?1:-1)*clamp(Math.abs(car.speed)/9,0.25,1.35);
    car.heading+=turn*dt*1.15;
  }
  const nx=car.x+Math.sin(car.heading)*car.speed*dt;
  const nz=car.z+Math.cos(car.heading)*car.speed*dt;
  const c=collide(nx,nz,1.35);
  if(Math.abs(c.x-nx)>0.01||Math.abs(c.z-nz)>0.01){ if(Math.abs(car.speed)>9){ car.speed*=-0.25; return 'hit'; } car.speed*=0.6; }
  car.x=c.x; car.z=c.z;
  syncCarMesh(car);
  return null;
}
export function carAt(x,z,maxD){
  let best=null,bd=maxD;
  for(const c of G.cars){ const d=Math.hypot(c.x-x,c.z-z); if(d<bd){bd=d;best=c;} }
  return best;
}
