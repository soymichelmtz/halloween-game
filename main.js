// Halloween Candy Collector - enhanced with sprites, touch controls and simple audio
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

let keys = {};
let game = {running:false, score:0, lives:3, spawnTimer:0, speed:1, objects:[], paused:false};

// Settings with persistence
const DEFAULT_SETTINGS = { playerSpeed: 350, difficulty: 50 };
function loadSettings(){
  try{ const raw = localStorage.getItem('halloween_settings'); if(raw){ return {...DEFAULT_SETTINGS, ...JSON.parse(raw)} } }catch(e){}
  return {...DEFAULT_SETTINGS};
}
function saveSettings(s){ try{ localStorage.setItem('halloween_settings', JSON.stringify(s)) }catch(e){} }
let settings = loadSettings();

// assets
const assets = {};
let assetsToLoad = 3;

function loadAssets(cb){
  const map = {candy: 'assets/candy.svg', ghost: 'assets/ghost.svg', player: 'assets/witch.svg'};
  for(const k in map){
    const img = new Image();
    img.onload = ()=>{ assets[k]=img; assetsToLoad--; if(assetsToLoad===0) cb(); };
    img.src = map[k];
  }
}

// simple audio (WebAudio) for pickup/hit
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioCtx ? new AudioCtx() : null;
function playSfx(type){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type === 'pickup' ? 'sine' : 'square';
  o.frequency.value = type === 'pickup' ? 880 : 200;
  g.gain.value = 0.0001;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
  o.stop(audioCtx.currentTime + 0.28);
}

class Player{
  constructor(){ this.w=60; this.h=30; this.x=W/2-this.w/2; this.y=H-80; this.color='#8b5cf6' }
  update(dt){
  const speed = settings.playerSpeed || 350;
    if(keys['ArrowLeft']||keys['a']||keys['touchLeft']) this.x -= speed*dt;
    if(keys['ArrowRight']||keys['d']||keys['touchRight']) this.x += speed*dt;
    this.x = Math.max(10, Math.min(W - this.w - 10, this.x));
  }
  draw(){
    if(assets.player){
      ctx.drawImage(assets.player, this.x-8, this.y-28, this.w+16, this.h+48);
      return;
    }
    // fallback: simple witch hat + broom silhouette
    // broom
    ctx.fillStyle = '#6b451a'; ctx.fillRect(this.x+10,this.y+18,40,6);
    // body
    ctx.fillStyle = this.color; ctx.beginPath(); ctx.ellipse(this.x+this.w/2,this.y+12,28,18,0,0,Math.PI*2); ctx.fill();
    // hat
    ctx.fillStyle = '#0b0b0b'; ctx.beginPath(); ctx.moveTo(this.x+12,this.y-6); ctx.lineTo(this.x+48,this.y-6); ctx.lineTo(this.x+30,this.y-30); ctx.closePath(); ctx.fill();
  }
  rect(){ return {x:this.x,y:this.y,w:this.w,h:this.h+20} }
}

class Candy{
  constructor(x, type=0){ this.x=x; this.y=-20; this.r=12; this.type=type; this.speed=120+Math.random()*80 }
  update(dt){ this.y += this.speed*dt }
  draw(){
  if(assets.candy){ ctx.drawImage(assets.candy, this.x-this.r, this.y-this.r, this.r*2, this.r*2); return }
  // fallback shape
  ctx.save(); ctx.translate(this.x,this.y);
  ctx.fillStyle = '#ffb86b'; ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff3e6'; ctx.fillRect(-this.r-8,-4,6,8);
  ctx.fillRect(this.r+2,-4,6,8);
  ctx.restore();
  }
  rect(){ return {x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2} }
}

class Ghost{
  constructor(x){ this.x=x; this.y=-40; this.r=22; this.speed=ghostBaseSpeed()+Math.random()*60; this.phase=Math.random()*Math.PI*2 }
  update(dt){ this.y += this.speed*dt; this.x += Math.sin((performance.now()/500)+this.phase)*20*dt }
  draw(){
  if(assets.ghost){ ctx.drawImage(assets.ghost, this.x-this.r-6, this.y-this.r-6, this.r*2+12, this.r*2+12); return }
  ctx.save(); ctx.translate(this.x,this.y);
  // body
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(0,0,this.r,Math.PI,0); ctx.lineTo(this.r,-this.r/2); ctx.quadraticCurveTo(0,this.r+12,-this.r,-this.r/2); ctx.closePath(); ctx.fill();
  // eyes
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-7,-4,3,0,Math.PI*2); ctx.arc(4,-4,3,0,Math.PI*2); ctx.fill();
  ctx.restore();
  }
  rect(){ return {x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2} }
}

const player = new Player();

function rectsOverlap(a,b){ return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y+a.h < b.y || a.y > b.y+b.h) }

function spawn(){
  const roll = Math.random();
  const x = 40 + Math.random()*(W-80);
  if(roll < 0.65) game.objects.push(new Candy(x)); else game.objects.push(new Ghost(x));
}

let last = performance.now();
function loop(now){
  const dt = Math.min(0.04,(now-last)/1000);
  last = now;
  if(!game.paused) update(dt);
  draw();
  if(game.running) requestAnimationFrame(loop);
}

function update(dt){
  player.update(dt);
  game.spawnTimer -= dt;
  if(game.spawnTimer <= 0){ spawn(); game.spawnTimer = spawnInterval(); }
  for(let i=game.objects.length-1;i>=0;i--){
    const obj = game.objects[i]; obj.update(dt);
    if(obj.y > H+50) { game.objects.splice(i,1); continue }
    if(obj instanceof Candy){ if(rectsOverlap(player.rect(), obj.rect())){ game.score += 10; game.objects.splice(i,1); continue } }
    if(obj instanceof Ghost){ if(rectsOverlap(player.rect(), obj.rect())){ game.lives -= 1; game.objects.splice(i,1); if(game.lives<=0) endGame(); continue } }
  }
  // small difficulty ramp
  game.speed += dt*0.01;
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);
  // background moon
  const g = ctx.createRadialGradient(W-140,80,10,W-140,80,140); g.addColorStop(0,'#ffeeba'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // tombstones / ground
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0,H-60,W,60);

  // objects
  for(const o of game.objects) o.draw();
  player.draw();

  // UI
  ctx.fillStyle = '#fff'; ctx.font='20px Segoe UI'; ctx.fillText(`Puntaje: ${game.score}`, 12, 30);
  ctx.fillText(`Vidas: ${game.lives}`, 12, 58);

  if(game.paused && game.running){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(W/2-180,H/2-60,360,120);
    ctx.fillStyle='#ffb86b'; ctx.font='28px Segoe UI'; ctx.textAlign='center'; ctx.fillText('Juego en Pausa', W/2, H/2-5);
    ctx.fillStyle='#fff'; ctx.font='16px Segoe UI'; ctx.fillText('Pulsa P o el botón ⏸ para continuar', W/2, H/2+24);
    ctx.textAlign='left';
  }

  if(!game.running){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(W/2-200,H/2-70,400,140);
    ctx.fillStyle='#ffb86b'; ctx.font='26px Segoe UI'; ctx.textAlign='center'; ctx.fillText('Pulsa ESPACIO para comenzar', W/2, H/2-10);
    ctx.fillStyle='#fff'; ctx.font='16px Segoe UI'; ctx.fillText('Recoge caramelos y evita fantasmas', W/2, H/2+22);
    ctx.textAlign='left';
  }
}

function endGame(){ game.running=false; draw(); }

// input
window.addEventListener('keydown', (e)=>{
  if(e.key === ' '){ if(!game.running){ startGame(); e.preventDefault(); } }
  keys[e.key] = true;
});
window.addEventListener('keyup', (e)=>{ keys[e.key] = false });
canvas.addEventListener('click', ()=> canvas.focus());
canvas.addEventListener('touchstart',(e)=>{ e.preventDefault(); canvas.focus(); });

function startGame(){ game.running=true; game.score=0; game.lives=3; game.objects=[]; game.spawnTimer=0.5; game.speed=1; last = performance.now(); requestAnimationFrame(loop); }

// start with canvas focus so keyboard works
canvas.focus();
// show initial frame
draw();

// expose for debug in console
window._game = game; window._player = player;

// Difficulty helpers
function spawnInterval(){
  // Difficulty 0..100 -> interval from easy (0.8s) to hard (0.25s)
  const d = clamp((settings.difficulty ?? 50), 0, 100);
  const base = 0.8 - (d/100)*(0.8-0.25);
  // Include a small ramp with game.speed but keep within [0.18..1.2]
  const adjusted = base - Math.min(0.25, game.speed*0.02);
  return clamp(adjusted, 0.18, 1.2);
}
function ghostBaseSpeed(){
  // Difficulty scales ghost speed 60..180
  const d = clamp((settings.difficulty ?? 50), 0, 100);
  return 60 + (d/100)*120;
}
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)) }

// Settings UI wiring
const settingsBtn = document.getElementById('settingsBtn');
const modal = document.getElementById('settingsModal');
const speedInput = document.getElementById('playerSpeed');
const speedVal = document.getElementById('playerSpeedVal');
const diffInput = document.getElementById('difficulty');
const diffVal = document.getElementById('difficultyVal');
const saveBtn = document.getElementById('settingsSave');
const cancelBtn = document.getElementById('settingsCancel');
const resetBtn = document.getElementById('settingsReset');

function openSettings(){
  speedInput.value = settings.playerSpeed;
  speedVal.textContent = settings.playerSpeed;
  diffInput.value = settings.difficulty;
  diffVal.textContent = settings.difficulty;
  modal.classList.remove('hidden');
}
function closeSettings(){ modal.classList.add('hidden') }

settingsBtn?.addEventListener('click', openSettings);
cancelBtn?.addEventListener('click', closeSettings);
modal?.addEventListener('click', (e)=>{ if(e.target === modal) closeSettings() });
speedInput?.addEventListener('input', ()=>{ speedVal.textContent = speedInput.value });
diffInput?.addEventListener('input', ()=>{ diffVal.textContent = diffInput.value });
resetBtn?.addEventListener('click', ()=>{ settings = {...DEFAULT_SETTINGS}; saveSettings(settings); closeSettings() });
saveBtn?.addEventListener('click', ()=>{
  settings = {
    playerSpeed: clamp(parseInt(speedInput.value||DEFAULT_SETTINGS.playerSpeed,10), 150, 600),
    difficulty: clamp(parseInt(diffInput.value||DEFAULT_SETTINGS.difficulty,10), 0, 100),
  };
  saveSettings(settings);
  closeSettings();
});

// Pause wiring
const pauseBtn = document.getElementById('pauseBtn');
function togglePause(){ if(game.running){ game.paused = !game.paused; draw(); } }
pauseBtn?.addEventListener('click', togglePause);
window.addEventListener('keydown', (e)=>{ if(e.key === 'p' || e.key === 'P'){ e.preventDefault(); togglePause(); } });
