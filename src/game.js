import { AdaptiveCPU } from "./ai.js";

const roster = [
  {id:"ember",model:"ember",name:"EMBER RONIN",series:"EMBER DISTRICT",style:"Solar-edge duelist",color:"#e88b42",glow:"#ff9c55",speed:4.2,power:1.12,move:"SUNBREAK"},
  {id:"mirage",model:"mirage",name:"MIRAGE",series:"GLASS FRONTIER",style:"Illusion tactician",color:"#7b9bd9",glow:"#92d7ff",speed:4.6,power:1,move:"AFTERIMAGE"},
  {id:"coil",model:"coil",name:"IRON COIL",series:"METRO CIRCUIT",style:"Pressure brawler",color:"#b84e55",glow:"#ff775d",speed:4.3,power:1.06,move:"PILE DRIVER"},
  {id:"astral",model:"astral",name:"ORACLE ZERO",series:"ASTRAL COURT",style:"Gravity controller",color:"#a4b9ef",glow:"#77a7ff",speed:4,power:1.08,move:"EVENT HORIZON"},
  {id:"tide",model:"tide",name:"TIDEBOUND",series:"JADE COAST",style:"Flowing blade dancer",color:"#37b78b",glow:"#52dfc2",speed:4.1,power:1.1,move:"UNDERTOW"},
  {id:"dusk",model:"dusk",name:"NIGHT VOW",series:"HOLLOW QUARTER",style:"Moonlit greatblade",color:"#9a6cb8",glow:"#b66cff",speed:4.4,power:1.13,move:"ECLIPSE ARC"},
  {id:"glyph",model:"glyph",name:"SIGIL FORGE",series:"OLD QUARTER",style:"Runic engineer",color:"#c9a85c",glow:"#e6a947",speed:4,power:1.02,move:"RUNE ARRAY"},
  {id:"meteor",model:"meteor",name:"COMET SAINT",series:"CLOUDLINE",style:"Impact monk",color:"#e6d7b4",glow:"#fff0a8",speed:3.8,power:1.22,move:"STARFALL"}
];

const $ = (id) => document.getElementById(id);
const canvas = $("game-canvas"), ctx = canvas.getContext("2d");
let selected = 0, cpuSelected = 3, selectionSide = "player", player, cpu, brain, keys = new Set(), last = 0, elapsed = 0, timer = 60, running = false, paused = false, raf = 0, arena = "neon", roundOver = false, roundWins = [0,0], playerLastAction = "approach", localMode = false, comboBuffer = [], queuedCombo = null, soundEnabled = true, audioContext = null;
let arena3d = null;
const arena3dReady = import("./arena3d.js").then(({createArena3D}) => {
  arena3d = createArena3D($("arena-wrap"));
  canvas.style.display = "none";
  return arena3d;
}).catch(error => {
  console.warn("3D renderer unavailable; using compatibility renderer:", error);
  return null;
});

function drawPortrait(canvasEl, fighter) {
  const c=canvasEl.getContext("2d"), w=canvasEl.width=160,h=canvasEl.height=130;
  c.clearRect(0,0,w,h); c.fillStyle=fighter.glow+"30"; c.beginPath(); c.arc(80,73,56,0,Math.PI*2); c.fill();
  c.fillStyle=fighter.color; c.beginPath(); c.moveTo(80,20); c.lineTo(112,40); c.lineTo(104,82); c.lineTo(95,104); c.lineTo(65,104); c.lineTo(55,82); c.lineTo(48,40); c.closePath(); c.fill();
  c.fillStyle="#17182c"; c.beginPath(); c.moveTo(47,43); c.lineTo(55,13); c.lineTo(75,30); c.lineTo(87,7); c.lineTo(101,30); c.lineTo(116,18); c.lineTo(111,53); c.lineTo(99,39); c.lineTo(82,47); c.lineTo(63,39); c.closePath(); c.fill();
  c.fillStyle="#fff"; c.fillRect(62,52,13,5); c.fillRect(86,52,13,5); c.fillStyle="#25233c"; c.fillRect(68,53,5,4); c.fillRect(90,53,5,4);
  c.strokeStyle="#15172b"; c.lineWidth=4; c.beginPath(); c.moveTo(71,76); c.quadraticCurveTo(81,82,91,75); c.stroke();
}
function renderRoster(){
  $("roster").innerHTML="";
  roster.forEach((f,i)=>{
    const b=document.createElement("button"); b.className="fighter-card"+(i===selected?" selected":"")+(i===cpuSelected?" cpu-selected":""); b.type="button"; b.setAttribute("aria-pressed",String(i===selected||i===cpuSelected));
    const art=document.createElement("div"); art.className="fighter-art"; art.style.setProperty("--glow",f.glow); const pc=document.createElement("canvas"); art.append(pc); drawPortrait(pc,f);
    const name=document.createElement("strong"); name.textContent=f.name; const series=document.createElement("small"); series.textContent=f.series;
    const pick=document.createElement("span"); pick.className="pick"; pick.textContent="SELECTED";
    b.append(art,name,series,pick); b.addEventListener("click",()=>{if(selectionSide==="player"){selected=i;selectionSide="cpu";$("selection-step").textContent="02 / SELECT YOUR CPU RIVAL";}else{cpuSelected=i;}$("player-pick-name").textContent=roster[selected].name;$("cpu-pick-name").textContent=roster[cpuSelected].name;renderRoster()}); $("roster").append(b);
  });
}
renderRoster();

class Fighter {
  constructor(x, data, facing, isCPU=false){this.x=x;this.y=0;this.vx=0;this.vy=0;this.data=data;this.facing=facing;this.health=100;this.energy=0;this.grounded=true;this.action="idle";this.actionTime=0;this.cooldown=0;this.guard=false;this.isCPU=isCPU;this.hitFlash=0;this.combo=0;}
}
function startGame(){
  $("menu-screen").classList.add("hidden"); $("fight-screen").classList.remove("hidden");
  arena=$("arena").value; const hero=roster[selected], rival=roster[cpuSelected];
  localMode=$("match-mode").value==="local";
  player=new Fighter(290,hero,1); cpu=new Fighter(810,rival,-1,!localMode);
  $("result-panel").classList.add("hidden");$("pause-overlay").classList.add("hidden");
  $("cpu-status").textContent=localMode?"LOCAL PLAYER 2":"CPU ANALYZING";
  $("player-name").textContent=hero.name; $("cpu-name").textContent=rival.name;
  brain=new AdaptiveCPU({difficulty:$("difficulty").value,personality:$("cpu-style").value});
  arena3dReady.then(view=>{if(view&&running){view.setArena(arena);view.setFighters(hero.model,rival.model);}});
  timer=60; elapsed=0; roundWins=[0,0]; roundOver=false; paused=false; running=true; comboBuffer=[];queuedCombo=null;
  $("round-banner").classList.add("hidden");$("round-number").textContent="01";$("round-score").textContent="0 — 0";
  $("pause-button").textContent="Ⅱ PAUSE"; last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
}
function backToMenu(){running=false;cancelAnimationFrame(raf);$("fight-screen").classList.add("hidden");$("menu-screen").classList.remove("hidden");}
function action(f,a){if(f.cooldown>0||f.action==="hit")return false;f.action=a;f.actionTime=a==="special"?.62:a==="combo"?.38:a==="grab"?.32:a==="heavy"?.36:a==="attack"?.23:.3;f.cooldown=a==="special"?1.05:a==="combo"?.55:a==="grab"?.55:a==="heavy"?.48:.27;f.guard=false;if(!f.isCPU)playerLastAction=a;playSfx(a);return true;}
function playSfx(kind){
  if(!soundEnabled)return;
  try{audioContext??=new AudioContext();if(audioContext.state==="suspended")audioContext.resume();
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type=kind==="special"?"sawtooth":"triangle";osc.frequency.value=kind==="special"?130:kind==="heavy"?95:kind==="grab"?180:kind==="combo"?260:210;
    gain.gain.setValueAtTime(.045,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.13);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.14);
  }catch{}
}
function recordCombo(k){
  const now=performance.now();comboBuffer=comboBuffer.filter(x=>now-x.time<900);comboBuffer.push({key:k,time:now});comboBuffer=comboBuffer.slice(-4);
  const seq=comboBuffer.map(x=>x.key).join("");
  queuedCombo=seq.endsWith("jjj")?"triple":seq.endsWith("jjk")?"launcher":seq.endsWith("jkk")?"finisher":seq.endsWith("kk")?"double-heavy":seq.endsWith("jj")?"double":seq.endsWith("jk")?"cross":null;
}
function hit(attacker, defender, kind){
  const reach=kind==="special"?260:kind==="grab"?78:kind==="heavy"||kind==="double-heavy"?125:kind==="triple"||kind==="launcher"||kind==="finisher"?145:kind==="sweep"?110:92;
  if(Math.abs(attacker.x-defender.x)>reach)return false;
  if(defender.guard&&kind!=="grab"){defender.health=Math.max(0,defender.health-(kind==="special"?5:2));defender.energy=Math.min(100,defender.energy+7);return false;}
  const base=kind==="special"?30:kind==="grab"?16:kind==="heavy"?13:kind==="double-heavy"?20:kind==="triple"?20:kind==="launcher"?23:kind==="finisher"?25:kind==="sweep"?16:kind==="cross"?12:kind==="double"?14:7;
  const damage=base*attacker.data.power;
  defender.health=Math.max(0,defender.health-damage);defender.energy=Math.min(100,defender.energy+12);attacker.energy=Math.min(100,attacker.energy+(kind==="special"?0:8));defender.action="hit";defender.actionTime=.2;defender.vx=attacker.facing*(kind==="heavy"?8:4);defender.hitFlash=.15;return true;
}
function controlFighter(f,opponent,scheme){
  const left=scheme==="p2"?"arrowleft":"a",right=scheme==="p2"?"arrowright":"d",up=scheme==="p2"?"arrowup":"w",down=scheme==="p2"?"arrowdown":"s";
  const punch=scheme==="p2"?"numpad1":"j",kick=scheme==="p2"?"numpad2":"k",grab=scheme==="p2"?"numpad3":"i",super=scheme==="p2"?"numpad0":"l";
  f.vx=0;f.guard=false;f.crouch=keys.has(down);
  if(keys.has(left))f.vx=-f.data.speed;if(keys.has(right))f.vx=f.data.speed;
  if((keys.has(up))&&f.grounded){f.vy=-12;f.grounded=false;f.crouch=false;}
  const back=f.facing>0?left:right;
  if(keys.has("guard")||keys.has(back)){f.guard=true;f.action="guard";}
  if(keys.has(punch)){const combo=scheme==="p1"?(queuedCombo||"attack"):"attack";if(action(f,combo==="attack"?"attack":"combo"))hit(f,opponent,combo);queuedCombo=null;keys.delete(punch);}
  if(keys.has(kick)){const combo=scheme==="p1"?(queuedCombo||"heavy"):"heavy";if(action(f,combo==="heavy"?"heavy":"combo"))hit(f,opponent,combo);queuedCombo=null;keys.delete(kick);}
  if(keys.has(grab)){if(action(f,"grab"))hit(f,opponent,"grab");keys.delete(grab);}
  if((keys.has(super)||(scheme==="p1"&&keys.has(" ")))&&f.energy>=100){if(action(f,"special")){f.energy=0;hit(f,opponent,"special");}keys.delete(super);}
}
function playerInput(){
  if(!running||paused||roundOver)return;
  controlFighter(player,cpu,"p1");
  if(localMode)controlFighter(cpu,player,"p2");
}
function cpuThink(){
  if(localMode||cpu.cooldown>0||cpu.action==="hit")return;
  const distance=Math.abs(player.x-cpu.x);
  const decision=brain.choose({distance,selfHealth:cpu.health,enemyHealth:player.health,selfEnergy:cpu.energy,enemyAction:player.action,selfCooldown:cpu.cooldown});
  $("cpu-status").textContent="CPU: "+decision.toUpperCase();
  cpu.vx=0;cpu.guard=false;
  if(decision==="approach"){cpu.vx=cpu.facing*2.8;cpu.action="run";}
  else if(decision==="guard"){cpu.guard=true;cpu.action="guard";}
  else if(decision==="evade"){cpu.vx=-cpu.facing*4;cpu.action="run";}
  else if(decision==="counter"){if(action(cpu,"heavy"))hit(cpu,player,"heavy");}
  else if(decision==="special"&&cpu.energy>=100){if(action(cpu,"special")){cpu.energy=0;hit(cpu,player,"special");}}
  else if(decision==="heavy"){if(action(cpu,"heavy"))hit(cpu,player,"heavy");}
  else if(decision==="attack"){if(action(cpu,"attack"))hit(cpu,player,"attack");}
}
function update(dt){
  if(!running||paused||roundOver)return;
  elapsed+=dt;timer=Math.max(0,60-elapsed);
  playerInput();
  player.facing=player.x<cpu.x?1:-1;cpu.facing=cpu.x<player.x?1:-1;
  if(Math.random()<Math.min(1,dt*2.2)){brain.observe(playerLastAction);playerLastAction="approach";}
  if(!localMode&&Math.random()<dt*3)cpuThink();
  for(const f of [player,cpu]){
    f.x+=f.vx;f.x=Math.max(48,Math.min(1052,f.x));f.vx*=f.action==="hit"?.88:.72;
    f.y+=f.vy;f.vy+=30*dt;if(f.y>=0){f.y=0;f.vy=0;f.grounded=true;}
    f.cooldown=Math.max(0,f.cooldown-dt);f.actionTime=Math.max(0,f.actionTime-dt);f.hitFlash=Math.max(0,f.hitFlash-dt);
    if(f.actionTime===0&&!f.guard&&f.action!=="hit"&&f.action!=="run")f.action="idle";
    if(f.action==="hit"&&f.actionTime===0)f.action="idle";
    if(!f.guard&&f.action==="guard")f.action="idle";
  }
  if(timer<=0||player.health<=0||cpu.health<=0)finishRound();
  $("player-health").style.width=player.health+"%";$("cpu-health").style.width=cpu.health+"%";$("player-energy").style.width=player.energy+"%";$("cpu-energy").style.width=cpu.energy+"%";$("timer").textContent=String(Math.ceil(timer)).padStart(2,"0");
  $("player-shakti").textContent=player.energy>=100?"SHAKTI READY!":"SHAKTI "+Math.floor(player.energy)+"%";$("cpu-shakti").textContent=cpu.energy>=100?"READY!":"SHAKTI "+Math.floor(cpu.energy)+"%";
}
function finishRound(){
  roundOver=true;const winner=player.health>cpu.health?0:cpu.health>player.health?1:2;
  if(winner===2){roundWins[0]++;roundWins[1]++;}else roundWins[winner]++;
  const text=winner===2?"DRAW":winner===0?"ROUND WON":"RIVAL WINS ROUND";
  $("round-banner").textContent=text+"  ·  "+roundWins[0]+" — "+roundWins[1];$("round-banner").classList.remove("hidden");
  $("round-score").textContent=roundWins[0]+" — "+roundWins[1];$("round-number").textContent=String(roundWins[0]+roundWins[1]+1).padStart(2,"0");
  if(roundWins[0]<2&&roundWins[1]<2){setTimeout(()=>{if(!running)return;player.health=100;cpu.health=100;player.energy=0;cpu.energy=0;player.x=290;cpu.x=810;elapsed=0;timer=60;roundOver=false;$("round-banner").classList.add("hidden");},1800);}
  else{
    const won=roundWins[0]>roundWins[1];$("round-banner").textContent=(won?"VICTORY":"DEFEAT")+"  ·  "+roundWins[0]+" — "+roundWins[1];
    $("result-title").textContent=won?"YOU WIN!":"MATCH OVER";$("result-copy").textContent=won?"The arena belongs to you.":"Run it back and change the outcome.";
    $("result-panel").classList.remove("hidden");
  }
}
function drawFighter(f){
  const x=f.x,y=414-f.y,face=f.facing, c=ctx; c.save();c.translate(x,y);c.scale(face,1);
  if(f.hitFlash>0){c.globalAlpha=.5+Math.sin(elapsed*40)*.3;}
  const col=f.data.color;
  c.fillStyle="#05071180";c.beginPath();c.ellipse(0,5,37,9,0,0,Math.PI*2);c.fill();
  c.fillStyle=f.data.glow+"55";c.beginPath();c.arc(0,-76,48,0,Math.PI*2);c.fill();
  // Original, graphic anime-inspired fighter silhouette.
  c.fillStyle="#20243c";c.fillRect(-19,f.crouch?-48:-57,14,f.crouch?38:48);c.fillRect(6,f.crouch?-48:-57,14,f.crouch?38:48);
  c.fillStyle=col;c.beginPath();c.moveTo(-24,f.crouch?-94:-108);c.lineTo(23,f.crouch?-94:-108);c.lineTo(30,f.crouch?-48:-56);c.lineTo(-27,f.crouch?-48:-56);c.closePath();c.fill();
  c.fillStyle="#f0c7a9";c.beginPath();c.arc(0,f.crouch?-112:-128,22,0,Math.PI*2);c.fill();
  c.fillStyle="#17172a";c.beginPath();c.moveTo(-23,-134);c.lineTo(-25,-158);c.lineTo(-8,-148);c.lineTo(2,-165);c.lineTo(14,-147);c.lineTo(26,-154);c.lineTo(20,-128);c.lineTo(8,-139);c.lineTo(-6,-132);c.closePath();c.fill();
  c.fillStyle="#20203a";c.fillRect(-12,-130,7,3);c.fillRect(6,-130,7,3);
  c.strokeStyle="#20203a";c.lineWidth=3;c.beginPath();c.moveTo(-5,-117);c.lineTo(5,-117);c.stroke();
  c.strokeStyle=col;c.lineWidth=12;c.lineCap="round";c.beginPath();
  const arm=f.action==="attack"||f.action==="heavy"||f.action==="combo"||f.action==="grab"||f.action==="special"?32:20;
  c.moveTo(17,-98);c.lineTo(arm,-92);c.stroke();
  c.strokeStyle="#f0c7a9";c.lineWidth=9;c.beginPath();c.moveTo(arm,-92);c.lineTo(arm+13,-88);c.stroke();
  if(f.action==="special"){c.shadowColor=f.data.glow;c.shadowBlur=35;c.fillStyle=f.data.glow;c.beginPath();c.arc(arm+24,-88,18+Math.sin(elapsed*22)*4,0,Math.PI*2);c.fill();}
  if(f.guard){c.strokeStyle="#78eaff";c.lineWidth=4;c.beginPath();c.arc(0,-88,48,-1.2,1.2);c.stroke();}
  c.restore();
}
function drawArena(){
  const w=1100,h=520,g=ctx;
  const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,arena==="temple"?"#182b50":arena==="dojo"?"#321d39":"#151d42");bg.addColorStop(1,"#080b19");g.fillStyle=bg;g.fillRect(0,0,w,h);
  g.save();g.globalAlpha=.2;g.strokeStyle="#91a6e8";g.lineWidth=1;
  for(let i=0;i<15;i++){let xx=i*90+(elapsed*5%90);g.beginPath();g.moveTo(xx,0);g.lineTo(xx-120,390);g.stroke();}
  g.fillStyle=arena==="temple"?"#7b9bcb":"#59628f";
  for(let i=0;i<13;i++){let bx=i*95;let bh=70+(i*37%125);g.fillRect(bx,390-bh,55,bh);g.fillStyle="#f5c66a30";for(let wy=0;wy<4;wy++)g.fillRect(bx+10,400-bh+wy*22,5,8);g.fillStyle=arena==="temple"?"#7b9bcb":"#59628f";}
  g.restore();g.fillStyle="#252b48";g.fillRect(0,420,w,100);g.strokeStyle="#66729d";g.lineWidth=2;g.beginPath();g.moveTo(0,420);g.lineTo(w,420);g.stroke();
  g.strokeStyle="#ffffff12";for(let i=0;i<12;i++){g.beginPath();g.moveTo(550,420);g.lineTo(i*110,520);g.stroke();}
  g.fillStyle="#ffffff10";g.font="700 17px Rajdhani";g.textAlign="center";g.fillText(arena==="temple"?"SKY TEMPLE":arena==="dojo"?"CRIMSON DOJO":"NEO TOKYO",550,48);
}
function draw(){
  if(arena3d){arena3d.render({player,cpu,elapsed});return;}
  ctx.clearRect(0,0,1100,520);drawArena();drawFighter(player);drawFighter(cpu);
  if(player.action==="special"&&player.actionTime>0){ctx.fillStyle=player.data.glow;ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(player.x+player.facing*90,315,85,17,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}
function loop(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);draw();raf=requestAnimationFrame(loop);}
function normalizeKey(e){if(e.code.startsWith("Numpad"))return e.code.toLowerCase();return e.key.toLowerCase();}
document.addEventListener("keydown",e=>{
  const k=normalizeKey(e);if(["arrowleft","arrowright","arrowup","arrowdown"," "].includes(k))e.preventDefault();
  if(k==="escape"&&running){togglePause();return;}
  if(k==="m"){soundEnabled=!soundEnabled;$("sound-toggle").textContent=soundEnabled?"SOUND: ON":"SOUND: OFF";return;}
  if(k==="n"){soundEnabled=false;$("sound-toggle").textContent="SOUND: OFF";return;}
  if(e.repeat)return;
  if((k==="j"||k==="k")&&!localMode)recordCombo(k);
  keys.add(k);
});
document.addEventListener("keyup",e=>keys.delete(normalizeKey(e)));
document.querySelectorAll("[data-key]").forEach(b=>{
  const k=b.dataset.key;const down=e=>{e.preventDefault();if(k==="j"||k==="k")recordCombo(k);keys.add(k);b.classList.add("active");};const up=e=>{e.preventDefault();keys.delete(k);b.classList.remove("active");};
  b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up);
});
$("start-button").addEventListener("click",startGame);$("back-button").addEventListener("click",backToMenu);
function togglePause(){paused=!paused;$("pause-overlay").classList.toggle("hidden",!paused);$("pause-button").textContent=paused?"▶ RESUME":"Ⅱ PAUSE";}
$("pause-button").addEventListener("click",togglePause);
$("resume-button").addEventListener("click",togglePause);
$("sound-toggle").addEventListener("click",()=>{soundEnabled=!soundEnabled;$("sound-toggle").textContent=soundEnabled?"SOUND: ON":"SOUND: OFF";});
$("quit-button").addEventListener("click",backToMenu);
$("result-rematch").addEventListener("click",()=>{$("result-panel").classList.add("hidden");startGame();});
$("result-select").addEventListener("click",()=>{$("result-panel").classList.add("hidden");backToMenu();});
$("rematch-button").addEventListener("click",()=>{if(player&&cpu){$("result-panel").classList.add("hidden");startGame();}});
$("select-player").addEventListener("click",()=>{selectionSide="player";$("selection-step").textContent="01 / SELECT YOUR FIGHTER";$("select-player").classList.add("active");$("select-cpu").classList.remove("active");});
$("select-cpu").addEventListener("click",()=>{selectionSide="cpu";$("selection-step").textContent="02 / SELECT YOUR CPU RIVAL";$("select-cpu").classList.add("active");$("select-player").classList.remove("active");});
$("random-button").addEventListener("click",()=>{selected=Math.floor(Math.random()*roster.length);do{cpuSelected=Math.floor(Math.random()*roster.length);}while(cpuSelected===selected);$("player-pick-name").textContent=roster[selected].name;$("cpu-pick-name").textContent=roster[cpuSelected].name;renderRoster();});
