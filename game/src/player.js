// Juno Vale on foot: WASD + mouse-look, sprint, simple animated humanoid.
import { G, clamp, dist2d } from './config.js';
import { collide } from './city.js';
const T=()=>window.THREE;
export function makeHumanoid(shirt=0xe4572e, pants=0x2b3a55, skin=0xd9a066){
  const THREE=T(); const g=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.78,0.34), new THREE.MeshLambertMaterial({color:shirt})); torso.position.y=1.05; g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.21,10,8), new THREE.MeshLambertMaterial({color:skin})); head.position.y=1.68; g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(0.22,10,6), new THREE.MeshLambertMaterial({color:0x2a1c10})); hair.position.y=1.76; hair.scale.y=0.6; g.add(hair);
  const legL=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.68,0.22), new THREE.MeshLambertMaterial({color:pants})); legL.position.set(-0.16,0.34,0); g.add(legL);
  const legR=legL.clone(); legR.position.x=0.16; g.add(legR);
  const armL=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.62,0.18), new THREE.MeshLambertMaterial({color:shirt})); armL.position.set(-0.42,1.05,0); g.add(armL);
  const armR=armL.clone(); armR.position.x=0.42; g.add(armR);
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1), new THREE.MeshBasicMaterial({color:0x2a1a08,transparent:true,opacity:0.25}));
  sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);
  g.userData={legL,legR,armL,armR,torso};
  return g;
}
export function createPlayer(scene){
  const mesh=makeHumanoid(0xff7847,0x24344d);
  scene.add(mesh);
  const p={x:6,z:14,heading:Math.PI,mesh,walkPhase:0,speedNow:0,health:100};
  G.player=p; return p;
}
export function updatePlayer(dt){
  const p=G.player; if(!p||G.currentCar) { if(p) p.mesh.visible=!G.currentCar; return; }
  p.mesh.visible=true;
  let mx=0,mz=0;
  const fwd={x:Math.sin(G.yaw), z:Math.cos(G.yaw)};
  const right={x:Math.cos(G.yaw), z:-Math.sin(G.yaw)};
  if(G.keys['KeyW']){mx+=fwd.x;mz+=fwd.z;}
  if(G.keys['KeyS']){mx-=fwd.x;mz-=fwd.z;}
  if(G.keys['KeyD']){mx+=right.x;mz+=right.z;}
  if(G.keys['KeyA']){mx-=right.x;mz-=right.z;}
  const len=Math.hypot(mx,mz);
  const sprint=G.keys['ShiftLeft']||G.keys['ShiftRight'];
  const speed=len>0?(sprint?9.2:5.2):0;
  p.speedNow=speed;
  if(len>0){
    mx/=len; mz/=len;
    p.heading=Math.atan2(mx,mz);
    const c=collide(p.x+mx*speed*dt, p.z+mz*speed*dt, 0.55);
    // Sidewalk / reckless checks are for driving; on foot just move.
    p.x=c.x; p.z=c.z;
    p.walkPhase+=dt*(sprint?13:9);
    if(!G.onRoadFlag && G.time%1<0.02){}
  }
  p.mesh.position.set(p.x,0,p.z);
  p.mesh.rotation.y=p.heading;
  const sw=len>0?Math.sin(p.walkPhase)*0.5:0;
  const u=p.mesh.userData;
  u.legL.rotation.x=sw; u.legR.rotation.x=-sw; u.armL.rotation.x=-sw*0.8; u.armR.rotation.x=sw*0.8;
  // Conch pickup on foot or in car handled in main (proximity), here just expose pos.
  G.speedKmh=0;
}
export function updateCamera(dt){
  const cam=G.camera, p=G.player; if(!cam||!p) return;
  let tx,tz,ty,lookY=1.4;
  if(G.currentCar && G.shotMode==='chase'){
    // Shot-hook framing: front three-quarter view so the pursuing cruisers
    // behind the player car are in frame with it.
    const c=G.currentCar;
    const fx=Math.sin(c.heading), fz=Math.cos(c.heading);
    cam.position.x+=((c.x+fx*11+fz*7)-cam.position.x)*Math.min(1,dt*5);
    cam.position.y+=(3.1-cam.position.y)*Math.min(1,dt*5);
    cam.position.z+=((c.z+fz*11-fx*7)-cam.position.z)*Math.min(1,dt*5);
    cam.lookAt(c.x-fx*5, 1.0, c.z-fz*5);
    return;
  }
  if(G.currentCar && G.shotMode==='beach'){
    // Beach shot framing: sit closer (7.2 back) and lower (2.5 up) behind
    // the yellow sports car so the road, umbrellas and marina fill the frame.
    const c=G.currentCar;
    cam.position.x+=((c.x-Math.sin(c.heading)*7.2)-cam.position.x)*Math.min(1,dt*5);
    cam.position.y+=(2.5-cam.position.y)*Math.min(1,dt*5);
    cam.position.z+=((c.z-Math.cos(c.heading)*7.2)-cam.position.z)*Math.min(1,dt*5);
    cam.lookAt(c.x+Math.sin(c.heading)*9, 1.0, c.z+Math.cos(c.heading)*9);
    return;
  }
  if(G.currentCar){
    const c=G.currentCar;
    const back=9.5, h=3.6;
    tx=c.x-Math.sin(c.heading)*back; tz=c.z-Math.cos(c.heading)*back; ty=h;
    // Look-ahead: aim past the car in its travel direction.
    cam.position.x+=(tx-cam.position.x)*Math.min(1,dt*4.2);
    cam.position.y+=(ty-cam.position.y)*Math.min(1,dt*4.2);
    cam.position.z+=(tz-cam.position.z)*Math.min(1,dt*4.2);
    cam.lookAt(c.x+Math.sin(c.heading)*7, 1.1, c.z+Math.cos(c.heading)*7);
  } else {
    const back=6.4;
    const cx=p.x-Math.sin(G.yaw)*back*Math.cos(G.pitch), cz=p.z-Math.cos(G.yaw)*back*Math.cos(G.pitch);
    const cy=2.1+Math.sin(-G.pitch)*back;
    cam.position.x+=(cx-cam.position.x)*Math.min(1,dt*7);
    cam.position.y+=(cy-cam.position.y)*Math.min(1,dt*7);
    cam.position.z+=(cz-cam.position.z)*Math.min(1,dt*7);
    cam.lookAt(p.x+Math.sin(G.yaw)*4, lookY+Math.sin(G.pitch)*2, p.z+Math.cos(G.yaw)*4);
  }
}
export function teleport(x,z){ const p=G.player; if(G.currentCar){ G.currentCar.x=x; G.currentCar.z=z; } if(p){ p.x=x; p.z=z; } if(G.camera){ G.camera.position.set(x-6,3,z-6); } }
