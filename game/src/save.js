// localStorage persistence for cash, story progress, conches and records.
import { G } from './config.js';
const KEY='solano-heat-v2';
export function saveGame(){
  try{
    const p=G.player;
    localStorage.setItem(KEY, JSON.stringify({
      cash:G.cash, missionIndex:G.missionIndex, storyDone:G.storyDone, hasPistol:G.hasPistol,
      conches:[...G.conchFound], raceBest:G.race.best, taxiEarnings:G.stats.taxiEarnings, taxiCount:G.stats.taxiCount,
      x:p?p.x:6, z:p?p.z:6,
    }));
  }catch(e){}
}
export function loadGame(){
  try{ const s=localStorage.getItem(KEY); return s?JSON.parse(s):null; }catch(e){ return null; }
}
export function applySave(s){
  if(!s) return false;
  G.cash=s.cash??G.cash; G.missionIndex=s.missionIndex??0; G.storyDone=!!s.storyDone; G.hasPistol=!!s.hasPistol;
  if(G.hasPistol) G.weapon='pistol';
  G.conchFound=new Set(s.conches||[]); G.race.best=s.raceBest||0;
  G.stats.taxiEarnings=s.taxiEarnings||0; G.stats.taxiCount=s.taxiCount||0;
  if(G.player && typeof s.x==='number'){ G.player.x=s.x; G.player.z=s.z; }
  return true;
}
export function hasSave(){ return !!loadGame(); }
