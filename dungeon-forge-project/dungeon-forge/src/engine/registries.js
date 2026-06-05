// §5  REGISTRIES
//     Sprites · Weapons · Entities
// ═══════════════════════════════════════════════════════════════
// Add or replace sprites here. Drawing code calls SpriteRegistry.get(id).
// Each entry: { canvas, scale }
// To upgrade a sprite: change its `canvas` field — nothing else needs touching.
const SpriteRegistry = {
  _sprites: {},

  register(id, canvas, scale) {
    this._sprites[id] = { canvas, scale: scale || PSCALE };
  },

  get(id) {
    return this._sprites[id] || this._sprites['player'];
  },
};

// Goblin Archer sprite (16×16)
const Ac={gn:'#3a7a2a',gd:'#2a5a1a',sk:'#c8e870',ey:'#ff2222',wh:'#ffffff',
  hd:'#7a4a18',hd2:'#5a3410',bw:'#8b5c2a',bws:'#c8a060',ar:'#c0b040',fl:'#8b3a1a'};
const APX=[
[_n,_n,_n,_n,_n,Ac.hd,Ac.hd,Ac.hd,Ac.hd,Ac.hd,_n,_n,_n,_n,_n,_n],
[_n,_n,_n,_n,Ac.hd,Ac.hd2,Ac.hd2,Ac.hd2,Ac.hd2,Ac.hd2,Ac.hd,_n,_n,_n,_n,_n],
[_n,_n,_n,_n,Ac.hd,Ac.sk,Ac.sk,Ac.sk,Ac.sk,Ac.sk,Ac.hd,_n,_n,_n,_n,_n],
[_n,_n,_n,Ac.hd,Ac.sk,Ac.sk,Ac.ey,Ac.sk,Ac.ey,Ac.sk,Ac.sk,Ac.hd,_n,_n,_n,_n],
[_n,_n,_n,Ac.hd,Ac.sk,Ac.sk,Ac.wh,Ac.sk,Ac.wh,Ac.sk,Ac.sk,Ac.hd,_n,_n,_n,_n],
[_n,_n,_n,Ac.hd,Ac.sk,Ac.sk,Ac.sk,Ac.sk,Ac.sk,Ac.sk,Ac.sk,Ac.hd,_n,_n,_n,_n],
[Ac.bws,_n,Ac.gd,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gd,_n,_n,_n,_n],
[Ac.bws,_n,Ac.gd,Ac.gn,Ac.gn,Ac.fl,Ac.fl,Ac.fl,Ac.fl,Ac.gn,Ac.gn,Ac.gd,_n,_n,_n,_n],
[Ac.bw,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.ar,Ac.fl],
[Ac.bws,_n,Ac.gd,Ac.gn,Ac.gn,Ac.fl,Ac.fl,Ac.fl,Ac.fl,Ac.gn,Ac.gn,Ac.gd,_n,_n,_n,_n],
[Ac.bws,_n,Ac.gd,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gn,Ac.gd,_n,_n,_n,_n],
[_n,_n,_n,Ac.gd,Ac.gn,Ac.gn,Ac.gd,Ac.gd,Ac.gd,Ac.gd,Ac.gn,Ac.gn,Ac.gd,_n,_n,_n],
[_n,_n,_n,Ac.gd,Ac.gn,Ac.gn,Ac.gd,_n,_n,Ac.gd,Ac.gn,Ac.gn,Ac.gd,_n,_n,_n],
[_n,_n,_n,Ac.gd,Ac.gd,Ac.gd,Ac.gd,_n,_n,Ac.gd,Ac.gd,Ac.gd,Ac.gd,_n,_n,_n],
[_n,_n,_n,Ac.fl,Ac.fl,Ac.fl,Ac.fl,_n,_n,Ac.fl,Ac.fl,Ac.fl,Ac.fl,_n,_n,_n],
[_n,_n,_n,Ac.fl,Ac.fl,_n,Ac.fl,_n,_n,Ac.fl,Ac.fl,_n,Ac.fl,_n,_n,_n]];
const archerSpr=bsc(APX);

const PSCALE=26, PS=PSCALE/16;

// Register built-in sprites — swap these to change character/enemy art.
// PSCALE must be declared first, so registration happens here.
SpriteRegistry.register('player', playerSpr,  PSCALE);
SpriteRegistry.register('goblin', goblinSpr,  PSCALE);
SpriteRegistry.register('archer', archerSpr,  PSCALE);

// ── Goblin Warrior sprite (16×16) ────────────────────────────────
const Wc={gn:'#2a5a1a',gd:'#1a3a0a',sk:'#a8c860',ey:'#ff0000',
  ar:'#445566',ard:'#223344',be:'#7a4a10',sw:'#888888',swd:'#444444',bl:'#ccddee'};
const WRPX=[
[_n,_n,_n,_n,Wc.ar,Wc.ar,Wc.ar,Wc.ar,Wc.ar,Wc.ar,_n,_n,_n,_n,_n,_n],
[_n,_n,_n,Wc.ar,Wc.ard,Wc.ard,Wc.ard,Wc.ard,Wc.ard,Wc.ard,Wc.ar,_n,_n,_n,_n,_n],
[_n,_n,_n,Wc.ar,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.ar,_n,_n,_n,_n,_n],
[_n,_n,Wc.ar,Wc.sk,Wc.sk,Wc.ey,Wc.sk,Wc.ey,Wc.sk,Wc.sk,Wc.sk,Wc.ar,_n,_n,_n,_n],
[_n,_n,Wc.ar,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.ar,_n,_n,_n,_n],
[_n,_n,Wc.ar,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.sk,Wc.ar,_n,_n,_n,_n],
[_n,Wc.sw,Wc.ar,Wc.ard,Wc.gn,Wc.ar,Wc.ar,Wc.ar,Wc.ar,Wc.ar,Wc.gn,Wc.ard,_n,_n,_n,_n],
[_n,Wc.sw,Wc.ard,Wc.gn,Wc.ar,Wc.ard,Wc.be,Wc.be,Wc.ard,Wc.ar,Wc.gn,Wc.ard,_n,_n,_n,_n],
[Wc.swd,Wc.sw,Wc.sw,Wc.sw,Wc.sw,Wc.sw,Wc.sw,Wc.sw,Wc.sw,Wc.sw,Wc.sw,Wc.bl,Wc.bl,Wc.bl,Wc.bl,_n],
[_n,Wc.sw,Wc.ard,Wc.gn,Wc.ar,Wc.ard,Wc.be,Wc.be,Wc.ard,Wc.ar,Wc.gn,Wc.ard,_n,_n,_n,_n],
[_n,_n,Wc.ar,Wc.ard,Wc.gn,Wc.ar,Wc.ar,Wc.ar,Wc.ar,Wc.ar,Wc.gn,Wc.ard,_n,_n,_n,_n],
[_n,_n,Wc.ar,Wc.gn,Wc.gn,Wc.ard,Wc.ard,Wc.ard,Wc.ard,Wc.gn,Wc.gn,Wc.ar,_n,_n,_n,_n],
[_n,_n,Wc.ard,Wc.gn,Wc.gn,Wc.ard,_n,_n,Wc.ard,Wc.gn,Wc.gn,Wc.ard,_n,_n,_n,_n],
[_n,_n,Wc.ard,Wc.ard,Wc.ard,Wc.ard,_n,_n,Wc.ard,Wc.ard,Wc.ard,Wc.ard,_n,_n,_n,_n],
[_n,_n,Wc.gd,Wc.gd,Wc.gd,Wc.gd,_n,_n,Wc.gd,Wc.gd,Wc.gd,Wc.gd,_n,_n,_n,_n],
[_n,_n,Wc.gd,Wc.gd,_n,Wc.gd,_n,_n,Wc.gd,Wc.gd,_n,Wc.gd,_n,_n,_n,_n]];
const warriorSpr=bsc(WRPX);
SpriteRegistry.register('warrior', warriorSpr, PSCALE);

const SWc={bl:'#e8f0ff',bm:'#aabcdd',bd:'#667799',gd:'#f0c040',gk:'#c09000',gr:'#8b5c2a',grd:'#5c3a18',po:'#d0d0d0'};
const SPX=[[0,0,SWc.bl],[1,-1,SWc.bl],[1,0,SWc.bm],[1,1,SWc.bd],[2,-1,SWc.bl],[2,0,SWc.bm],[2,1,SWc.bd],[3,-1,SWc.bl],[3,0,SWc.bm],[3,1,SWc.bd],[4,-1,SWc.bl],[4,0,SWc.bm],[4,1,SWc.bd],[5,-1,SWc.bl],[5,0,SWc.bm],[5,1,SWc.bd],[6,-1,SWc.bl],[6,0,SWc.bm],[6,1,SWc.bd],[7,-1,SWc.bl],[7,0,SWc.bm],[7,1,SWc.bd],[8,-3,SWc.gd],[8,-2,SWc.gd],[8,-1,SWc.gk],[8,0,SWc.gk],[8,1,SWc.gk],[8,2,SWc.gd],[8,3,SWc.gd],[9,-1,SWc.gr],[9,0,SWc.gr],[9,1,SWc.grd],[10,-1,SWc.gr],[10,0,SWc.gr],[10,1,SWc.grd],[11,-1,SWc.gr],[11,0,SWc.gr],[11,1,SWc.grd],[12,-1,SWc.po],[12,0,SWc.po],[12,1,SWc.po],[13,0,SWc.po]];
const SSCALE = PS*2;
function gDrawSword(px,py,ang,alpha,flip){gctx.save();gctx.globalAlpha=alpha||1;gctx.translate(px,py);gctx.rotate(ang);if(flip)gctx.scale(-1,1);for(const[lx,ly,col]of SPX){gctx.fillStyle=col;gctx.fillRect((lx-9)*SSCALE,ly*SSCALE,SSCALE,SSCALE);}gctx.restore();}

const gWallVar = new Uint8Array(120*80);
for(let i=0;i<gWallVar.length;i++) gWallVar[i]=Math.floor(Math.random()*4);

// A*
const AD=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const AC=[1,1,1,1,1.414,1.414,1.414,1.414];
let gBlocked = new Uint8Array(1);
function gCI(cx,cy){return cy*gMapW+cx;}
function ghp(h,n){h.push(n);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p].f<=h[i].f)break;const t=h[p];h[p]=h[i];h[i]=t;i=p;}}
function gpp(h){const top=h[0];const last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){let s=i;const l=2*i+1,r=2*i+2,n=h.length;if(l<n&&h[l].f<h[s].f)s=l;if(r<n&&h[r].f<h[s].f)s=r;if(s===i)break;const t=h[s];h[s]=h[i];h[i]=t;i=s;}}return top;}
function gRebuildNav(){gBlocked=new Uint8Array(gMapW*gMapH);for(let i=0;i<gMapW*gMapH;i++)gBlocked[i]=gTiles[i]===TILE_WALL?1:0;for(const d of gDestructibles){if(!d.broken)gBlocked[Math.floor(d.wy/T)*gMapW+Math.floor(d.wx/T)]=1;}for(const t of gTraps){gBlocked[t.ty*gMapW+t.tx]=1;}}
function gAstar(sx,sy,gx,gy){
  let scx=Math.max(0,Math.min(gMapW-1,Math.floor(sx/T))),scy=Math.max(0,Math.min(gMapH-1,Math.floor(sy/T)));
  let gcx=Math.max(0,Math.min(gMapW-1,Math.floor(gx/T))),gcy=Math.max(0,Math.min(gMapH-1,Math.floor(gy/T)));
  if(gBlocked[gCI(gcx,gcy)]){let best=null,bd=99;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const nx=gcx+dx,ny=gcy+dy;if(nx<0||ny<0||nx>=gMapW||ny>=gMapH)continue;if(!gBlocked[gCI(nx,ny)]){const d=Math.hypot(dx,dy);if(d<bd){bd=d;best=[nx,ny];}}}if(best){[gcx,gcy]=best;}else return null;}
  const sidx=gCI(scx,scy),gidx=gCI(gcx,gcy);if(sidx===gidx)return[];
  const g=new Float32Array(gMapW*gMapH).fill(1e9),prev=new Int32Array(gMapW*gMapH).fill(-1),vis=new Uint8Array(gMapW*gMapH);
  g[sidx]=0;const open=[];ghp(open,{f:Math.hypot(scx-gcx,scy-gcy),cx:scx,cy:scy});
  while(open.length){const{cx,cy}=gpp(open);const idx=gCI(cx,cy);if(vis[idx])continue;vis[idx]=1;if(idx===gidx){const path=[];let cur=gidx;while(cur!==sidx&&prev[cur]!==-1){const pcx=cur%gMapW,pcy=Math.floor(cur/gMapW);path.push({wx:pcx*T+T/2,wy:pcy*T+T/2});cur=prev[cur];}path.reverse();return gSmooth(sx,sy,path);}const cg=g[idx];for(let d=0;d<8;d++){const nx=cx+AD[d][0],ny=cy+AD[d][1];if(nx<0||ny<0||nx>=gMapW||ny>=gMapH)continue;const nidx=gCI(nx,ny);if(vis[nidx]||gBlocked[nidx])continue;if(d>=4&&(gBlocked[gCI(cx+AD[d][0],cy)]||gBlocked[gCI(cx,cy+AD[d][1])]))continue;const ng=cg+AC[d];if(ng<g[nidx]){g[nidx]=ng;prev[nidx]=idx;ghp(open,{f:ng+Math.hypot(nx-gcx,ny-gcy),cx:nx,cy:ny});}}}return null;
}
function gLos(x0,y0,x1,y1){const steps=Math.ceil(Math.hypot(x1-x0,y1-y0)/T)*2+1;for(let i=1;i<steps;i++){const t=i/steps;const cx=Math.floor((x0+(x1-x0)*t)/T),cy=Math.floor((y0+(y1-y0)*t)/T);if(cx<0||cy<0||cx>=gMapW||cy>=gMapH)continue;if(gBlocked[gCI(cx,cy)])return false;}return true;}
function gSmooth(sx,sy,path){if(!path||!path.length)return path;const out=[];let fx=sx,fy=sy,i=0;while(i<path.length){let last=i;for(let j=i+1;j<path.length;j++){if(gLos(fx,fy,path[j].wx,path[j].wy))last=j;else break;}out.push(path[last]);fx=path[last].wx;fy=path[last].wy;i=last+1;}return out;}
function gRC(wx,wy,r){let x=wx,y=wy;const tR=Math.ceil(r/T)+1,tcx=Math.floor(x/T),tcy=Math.floor(y/T);for(let dy=-tR;dy<=tR;dy++)for(let dx=-tR;dx<=tR;dx++){const tx=tcx+dx,ty=tcy+dy;if(gIsWalk(tx,ty))continue;const bx=tx*T,by=ty*T,nx=Math.max(bx,Math.min(x,bx+T)),ny=Math.max(by,Math.min(y,by+T));const dd=Math.hypot(x-nx,y-ny);if(dd<r&&dd>0.001){const nxx=(x-nx)/dd,nyy=(y-ny)/dd;x+=nxx*(r-dd+.5);y+=nyy*(r-dd+.5);}}return[x,y];}
// Push circle out of unbroken destructibles (circle-circle collision)
function gRCDestructibles(wx,wy,r){
  let x=wx,y=wy;
  for(const d of gDestructibles){
    if(d.broken)continue;
    const dd=Math.hypot(x-d.wx,y-d.wy);
    const minDist=r+d.r;
    if(dd<minDist&&dd>0.001){
      const nx=(x-d.wx)/dd,ny=(y-d.wy)/dd;
      x+=nx*(minDist-dd+0.5);
      y+=ny*(minDist-dd+0.5);
    }
  }
  return[x,y];
}
function gRCTraps(wx,wy,r){
  let x=wx,y=wy;
  for(const t of gTraps){
    const dd=Math.hypot(x-t.wx,y-t.wy);
    const minDist=r+10; // trap radius matches visual stone base (~10px)
    if(dd<minDist&&dd>0.001){
      const nx=(x-t.wx)/dd,ny=(y-t.wy)/dd;
      x+=nx*(minDist-dd+0.5);
      y+=ny*(minDist-dd+0.5);
    }
  }
  return[x,y];
}
function gSep(ax,ay,ar,bx,by,br){const d=Math.hypot(ax-bx,ay-by),m=ar+br+2;if(d<m&&d>0.01){const p=(m-d)/2;return{x:(ax-bx)/d*p,y:(ay-by)/d*p};}return null;}

// Audio
let gAC=null;
function gAudio(){if(!gAC)gAC=new(window.AudioContext||window.webkitAudioContext)();if(gAC.state==='suspended')gAC.resume();return gAC;}
function gpfx(fn){try{fn(gAudio());}catch(e){}}
function gPlayStep(){gpfx(ac=>{const t=ac.currentTime;const b=ac.createBuffer(1,ac.sampleRate*.06,ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3)*.5;const s=ac.createBufferSource();s.buffer=b;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=220+Math.random()*80;const g=ac.createGain();g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+.07);});}
function gPlaySwish(){gpfx(ac=>{const t=ac.currentTime,dur=.18;const b=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(Math.sin(Math.PI*i/d.length),.6);const s=ac.createBufferSource();s.buffer=b;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(2800,t);f.frequency.exponentialRampToValueAtTime(800,t+dur);f.Q.value=1.2;const g=ac.createGain();g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+dur);});}
function gPlayHit(){gpfx(ac=>{const t=ac.currentTime,dur=.14;const b=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.8);const s=ac.createBufferSource();s.buffer=b;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(1200,t);f.frequency.exponentialRampToValueAtTime(300,t+dur);const g=ac.createGain();g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+dur);});}
function gPlayWhirlwind(){gpfx(ac=>{const t=ac.currentTime,dur=.55;const b=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(Math.sin(Math.PI*i/d.length),.5);const s=ac.createBufferSource();s.buffer=b;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(800,t);f.frequency.exponentialRampToValueAtTime(2400,t+dur*.4);f.frequency.exponentialRampToValueAtTime(600,t+dur);f.Q.value=1.5;const g=ac.createGain();g.gain.setValueAtTime(.35,t);g.gain.linearRampToValueAtTime(.55,t+dur*.3);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+dur+.05);});}

function gPlayGrunt(){gpfx(ac=>{
  const t=ac.currentTime;
  // Low thud body hit
  const osc=ac.createOscillator();osc.type='sine';
  osc.frequency.setValueAtTime(140,t);
  osc.frequency.exponentialRampToValueAtTime(60,t+0.08);
  const og=ac.createGain();og.gain.setValueAtTime(0.4,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.12);
  osc.connect(og);og.connect(ac.destination);osc.start(t);osc.stop(t+0.13);
  // Noise burst — breath/grunt texture
  const buf=ac.createBuffer(1,ac.sampleRate*0.1,ac.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
  const src=ac.createBufferSource();src.buffer=buf;
  const filt=ac.createBiquadFilter();filt.type='bandpass';filt.frequency.value=400+Math.random()*200;filt.Q.value=2;
  const ng=ac.createGain();ng.gain.setValueAtTime(0.25,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.1);
  src.connect(filt);filt.connect(ng);ng.connect(ac.destination);src.start(t);src.stop(t+0.11);
});}

function gPlayWoodBreak(){gpfx(ac=>{
  const t=ac.currentTime;
  // Low crack thud
  const dur=.35;
  const b=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,.8)*1.2;
  const src=ac.createBufferSource();src.buffer=b;
  const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(150,t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(.7,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  src.connect(f);f.connect(g);g.connect(ac.destination);src.start(t);src.stop(t+dur+.01);
  // High splinter crack layered on top
  const dur2=.18;
  const b2=ac.createBuffer(1,ac.sampleRate*dur2,ac.sampleRate);
  const d2=b2.getChannelData(0);
  for(let i=0;i<d2.length;i++)d2[i]=(Math.random()*2-1)*Math.pow(1-i/d2.length,2);
  const src2=ac.createBufferSource();src2.buffer=b2;
  const f2=ac.createBiquadFilter();f2.type='bandpass';f2.frequency.value=2200+Math.random()*400;f2.Q.value=1.5;
  const g2=ac.createGain();g2.gain.setValueAtTime(.35,t);g2.gain.exponentialRampToValueAtTime(.001,t+dur2);
  src2.connect(f2);f2.connect(g2);g2.connect(ac.destination);src2.start(t);src2.stop(t+dur2+.01);
});}

function gPlayWoodHit(){gpfx(ac=>{const t=ac.currentTime,dur=.22;const b=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.2)*.7;const s=ac.createBufferSource();s.buffer=b;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=550;const g=ac.createGain();g.gain.setValueAtTime(.45,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+dur+.01);});}

const PATH_INT=50;
// gCharging/gChargeTick are now gPlayer.charging / gPlayer.chargeTick
// These shim functions keep any remaining call sites working:

// ── Weapon registry ─────────────────────────────────────────────
// Each weapon defines its own combat geometry, damage, and feel.
// To add a new weapon: add an entry here and switch gActiveWeapon.
// The combat system reads from WeaponRegistry[gActiveWeapon] at runtime.
const WeaponRegistry = {
  sword: {
    // Swing arc (smear visual)
    smearInner:   8,
    smearOuter:   52,
    swingArc:     2.4,    // radians — width of the attack cone
    swingDur:     24,     // frames the swing animation lasts
    swingCd:      30,     // frames of cooldown after swing
    // Charge attack
    chargeMax:    50,     // frames to reach full charge (~0.83s at 60fps)
    baseDamage:   18,     // uncharged damage
    maxDamage:    36,     // fully charged damage (2× base)
    // Whirlwind dash
    wwRange:      180,    // max dash distance (px)
    wwSpeed:      7,      // dash speed (px/frame)
    wwRadius:     36,     // hit radius during dash
    wwDamage:     22,     // damage per enemy hit
    wwCooldown:   120,    // frames between whirlwinds
  },
  bow: {
    // Normal: 3-arrow spread (30° = 0.524 rad)
    spreadAngle:    0.524,  // full spread angle (radians)
    arrowDamage:    15,     // uncharged / per-arrow damage
    arrowDamageMax: 28,     // full charge single shot
    arrowSpeed:     5.5,
    arrowLife:      110,
    chargeMax:      55,     // frames to reach full charge
    shotCooldown:   22,     // frames between shots
    // Dodge roll
    rollSpeed:      7.5,    // px/frame during roll
    rollDuration:   16,     // frames roll lasts
    rollIFrames:    16,     // invincibility frames
    rollCooldown:   80,     // frames between rolls
  },
  // Future weapons — uncomment and fill to add:
  // dagger: { smearInner:6, smearOuter:32, swingArc:1.6, swingDur:14, swingCd:18,
  //           chargeMax:30, baseDamage:12, maxDamage:20, wwRange:120, wwSpeed:10,
  //           wwRadius:24, wwDamage:14, wwCooldown:80 },
  // greataxe: { smearInner:10, smearOuter:72, swingArc:3.0, swingDur:36, swingCd:48,
  //             chargeMax:80, baseDamage:28, maxDamage:60, wwRange:100, wwSpeed:5,
  //             wwRadius:50, wwDamage:35, wwCooldown:180 },
};

// Active weapon — change this to switch the player's weapon at runtime
let gActiveWeapon = 'sword';
function W(){ return WeaponRegistry[gActiveWeapon] || WeaponRegistry.sword; }

// Preserve old constant names as getters so existing code keeps working
// without a single line change — these will be removed in a future cleanup
// once all call sites use W().property directly.
const SMEAR_INNER    = 0; // overridden by W() calls below — kept for compat
const SMEAR_OUTER    = 0;
const SWING_ARC      = 0;
const SWING_DUR      = 24; // used in easeSwing — keep as fallback
const SWING_CD       = 30;
const CHARGE_MAX     = 50;
const WW_RANGE       = 180;
const WW_SPEED       = 7;
const WW_RADIUS      = 36;
const WW_DMG         = 22;
const WW_CD_FRAMES   = 120;
// wwTargeting/wwActive/wwCooldown are now per-player (gPlayer.wwTargeting etc.)
function easeSwing(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function spawnGP(x,y,col,n,spd){if(!Number.isFinite(x)||!Number.isFinite(y))return;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=spd*(.4+Math.random()*.9);gParticles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:.03+Math.random()*.03,r:1.5+Math.random()*2,col});}}
function addGDmg(x,y,v,col){if(!Number.isFinite(x)||!Number.isFinite(y))return;gDmgNums.push({x,y,val:v,col:col||'#fff',life:1,vy:-1.4,vx:(Math.random()-.5)*1.5});}
function gShake(m,d){gShakeMag=m;gShakeDur=d;}
function pInArc(s,px,py){const dx=px-s.cx,dy=py-s.cy,d=Math.hypot(dx,dy);if(d<s.innerR||d>s.outerR)return false;function ad(a,b){return((a-b)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;}const sw=s.sweepEnd-s.startAngle;if(Math.abs(sw)<.001)return false;return Math.abs(ad(Math.atan2(dy,dx),s.startAngle+sw/2))<=Math.abs(sw)/2+.05;}
// ── Entity registry & factories ─────────────────────────────────
// Define enemy stats here. Factory functions read from EntityDefs.
// To add a new enemy type: add an entry and a makeXxxEnt() factory.
// To rebalance: edit the numbers here — combat code is untouched.
const EntityDefs = {
  goblin: {
    hp:             30,
    radius:         10,
    speedMin:       0.385,
    speedRange:     0.14,
    meleeDamage:    8,
    meleeCooldown:  80,
    activationRange:300,
    retreatRange:   0,    // melee goblins don't retreat
    spriteId:       'goblin',
    label:          'Goblin',
  },
  archer: {
    hp:             22,
    radius:         10,
    speedMin:       0.3,
    speedRange:     0.1,
    arrowDamage:    12,
    arrowSpeed:     4.8,
    arrowRange:     220,
    arrowLife:      90,
    attackCdMin:    110,
    attackCdRange:  40,
    preferredDist:  150,  // preferred combat distance
    retreatDist:    90,   // backs away if player closer than this
    activationRange:300,
    spriteId:       'archer',
    label:          'Goblin Archer',
  },
  warrior: {
    hp:             80,
    radius:         11,
    speedMin:       0.30,   // slightly slower than goblin grunt (0.385)
    speedRange:     0.08,
    swingDamage:    16,
    swingWindup:    30,     // frames (~0.5s at 60fps)
    swingArc:       1.6,    // radians — 2/3 of player swingArc (2.4)
    swingRange:     52,     // px — hit range of swing
    chargeDamage:   24,
    chargeWindup:   48,     // frames (~0.8s at 60fps)
    chargeRange:    6*24,   // 6 tiles in px
    chargeSpeed:    6.5,    // px/frame during charge dash
    chargeDist:     3*24,   // min distance to trigger charge (3 tiles)
    recoverTime:    48,     // frames recovery after charge
    attackCdMin:    90,     // frames between attacks
    attackCdRange:  40,
    activationRange:320,
    spriteId:       'warrior',
    label:          'Goblin Warrior',
  },
  // Future enemy types:
  // troll:  { hp:120, radius:16, speedMin:0.2, speedRange:0.05, meleeDamage:20, ... }
  // shaman: { hp:18, radius:10, arrowDamage:8, ... }
};

// Arrow constants — read directly from EntityDefs.archer
// (no shim aliases: each arrow type will have its own stats when added)

function makeGoblinEnt(tx,ty){
  const d=EntityDefs.goblin;
  return{wx:tx*T+T/2,wy:ty*T+T/2,r:d.radius,vx:0,vy:0,
    hp:d.hp,maxHp:d.hp,angle:0,patrolAngle:Math.random()*Math.PI*2,
    patrolTimer:0,attackCooldown:0,hitFlash:0,dead:false,
    walkTimer:0,walkFrame:0,speed:d.speedMin+Math.random()*d.speedRange,
    path:null,pathTimer:Math.floor(Math.random()*PATH_INT),pathIdx:0,
    activated:false, defId:'goblin', _tgt:null, _tgtTimer:0};
}
// Archer sfx — short bowstring twang
function gPlayTwang(){gpfx(ac=>{
  const t=ac.currentTime;
  const osc=ac.createOscillator();osc.type='triangle';
  osc.frequency.setValueAtTime(320,t);osc.frequency.exponentialRampToValueAtTime(80,t+0.18);
  const g=ac.createGain();g.gain.setValueAtTime(0.28,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.22);
  // String noise layer
  const b=ac.createBuffer(1,ac.sampleRate*.08,ac.sampleRate);const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  const src=ac.createBufferSource();src.buffer=b;
  const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=2;
  const g2=ac.createGain();g2.gain.setValueAtTime(0.15,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.08);
  src.connect(f);f.connect(g2);g2.connect(ac.destination);src.start(t);src.stop(t+0.09);
  osc.connect(g);g.connect(ac.destination);osc.start(t);osc.stop(t+0.23);
});}

// Arrow hit thud
function gPlayArrowHit(){gpfx(ac=>{
  const t=ac.currentTime,dur=.12;
  const b=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.8;
  const src=ac.createBufferSource();src.buffer=b;
  const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=500;f.Q.value=1.5;
  const g=ac.createGain();g.gain.setValueAtTime(.35,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  src.connect(f);f.connect(g);g.connect(ac.destination);src.start(t);src.stop(t+dur+.01);
});}

function makeArcherEnt(tx,ty){
  const d=EntityDefs.archer;
  return{wx:tx*T+T/2,wy:ty*T+T/2,r:d.radius,vx:0,vy:0,
    hp:d.hp,maxHp:d.hp,angle:0,hitFlash:0,dead:false,
    walkFrame:0,walkTimer:0,moving:false,
    attackCooldown:d.attackCdMin+Math.floor(Math.random()*d.attackCdRange),
    activated:false,isArcher:true,retreatCooldown:0,
    patrolTimer:0,patrolAngle:Math.random()*Math.PI*2,
    defId:'archer', _tgt:null, _tgtTimer:0};
}


function makeWarriorEnt(tx,ty){
  const d=EntityDefs.warrior;
  return{wx:tx*T+T/2,wy:ty*T+T/2,r:d.radius,vx:0,vy:0,
    hp:d.hp,maxHp:d.hp,angle:0,hitFlash:0,dead:false,
    walkFrame:0,walkTimer:0,
    speed:d.speedMin+Math.random()*d.speedRange,
    attackCooldown:d.attackCdMin+Math.floor(Math.random()*d.attackCdRange),
    activated:false,isWarrior:true,
    phase:'idle',phaseTimer:0,
    chargeAngle:0,chargeTraveled:0,
    defId:'warrior',_tgt:null,_tgtTimer:0,
    patrolAngle:Math.random()*Math.PI*2,patrolTimer:0,
    path:null,pathTimer:Math.floor(Math.random()*PATH_INT),pathIdx:0,_pathTarget:null};
}
