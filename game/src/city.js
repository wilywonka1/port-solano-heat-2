// Port Solano: grid city, golden-hour sky, districts, marina, beach, props.
// Static repeated props use InstancedMesh; buildings are individual boxes
// with a handful of shared canvas facade textures to keep draw calls sane.
import { G, VROADS, HROADS, ROAD_W, SHOPS, CONCH_SPOTS, clamp } from './config.js';
const T = () => window.THREE;
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new (T().CanvasTexture)(c); t.colorSpace=T().SRGBColorSpace; return t; }
function facadeTex(base, win, floors, cols, shop){
  return canvasTex(128,256,(g,w,h)=>{
    g.fillStyle=base; g.fillRect(0,0,w,h);
    g.fillStyle='rgba(0,0,0,0.12)'; for(let i=0;i<40;i++) g.fillRect(G.rng()*w, G.rng()*h, 3,3);
    const fh=h/floors;
    for(let f=0;f<floors;f++) for(let cix=0;cix<cols;cix++){
      const lit=G.rng()>0.45; g.fillStyle=lit?win:'#2b3440';
      if(shop && f===floors-1) continue;
      g.fillRect(8+cix*(w-16)/cols, 6+f*fh, (w-16)/cols-8, fh-12);
    }
    if(shop){ g.fillStyle='#1d2733'; g.fillRect(0,h-fh,w,fh); g.fillStyle='#ffb35c'; g.fillRect(6,h-fh+6,w-12,fh-20); }
  });
}
function signTex(text, bg){
  return canvasTex(256,48,(g,w,h)=>{ g.fillStyle=bg; g.fillRect(0,0,w,h); g.fillStyle='#fff8ea'; g.font='bold 26px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,w/2,h/2); });
}
export let missionBeacon=null, raceBeacon=null, taxiBeacon=null;
export function buildCity(scene){
  const THREE=T();
  // --- Golden hour sky: big sphere with a canvas gradient ---
  const skyTex=canvasTex(64,512,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,'#3d6396'); gr.addColorStop(0.35,'#9dc0de'); gr.addColorStop(0.62,'#fcc983');
    gr.addColorStop(0.78,'#ffa671'); gr.addColorStop(1,'#ffe9bc');
    g.fillStyle=gr; g.fillRect(0,0,w,h);
  });
  const sky=new THREE.Mesh(new THREE.SphereGeometry(900,16,12), new THREE.MeshBasicMaterial({map:skyTex, side:THREE.BackSide, fog:false}));
  scene.add(sky);
  scene.fog=new THREE.Fog(0xf8c07e, 190, 780);
  const sunBall=new THREE.Mesh(new THREE.SphereGeometry(28,12,12), new THREE.MeshBasicMaterial({color:0xffe9b0, fog:false}));
  sunBall.position.set(-420,95,520); scene.add(sunBall);
  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x4a5d74, 1.30));
  const sun=new THREE.DirectionalLight(0xffc07d, 2.18); sun.position.set(-160,120,220); scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffe8c4,0.35));
  // --- Ground base (grass / city slab) ---
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(560,560), new THREE.MeshLambertMaterial({color:0x8a9a6a}));
  ground.rotation.x=-Math.PI/2; ground.position.set(0,-0.05,0); scene.add(ground);
  // Sea
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(900,260), new THREE.MeshLambertMaterial({color:0x2e7fa8}));
  sea.rotation.x=-Math.PI/2; sea.position.set(0,-0.02,196+110); scene.add(sea);
  const seaShine=new THREE.Mesh(new THREE.PlaneGeometry(900,10), new THREE.MeshBasicMaterial({color:0xffc98a}));
  seaShine.rotation.x=-Math.PI/2; seaShine.position.set(0,0.01,200); scene.add(seaShine);
  // Beach sand
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(560,36), new THREE.MeshLambertMaterial({color:0xf0d49a}));
  sand.rotation.x=-Math.PI/2; sand.position.set(0,0.0,182); scene.add(sand);
  // --- Roads ---
  const roadMat=new THREE.MeshLambertMaterial({color:0x33373d});
  const lineMat=new THREE.MeshBasicMaterial({color:0xf7e6a2});
  const walkMat=new THREE.MeshLambertMaterial({color:0xb9b0a0});
  for(const x of VROADS){
    const r=new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W,456), roadMat); r.rotation.x=-Math.PI/2; r.position.set(x,0.02,0); scene.add(r);
    const s1=new THREE.Mesh(new THREE.PlaneGeometry(2.4,456), walkMat); s1.rotation.x=-Math.PI/2; s1.position.set(x-ROAD_W/2-1.2,0.015,0); scene.add(s1);
    const s2=s1.clone(); s2.position.x=x+ROAD_W/2+1.2; scene.add(s2);
    for(let z=-220; z<220; z+=16){ const d=new THREE.Mesh(new THREE.PlaneGeometry(0.5,7), lineMat); d.rotation.x=-Math.PI/2; d.position.set(x,0.035,z); scene.add(d); }
  }
  for(const z of HROADS){
    const r=new THREE.Mesh(new THREE.PlaneGeometry(456,ROAD_W), roadMat); r.rotation.x=-Math.PI/2; r.position.set(0,0.025,z); scene.add(r);
    const s1=new THREE.Mesh(new THREE.PlaneGeometry(456,2.4), walkMat); s1.rotation.x=-Math.PI/2; s1.position.set(0,0.018,z-ROAD_W/2-1.2); scene.add(s1);
    const s2=s1.clone(); s2.position.z=z+ROAD_W/2+1.2; scene.add(s2);
    for(let x=-220; x<220; x+=16){ const d=new THREE.Mesh(new THREE.PlaneGeometry(7,0.5), lineMat); d.rotation.x=-Math.PI/2; d.position.set(x,0.04,z); scene.add(d); }
  }
  // Crosswalks at spawn intersection
  const cwMat=new THREE.MeshBasicMaterial({color:0xffffff});
  for(let i=-2;i<=2;i++){ const s=new THREE.Mesh(new THREE.PlaneGeometry(8,1.1), cwMat); s.rotation.x=-Math.PI/2; s.position.set(i*0+ -3+i*1.6, 0.05, 9); s.rotation.z=0; scene.add(s); const s2=new THREE.Mesh(new THREE.PlaneGeometry(1.1,8), cwMat); s2.rotation.x=-Math.PI/2; s2.position.set(9,0.05,i*1.6-3); scene.add(s2); }
  // --- Buildings per block ---
  const facades=[
    facadeTex('#a5836d','#ffd68c',10,4,false), facadeTex('#8395a8','#ffdc9c',14,5,false),
    facadeTex('#bc967b','#ffcd7c',8,4,false), facadeTex('#8f7fa3','#ffdb9f',12,4,false),
    facadeTex('#dbc49e','#ffcb72',3,3,false), facadeTex('#b3c6d2','#ffeab2',5,4,true),
    facadeTex('#c7936e','#ffd48a',6,4,true), facadeTex('#9dab83','#fff0ba',2,3,false),
  ];
  const shopByBlock={};
  for(const s of SHOPS) shopByBlock[s.name]=s;
  let shopIdx=0;
  const shopList=[...SHOPS];
  for(let bi=0; bi<VROADS.length-1; bi++) for(let bj=0; bj<HROADS.length-1; bj++){
    const cx=(VROADS[bi]+VROADS[bi+1])/2, cz=(HROADS[bj]+HROADS[bj+1])/2;
    if(cz>=150) continue; // beachfront row stays open
    const downtown=Math.abs(cx)<=80 && cz>=-120 && cz<=40;
    const suburb=cz<=-140;
    const bw=24, bd=24;
    const h= downtown? 34+G.rng()*46 : suburb? 7+G.rng()*4 : 13+G.rng()*18;
    // Some blocks get two smaller buildings instead of one slab.
    const split=!downtown && G.rng()>0.6;
    const mk=(ox,oz,w,d,hh)=>{
      const fi= suburb? (G.rng()>0.5?4:7) : downtown? Math.floor(G.rng()*4) : (shopIdx<shopList.length && Math.abs(ox-shopList[shopIdx].x)<20 && Math.abs(oz-shopList[shopIdx].z)<26 ? 5+Math.floor(G.rng()*2) : 4+Math.floor(G.rng()*4));
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d), new THREE.MeshLambertMaterial({map:facades[fi]}));
      m.position.set(ox,hh/2,oz); scene.add(m);
      const roof=new THREE.Mesh(new THREE.BoxGeometry(w+0.6,0.7,d+0.6), new THREE.MeshLambertMaterial({color:0x4a4038}));
      roof.position.set(ox,hh+0.3,oz); scene.add(roof);
      G.colliders.push({minX:ox-w/2,maxX:ox+w/2,minZ:oz-d/2,maxZ:oz+d/2});
      return m;
    };
    if(split){ mk(cx-7,cz-7,11,11,h*0.5); mk(cx+7,cz+7,11,11,h*0.6); }
    else mk(cx,cz,bw,bd,h);
  }
  // Shopfront signs + awnings (readable names, original businesses)
  const awnCols=[0xc94f38,0x2e7d6b,0xd9913c,0x46689e,0x8e4a72];
  // Sign faces sit exactly on the south (or, for Palmera, north) face of the
  // block building each shop belongs to, so the names read from the road.
  const SIGN_FACE = [
    {x:20, z:-7.7, ry:0}, {x:180, z:112.3, ry:0}, {x:-60, z:7.7, ry:Math.PI},
    {x:-140, z:-47.7, ry:0}, {x:60, z:152.3, ry:0},
  ];
  SHOPS.forEach((s,i)=>{
    const tex=signTex(s.name, ['#8c3b2a','#274d5e','#7a4a16','#31572c','#20586e'][i%5]);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(13,2.4), new THREE.MeshBasicMaterial({map:tex}));
    const f=SIGN_FACE[i];
    // A dedicated low shop building behind each sign guarantees the frontage.
    const backZ = f.z + (f.ry===0 ? -5.2 : 5.2);
    const shopBox=new THREE.Mesh(new THREE.BoxGeometry(15,7.5,10), new THREE.MeshLambertMaterial({map:facades[5+(i%2)]}));
    shopBox.position.set(f.x,3.75,backZ); scene.add(shopBox);
    G.colliders.push({minX:f.x-7.5,maxX:f.x+7.5,minZ:backZ-5,maxZ:backZ+5});
    sign.position.set(f.x,4.2,f.z); sign.rotation.y=f.ry;
    scene.add(sign);
    const awn=new THREE.Mesh(new THREE.BoxGeometry(13,0.3,3), new THREE.MeshLambertMaterial({color:awnCols[i%5]}));
    awn.position.set(f.x,3.2,f.z+(f.ry===0?1.4:-1.4)); scene.add(awn);
    s.signPos={x:f.x,z:f.z};
  });
  // --- Marina: docks + varied boats (east, into the sea) ---
  const dockMat=new THREE.MeshLambertMaterial({color:0x7a6248});
  for(let i=0;i<4;i++){
    const dock=new THREE.Mesh(new THREE.BoxGeometry(6,0.8,54), dockMat); dock.position.set(196+i*14,0.4,214); scene.add(dock);
    G.colliders.push({minX:193+i*14,maxX:199+i*14,minZ:190,maxZ:236});
  }
  const boatCols=[0xffffff,0xe4572e,0x2e86ab,0xf2c14e,0x76b041];
  for(let i=0;i<9;i++){
    const bx=188+(i%4)*15+G.rng()*4, bz=202+Math.floor(i/4)*22+G.rng()*6;
    const boat=new THREE.Group();
    const hull=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.1,8), new THREE.MeshLambertMaterial({color:boatCols[i%5]})); hull.position.y=0.5; boat.add(hull);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.2,2.6), new THREE.MeshLambertMaterial({color:0xf5f0e6})); cab.position.set(0,1.5,-0.6); boat.add(cab);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,6), new THREE.MeshLambertMaterial({color:0xdddddd})); mast.position.set(0,3.4,1.4); boat.add(mast);
    boat.position.set(bx,0.15,bz); boat.rotation.y=(G.rng()-0.5)*0.3; scene.add(boat);
  }
  // --- Beach props: umbrellas, towels, loungers (instanced where repeated) ---
  const umbGeo=new THREE.ConeGeometry(1.7,0.7,8);
  const umbMats=[0xe4572e,0x2e86ab,0xf2c14e,0xef6f9c].map(c=>new THREE.MeshLambertMaterial({color:c}));
  for(let i=0;i<26;i++){
    const ux=-210+i*16+G.rng()*6, uz=172+G.rng()*14;
    const u=new THREE.Mesh(umbGeo, umbMats[i%4]); u.position.set(ux,1.7,uz); scene.add(u);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.8), new THREE.MeshLambertMaterial({color:0xeeeeee})); pole.position.set(ux,0.9,uz); scene.add(pole);
    const towel=new THREE.Mesh(new THREE.PlaneGeometry(1.1,2.1), new THREE.MeshLambertMaterial({color:boatCols[i%5]})); towel.rotation.x=-Math.PI/2; towel.rotation.z=G.rng()*3; towel.position.set(ux+1.4,0.04,uz+0.6); scene.add(towel);
  }
  // --- Trees, streetlights, benches, hydrants, bus stops, billboards ---
  const trunkG=new THREE.CylinderGeometry(0.22,0.3,2.2,6), trunkM=new THREE.MeshLambertMaterial({color:0x6b4a2f});
  const palmTopG=new THREE.ConeGeometry(2.6,1.6,7), broadTopG=new THREE.SphereGeometry(2.2,8,7);
  const palmM=new THREE.MeshLambertMaterial({color:0x3f8f4f}), broadM=new THREE.MeshLambertMaterial({color:0x5da24a});
  const treePos=[];
  for(const x of VROADS) for(let z=-215; z<215; z+=40){ if(Math.abs(z%80)<1) continue; for(const [tx,tz] of [[x+9.5,z+13],[x-9.5,z+27]]){ if(HROADS.some(r=>Math.abs(r-tz)<10)) continue; if(VROADS.some(r=>Math.abs(r-tx)<9)) continue; treePos.push([tx,tz]); } }
  const trunks=new THREE.InstancedMesh(trunkG,trunkM,treePos.length);
  const tops=new THREE.InstancedMesh(palmTopG,palmM,treePos.length);
  const tops2=new THREE.InstancedMesh(broadTopG,broadM,treePos.length);
  const dummy=new THREE.Object3D(); let ti=0, tj=0;
  treePos.forEach(([x,z],i)=>{
    dummy.rotation.set(0,0,0);
    dummy.position.set(x,1.1,z); dummy.updateMatrix(); trunks.setMatrixAt(i,dummy.matrix);
    const beachSide=z>130;
    if(beachSide||i%2===0){ dummy.position.set(x,3.4,z); dummy.updateMatrix(); tops.setMatrixAt(ti++,dummy.matrix); tops2.setMatrixAt(tj, new THREE.Matrix4().makeScale(0.001,0.001,0.001)); tj++; }
    else { dummy.position.set(x,3.6,z); dummy.updateMatrix(); tops2.setMatrixAt(tj++,dummy.matrix); tops.setMatrixAt(ti, new THREE.Matrix4().makeScale(0.001,0.001,0.001)); ti++; }
  });
  trunks.count=treePos.length; tops.count=ti; tops2.count=tj;
  scene.add(trunks); scene.add(tops); scene.add(tops2);
  // Streetlights along every road
  const poleG=new THREE.CylinderGeometry(0.09,0.09,5.4,5), poleM=new THREE.MeshLambertMaterial({color:0x3c4148});
  const lampG=new THREE.SphereGeometry(0.32,6,6), lampM=new THREE.MeshBasicMaterial({color:0xffd98a});
  const lightPos=[];
  for(const x of VROADS) for(let z=-200;z<=200;z+=40) lightPos.push([x+8,z+20]);
  for(const z of HROADS) for(let x=-200;x<=200;x+=40) lightPos.push([x+20,z+8]);
  const poles=new THREE.InstancedMesh(poleG,poleM,lightPos.length), lamps=new THREE.InstancedMesh(lampG,lampM,lightPos.length);
  lightPos.forEach(([x,z],i)=>{ dummy.rotation.set(0,0,0); dummy.position.set(x,2.7,z); dummy.updateMatrix(); poles.setMatrixAt(i,dummy.matrix); dummy.position.set(x,5.5,z); dummy.updateMatrix(); lamps.setMatrixAt(i,dummy.matrix); });
  scene.add(poles); scene.add(lamps);
  // Benches, hydrants, bus stops, billboards
  const benchM=new THREE.MeshLambertMaterial({color:0x7a5230});
  for(let i=0;i<16;i++){ const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.5,0.7), benchM); const x=VROADS[i%VROADS.length]+9, z=-200+Math.floor(i/VROADS.length)*80+ (i*13)%40; b.position.set(x,0.4,z); scene.add(b); }
  const hydM=new THREE.MeshLambertMaterial({color:0xd23b2e});
  for(let i=0;i<14;i++){ const hd=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.8,6), hydM); hd.position.set(VROADS[(i*3)%VROADS.length]-9,0.4,-210+i*30); scene.add(hd); }
  for(let i=0;i<6;i++){
    const stop=new THREE.Group(); const roof=new THREE.Mesh(new THREE.BoxGeometry(4,0.2,1.6), new THREE.MeshLambertMaterial({color:0x31572c})); roof.position.y=2.4; stop.add(roof);
    const back=new THREE.Mesh(new THREE.BoxGeometry(4,2.2,0.15), new THREE.MeshLambertMaterial({color:0x9fc4d8})); back.position.set(0,1.1,-0.7); stop.add(back);
    stop.position.set(VROADS[i*2]-9,0,HROADS[i%HROADS.length]+18); scene.add(stop);
  }
  const bbTexts=['VISIT PORT SOLANO','SOLANO SURF CO.','GOLDEN HOUR DINER','MARINA MOTORS'];
  bbTexts.forEach((txt,i)=>{
    const tex=signTex(txt,'#20304a');
    const bb=new THREE.Mesh(new THREE.PlaneGeometry(16,3), new THREE.MeshBasicMaterial({map:tex, side:THREE.DoubleSide}));
    bb.position.set(-160+i*100, 17, -108); bb.rotation.y=0; scene.add(bb);
    const post=new THREE.Mesh(new THREE.BoxGeometry(0.5,17,0.5), poleM); post.position.set(-160+i*100,8.5,-108.4); scene.add(post);
  });
  // Distant skyline silhouette ring
  const silMat=new THREE.MeshBasicMaterial({color:0x5a4a63});
  for(let i=0;i<36;i++){
    const a=i/36*Math.PI*2, r=390+G.rng()*60, hh=30+G.rng()*70;
    const b=new THREE.Mesh(new THREE.BoxGeometry(26,hh,26), silMat);
    b.position.set(Math.cos(a)*r, hh/2-2, Math.sin(a)*r); scene.add(b);
  }
  // --- Golden conches ---
  const conchMat=new THREE.MeshLambertMaterial({color:0xffd94a, emissive:0x8a6d00});
  CONCH_SPOTS.forEach(([x,z],i)=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.55,8,7), conchMat);
    m.position.set(x,0.8,z); m.scale.y=0.75; scene.add(m);
    G.conches.push({x,z,mesh:m,found:G.conchFound.has(i), idx:i});
    if(G.conchFound.has(i)) m.visible=false;
  });
  // --- Mission / race / taxi beacons (tall glowing pillars) ---
  function beacon(color){
    const geo=new THREE.CylinderGeometry(1.6,1.6,42,10,1,true);
    const mat=new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.35, side:THREE.DoubleSide, depthWrite:false});
    const mesh=new THREE.Mesh(geo,mat); mesh.position.y=21; mesh.visible=false; scene.add(mesh); return mesh;
  }
  missionBeacon=beacon(0xffd23e); raceBeacon=beacon(0xff7b1c); taxiBeacon=beacon(0x3ee06f);
  return { missionBeacon, raceBeacon, taxiBeacon };
}
export function collide(x,z,r){
  // Returns corrected position outside building AABBs and inside world bounds.
  let nx=clamp(x,-226,250), nz=clamp(z,-226,232);
  if(nz>190 && !(nx>182)) nz=190; // sea wall except marina docks area handled loosely
  for(const c of G.colliders){
    if(nx>c.minX-r && nx<c.maxX+r && nz>c.minZ-r && nz<c.maxZ+r){
      const dxl=nx-(c.minX-r), dxr=(c.maxX+r)-nx, dzl=nz-(c.minZ-r), dzr=(c.maxZ+r)-nz;
      const m=Math.min(dxl,dxr,dzl,dzr);
      if(m===dxl) nx=c.minX-r; else if(m===dxr) nx=c.maxX+r; else if(m===dzl) nz=c.minZ-r; else nz=c.maxZ+r;
    }
  }
  return {x:nx,z:nz};
}
export function updateCity(dt){
  for(const c of G.conches){ if(!c.found){ c.mesh.rotation.y+=dt*2; c.mesh.position.y=0.8+Math.sin(G.time*3+c.idx)*0.15; } }
  const pulse=0.3+Math.sin(G.time*4)*0.08;
  if(missionBeacon) missionBeacon.material.opacity=pulse;
  if(raceBeacon) raceBeacon.material.opacity=pulse;
}
export function setBeacon(which,x,z,visible){
  const b= which==='mission'?missionBeacon: which==='race'?raceBeacon: taxiBeacon;
  if(!b) return; b.visible=visible; if(visible){ b.position.x=x; b.position.z=z; }
}
