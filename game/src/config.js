// Port Solano shared configuration and the one mutable game state object.
// Every other module imports G from here so there is no circular wiring.
export const VROADS = [-200,-160,-120,-80,-40,0,40,80,120,160,200];
export const HROADS = [-200,-160,-120,-80,-40,0,40,80,120,160];
export const ROAD_W = 14;
export const WORLD = { minX:-228, maxX:228, minZ:-228, maxZ:230 };
export const BEACH_Z = 178, SEA_Z = 196;
export function clamp(v,a,b){return v<a?a:v>b?b:v;}
export function lerp(a,b,t){return a+(b-a)*t;}
export function dist2d(ax,az,bx,bz){const dx=ax-bx,dz=az-bz;return Math.hypot(dx,dz);}
export function angleLerp(a,b,t){let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return a+d*clamp(t,0,1);}
export function makeRng(seed){let s=seed>>>0||1;return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const SHOPS = [
  {name:"Café Delgado", x:14, z:-26},
  {name:"Marina Motors", x:186, z:106},
  {name:"Palmera Pharmacy", x:-54, z:14},
  {name:"Tito's Garage", x:-134, z:-66},
  {name:"Solano Surf Co.", x:54, z:146},
];
export const CONCH_SPOTS = [[26,150],[-70,168],[150,168],[214,120],[-214,-40],[90,-90],[-20,-214],[130,26],[-170,90],[10,-60]];
export const G = {
  started:false, paused:false, over:false, time:0, seed:1, rng:makeRng(1),
  scene:null, camera:null, renderer:null,
  cash:120, health:100, wanted:0, wantedFloat:0, heatSeen:0, evadeTimer:0, bustedTimer:0,
  weapon:'fist', hasPistol:false, ammo:12, reserve:48, reloading:0,
  colliders:[], player:null, currentCar:null, cars:[], traffic:[], peds:[], policeCars:[], officers:[],
  conches:[], conchFound:new Set(),
  missionIndex:0, missionStage:0, missionTarget:null, missionTimer:0, storyDone:false, missionBags:0,
  dialogue:null, dialogueTimer:0, fanfare:null,
  race:{active:false, idx:0, t:0, best:0, checkpoints:[], countdown:0},
  taxi:{passenger:null, dest:null, t:0},
  stats:{taxiEarnings:0, taxiCount:0},
  crimeCooldown:0, shotMode:null, keys:{}, yaw:0, pitch:-0.16, speedKmh:0,
  raiseWanted(n){ this.wantedFloat=clamp(this.wantedFloat+n,0,5); this.wanted=Math.floor(this.wantedFloat+0.0001); if(n>0)this.heatSeen=4; },
  setWanted(n){ this.wantedFloat=n; this.wanted=n; },
};
export function nearestRoadX(x){let b=VROADS[0];for(const r of VROADS)if(Math.abs(r-x)<Math.abs(b-x))b=r;return b;}
export function nearestRoadZ(z){let b=HROADS[0];for(const r of HROADS)if(Math.abs(r-z)<Math.abs(b-z))b=r;return b;}
export function onRoad(x,z){return VROADS.some(r=>Math.abs(r-x)<ROAD_W/2+1)||HROADS.some(r=>Math.abs(r-z)<ROAD_W/2+1);}
