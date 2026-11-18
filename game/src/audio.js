// WebAudio-only sound: every tone is synthesised, nothing is loaded.
import { G } from './config.js';
class AudioSys {
  constructor(){ this.ctx=null; this.master=null; this.engineOsc=null; this.engineGain=null; this.sirenOsc=null; this.sirenGain=null; this.sirenT=0; }
  ensure(){
    if(this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    try{
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.master=this.ctx.createGain(); this.master.gain.value=0.5; this.master.connect(this.ctx.destination);
      // Engine: quiet saw under everything.
      this.engineOsc=this.ctx.createOscillator(); this.engineOsc.type='sawtooth'; this.engineOsc.frequency.value=55;
      const ef=this.ctx.createBiquadFilter(); ef.type='lowpass'; ef.frequency.value=320;
      this.engineGain=this.ctx.createGain(); this.engineGain.gain.value=0.0;
      this.engineOsc.connect(ef); ef.connect(this.engineGain); this.engineGain.connect(this.master); this.engineOsc.start();
      // Siren: louder than the engine, two-tone handled in update.
      this.sirenOsc=this.ctx.createOscillator(); this.sirenOsc.type='triangle'; this.sirenOsc.frequency.value=700;
      this.sirenGain=this.ctx.createGain(); this.sirenGain.gain.value=0.0;
      this.sirenOsc.connect(this.sirenGain); this.sirenGain.connect(this.master); this.sirenOsc.start();
    }catch(e){ this.ctx=null; }
  }
  tone(freq,dur,type='sine',vol=0.2,when=0,slide=0){
    if(!this.ctx) return; const t=this.ctx.currentTime+when;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+dur+0.02);
  }
  noise(dur=0.12,vol=0.25){ if(!this.ctx)return; const n=this.ctx.sampleRate*dur; const buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n); const s=this.ctx.createBufferSource(); s.buffer=buf; const g=this.ctx.createGain(); g.gain.value=vol; s.connect(g); g.connect(this.master); s.start(); }
  shot(){ this.noise(0.09,0.35); this.tone(160,0.08,'square',0.18,0,-100); }
  punch(){ this.noise(0.06,0.2); }
  impact(){ this.noise(0.15,0.3); this.tone(70,0.15,'sine',0.25,0,-30); }
  coin(){ this.tone(880,0.09,'sine',0.18); this.tone(1320,0.14,'sine',0.18,0.07); }
  beep(high=false){ this.tone(high?1180:760, high?0.22:0.1, 'sine', 0.2); }
  sting(){ [392,523,659].forEach((f,i)=>this.tone(f,0.22,'triangle',0.2,i*0.09)); }
  fanfare(){ [523,659,784,1046,784,1046].forEach((f,i)=>this.tone(f,0.26,'triangle',0.22,i*0.11)); }
  update(dt){
    if(!this.ctx) return;
    const driving=!!G.currentCar;
    const targetE = driving ? 0.045 : 0.0;
    this.engineGain.gain.value += (targetE-this.engineGain.gain.value)*Math.min(1,dt*5);
    if(driving) this.engineOsc.frequency.value = 50 + Math.abs(G.speedKmh)*1.6;
    const sirenOn = G.wanted>=1 && G.policeCars.length>0;
    this.sirenGain.gain.value += ((sirenOn?0.07:0)-this.sirenGain.gain.value)*Math.min(1,dt*4);
    if(sirenOn){ this.sirenT+=dt; this.sirenOsc.frequency.value = (Math.sin(this.sirenT*4)>0)? 880:660; }
  }
}
export const Audio = new AudioSys();
