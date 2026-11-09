import { AdaptiveCPU } from "./ai.js";
import { SpriteAtlasRenderer, FIGHTER_ATLAS_PATHS } from "./sprite-animation.js";

const roster = [
  {id:"ember",model:"ember",name:"EMBER RONIN",series:"EMBER DISTRICT",style:"Solar-edge duelist",color:"#e88b42",glow:"#ff9c55",speed:4.2,power:1.12,move:"SUNBREAK"},
  {id:"mirage",model:"mirage",name:"MIRAGE",series:"GLASS FRONTIER",style:"Illusion tactician",color:"#7b9bd9",glow:"#92d7ff",speed:4.6,power:1,move:"AFTERIMAGE"},
  {id:"coil",model:"coil",name:"IRON COIL",series:"METRO CIRCUIT",style:"Pressure brawler",color:"#b84e55",glow:"#ff775d",speed:4.3,power:1.06,move:"PILE DRIVER"},
  {id:"astral",model:"astral",name:"ORACLE ZERO",series:"ASTRAL COURT",style:"Gravity controller",color:"#a4b9ef",glow:"#77a7ff",speed:4,power:1.08,move:"EVENT HORIZON"},
  {id:"tide",model:"tide",name:"TIDEBOUND",series:"JADE COAST",style:"Flowing tide dancer",color:"#37b78b",glow:"#52dfc2",speed:4.1,power:1.1,move:"UNDERTOW"},
  {id:"dusk",model:"dusk",name:"NIGHT VOW",series:"HOLLOW QUARTER",style:"Moonlit striker",color:"#9a6cb8",glow:"#b66cff",speed:4.4,power:1.13,move:"ECLIPSE ARC"},
  {id:"glyph",model:"glyph",name:"SIGIL FORGE",series:"OLD QUARTER",style:"Runic engineer",color:"#c9a85c",glow:"#e6a947",speed:4,power:1.02,move:"RUNE ARRAY"},
  {id:"meteor",model:"meteor",name:"COMET SAINT",series:"CLOUDLINE",style:"Impact monk",color:"#e6d7b4",glow:"#fff0a8",speed:3.8,power:1.22,move:"STARFALL"}
];

const $ = (id) => document.getElementById(id);
const canvas = $("game-canvas"), ctx = canvas.getContext("2d");
let selected = 0, cpuSelected = 3, selectionSide = "player", player, cpu, brain, keys = new Set(), last = 0, elapsed = 0, timer = 60, running = false, paused = false, raf = 0, arena = "neon", roundOver = false, roundWins = [0,0], playerLastAction = "approach", localMode = false, comboBuffer = [], queuedCombo = null, soundEnabled = true, audioContext = null, roundResetTimer = null;
let arena3d = null;
const arena3dReady = Promise.resolve(null);
let hitStop=0,cameraShake=0;
const combatFX=[];
const spriteRenderer=new SpriteAtlasRenderer(FIGHTER_ATLAS_PATHS);
spriteRenderer.load().then(result=>{if(result.loaded)console.info("Loaded fighter sprite atlases:",result.loaded);if(result.failed)console.warn("Fighter sprite atlases not available yet:",result.failed);renderRoster();});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const easeOut=t=>1-Math.pow(1-clamp(t),3);
const easeInOut=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const MOVE_TIMELINES={
 attack:{startup:.28,active:.18,recovery:.54,reach:98,hitstop:.045},
 heavy:{startup:.34,active:.16,recovery:.50,reach:126,hitstop:.075},
 kick:{startup:.31,active:.20,recovery:.49,reach:132,hitstop:.065},
 uppercut:{startup:.34,active:.18,recovery:.48,reach:120,hitstop:.09},
 sweep:{startup:.38,active:.18,recovery:.44,reach:132,hitstop:.08},
 jumpPunch:{startup:.25,active:.22,recovery:.53,reach:120,hitstop:.055},
 jumpKick:{startup:.28,active:.22,recovery:.50,reach:142,hitstop:.07},
 grab:{startup:.35,active:.18,recovery:.47,reach:100,hitstop:.10},
 special:{startup:.42,active:.22,recovery:.36,reach:270,hitstop:.13},
 triple:{startup:.18,active:.18,recovery:.64,reach:150,hitstop:.06},
 double:{startup:.22,active:.2,recovery:.58,reach:138,hitstop:.06},
 cross:{startup:.25,active:.2,recovery:.55,reach:140,hitstop:.06},
 launcher:{startup:.30,active:.18,recovery:.52,reach:150,hitstop:.10},
 finisher:{startup:.32,active:.20,recovery:.48,reach:155,hitstop:.12},
 "double-heavy":{startup:.34,active:.18,recovery:.48,reach:150,hitstop:.10}
};
function moveProgress(f){
 const p=1-clamp(f.actionTime/Math.max(.001,f.actionDuration||.34));
 const m=MOVE_TIMELINES[f.action]||{startup:.28,active:.18,recovery:.54};
 return {p,phase:p<m.startup?"startup":p<m.startup+m.active?"active":"recovery",wind:clamp(p/m.startup),strike:clamp((p-m.startup)/m.active),recover:clamp((p-m.startup-m.active)/m.recovery)};
}
function spawnImpact(x,y,color,power=1){
 const count=Math.round(10+power*7);
 for(let i=0;i<count;i++){const a=Math.PI*2*i/count+(Math.random()-.5)*.28,v=(2+Math.random()*5)*power;combatFX.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,life:.22+Math.random()*.22,max:.44,size:2+Math.random()*4,color});}
 combatFX.push({x,y,ring:1,life:.22,max:.22,size:14+power*12,color});
}
function drawPortrait(canvasEl, fighter) {
  const c=canvasEl.getContext("2d"), w=canvasEl.width=160,h=130;
  c.clearRect(0,0,w,h);
  const glow=c.createRadialGradient(80,78,8,80,78,72);
  glow.addColorStop(0,fighter.glow+"88");glow.addColorStop(1,"#11162b00");
  c.fillStyle=glow;c.fillRect(0,0,w,h);
  if(!spriteRenderer.drawPortrait(c,fighter.id,12,0,136,130)){
    c.fillStyle=fighter.color;c.beginPath();c.ellipse(80,76,35,48,0,0,Math.PI*2);c.fill();
  }
}
function renderRoster(){
  $("roster").innerHTML="";
  $("select-player").classList.toggle("active",selectionSide==="player");$("select-cpu").classList.toggle("active",selectionSide==="cpu");
  roster.forEach((f,i)=>{
    const b=document.createElement("button"); b.className="fighter-card"+(i===selected?" selected":"")+(i===cpuSelected?" cpu-selected":""); b.type="button"; b.setAttribute("aria-pressed",String(i===selected||i===cpuSelected));
    const art=document.createElement("div"); art.className="fighter-art"; art.style.setProperty("--glow",f.glow); const pc=document.createElement("canvas"); art.append(pc); drawPortrait(pc,f);
    const name=document.createElement("strong"); name.textContent=f.name; const series=document.createElement("small"); series.textContent=f.series;
    const pick=document.createElement("span"); pick.className="pick"; pick.textContent="SELECTED";
    b.append(art,name,series,pick); b.addEventListener("click",()=>{if(selectionSide==="player"){selected=i;selectionSide="cpu";$("selection-step").textContent="02 / SELECT YOUR CPU RIVAL";}else{cpuSelected=i;}$("player-pick-name").textContent=roster[selected].name;$("cpu-pick-name").textContent=roster[cpuSelected].name;renderRoster()}); $("roster").append(b);
  });
}
renderRoster();$("player-pick-name").textContent=roster[selected].name;$("cpu-pick-name").textContent=roster[cpuSelected].name;

class Fighter {
  constructor(x, data, facing, isCPU=false){this.x=x;this.y=0;this.vx=0;this.vy=0;this.data=data;this.facing=facing;this.health=100;this.energy=0;this.grounded=true;this.action="idle";this.actionTime=0;this.cooldown=0;this.guard=false;this.isCPU=isCPU;this.hitFlash=0;this.combo=0;this.moveName="";this.blockStun=0;}
}
function startGame(){
  clearTimeout(roundResetTimer);$("menu-screen").classList.add("hidden"); $("fight-screen").classList.remove("hidden");
  arena=$("arena").value; const hero=roster[selected], rival=roster[cpuSelected];
  localMode=$("match-mode").value==="local";
  player=new Fighter(290,hero,1); cpu=new Fighter(810,rival,-1,!localMode);
  document.querySelector(".enemy-hud .hud-name small").textContent=localMode?"PLAYER 02":"CPU RIVAL";
  $("result-panel").classList.add("hidden");$("pause-overlay").classList.add("hidden");
  $("cpu-status").textContent=localMode?"LOCAL PLAYER 2":"CPU ANALYZING";
  $("player-name").textContent=hero.name; $("cpu-name").textContent=rival.name;
  brain=new AdaptiveCPU({difficulty:$("difficulty").value,personality:$("cpu-style").value});
  arena3dReady.then(view=>{if(view&&running){view.setArena(arena);view.setFighters(hero.model,rival.model);}});
  timer=60; elapsed=0; roundWins=[0,0]; roundOver=false; paused=false; running=true; comboBuffer=[];queuedCombo=null;hitStop=0;cameraShake=0;combatFX.length=0;
  $("round-banner").classList.add("hidden");$("round-number").textContent="01";$("round-score").textContent="0 — 0";
  $("pause-button").textContent="Ⅱ PAUSE"; last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
}
function backToMenu(){running=false;paused=false;clearTimeout(roundResetTimer);cancelAnimationFrame(raf);$("pause-overlay").classList.add("hidden");$("result-panel").classList.add("hidden");$("fight-screen").classList.add("hidden");$("menu-screen").classList.remove("hidden");}
function action(f,a){
  const chainable=!!MOVE_TIMELINES[f.action]&&f.actionTime<=f.actionDuration*.34&&f.actionTime>0;
  if((f.cooldown>0&&!chainable)||f.action==="hit"||f.action==="knockdown")return false;
  f.action=a;f.moveName=a;f.actionTime=({special:1.05,grab:.58,uppercut:.52,sweep:.62,jumpPunch:.42,jumpKick:.5,kick:.48,heavy:.46,attack:.34,combo:.42,triple:.72,double:.52,cross:.56,launcher:.62,finisher:.72,"double-heavy":.62}[a]??.34);f.actionDuration=f.actionTime;f.actionElapsed=0;f.pendingHit=null;f.hasConnected=false;
  f.cooldown=({special:1.25,grab:.68,uppercut:.52,sweep:.62,jumpPunch:.42,jumpKick:.48,kick:.42,heavy:.48,attack:.3}[a]??.3);
  f.guard=false;if(!f.isCPU)playerLastAction=a;playSfx(a);return true;
}
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
  // Attacks resolve on their active animation frame, not on the input frame.
  const startup={attack:.105,combo:.12,heavy:.16,kick:.16,uppercut:.18,sweep:.19,jumpPunch:.12,jumpKick:.17,grab:.14,special:.34,triple:.18,double:.14,cross:.15,launcher:.18,finisher:.22,"double-heavy":.19};
  attacker.pendingHit={defender,kind,delay:attacker.actionDuration*(MOVE_TIMELINES[kind]?.startup??.28)};
  return true;
}
function resolveHit(attacker, defender, kind){
  const profile=MOVE_TIMELINES[kind]||{reach:98,hitstop:.05};const reach=profile.reach;
  if(Math.abs(attacker.x-defender.x)>reach||attacker.facing*(defender.x-attacker.x)<-8)return false;
  if(defender.guard&&kind!=="grab"&&kind!=="sweep"){defender.health=Math.max(0,defender.health-(kind==="special"?5:1));defender.energy=Math.min(100,defender.energy+6);defender.blockStun=.12;return false;}
  const base=kind==="special"?30:kind==="grab"?17:kind==="uppercut"?19:kind==="sweep"?17:kind==="jumpKick"?15:kind==="jumpPunch"?11:kind==="kick"?12:kind==="heavy"?13:kind==="double-heavy"?20:kind==="triple"?20:kind==="launcher"?23:kind==="finisher"?25:kind==="cross"?12:kind==="double"?14:7;
  const damage=base*attacker.data.power;attacker.hasConnected=true;hitStop=Math.max(hitStop,profile.hitstop||.05);cameraShake=Math.max(cameraShake,kind==="special"?13:kind==="heavy"||kind==="finisher"?8:4);spawnImpact((attacker.x+defender.x)/2,kind==="sweep"?365:300,attacker.data.glow,kind==="special"?2.2:kind==="heavy"||kind==="finisher"?1.5:1);
  defender.health=Math.max(0,defender.health-damage);defender.energy=Math.min(100,defender.energy+12);attacker.energy=Math.min(100,attacker.energy+(kind==="special"?0:8));defender.action=kind==="sweep"?"knockdown":"hit";defender.actionTime=kind==="sweep"?.72:kind==="grab"?.42:kind==="uppercut"?.48:.3;defender.actionDuration=defender.actionTime;defender.vx=attacker.facing*(kind==="sweep"?7:kind==="uppercut"?5:kind==="heavy"?8:4);if(kind==="uppercut")defender.vy=-6;if(kind==="grab")defender.vx=attacker.facing*2;defender.hitFlash=.15;return true;
}
function controlFighter(f,opponent,scheme){
  const p1=scheme==="p1";
  const left=p1?"a":"arrowleft",right=p1?"d":"arrowright",up=p1?"arrowup":"w",down=p1?"arrowdown":"s";
  const punch=p1?"j":"numpad1",kick=p1?"k":"numpad2",grab=p1?"g":"numpad3",superKey=p1?"l":"numpad0";
  f.vx=0;f.guard=false;f.crouch=keys.has(down);
  if(keys.has(left))f.vx=-f.data.speed;if(keys.has(right))f.vx=f.data.speed;
  if(keys.has(up)&&f.grounded){f.vy=-12;f.grounded=false;f.crouch=false;f.action="jump";f.actionTime=.28;f.actionDuration=.28;if(!f.isCPU)playerLastAction="jump";}
  const back=f.facing>0?left:right;
  if(keys.has("guard")||keys.has(back)){f.guard=true;f.action="guard";}
  if(keys.has(punch)){
    const move=!f.grounded?"jumpPunch":f.crouch?"uppercut":(p1?(queuedCombo||"attack"):"attack");
    if(action(f,move)){hit(f,opponent,move);if(p1)queuedCombo=null;}keys.delete(punch);
  }
  if(keys.has(kick)){
    const move=!f.grounded?"jumpKick":f.crouch?"sweep":(p1?(queuedCombo||"kick"):"kick");
    if(action(f,move)){hit(f,opponent,move);if(p1)queuedCombo=null;}keys.delete(kick);
  }
  if(keys.has(grab)){if(action(f,"grab"))hit(f,opponent,"grab");keys.delete(grab);}
  if(keys.has(superKey)&&f.energy>=100){if(action(f,"special")){f.energy=0;hit(f,opponent,"special");}keys.delete(superKey);}
}
function playerInput(){
  if(!running||paused||roundOver)return;
  controlFighter(player,cpu,"p1");
  if(localMode)controlFighter(cpu,player,"p2");
}
function cpuThink(){
  if(localMode||cpu.cooldown>0||cpu.action==="hit"||cpu.action==="knockdown")return;
  const distance=Math.abs(player.x-cpu.x);
  const decision=brain.choose({distance,selfHealth:cpu.health,enemyHealth:player.health,selfEnergy:cpu.energy,enemyAction:player.action,selfCooldown:cpu.cooldown});
  $("cpu-status").textContent="CPU: "+decision.toUpperCase();
  cpu.vx=0;cpu.guard=false;
  if(player.guard&&distance<100&&Math.random()>.28){if(action(cpu,"grab"))hit(cpu,player,"grab");}
  else if(["attack","kick","heavy","uppercut","sweep","jumpPunch","jumpKick","special"].includes(player.action)&&Math.random()>(brain.reaction??.4)){cpu.guard=true;cpu.action="guard";}
  else if(decision==="approach"){cpu.vx=cpu.facing*2.8;cpu.action="run";}
  else if(decision==="guard"){cpu.guard=true;cpu.action="guard";}
  else if(decision==="evade"){cpu.vx=-cpu.facing*4;cpu.action="run";}
  else if(decision==="counter"){const move=Math.random()<.45?"grab":"kick";if(action(cpu,move))hit(cpu,player,move);}
  else if(decision==="special"&&cpu.energy>=100){if(action(cpu,"special")){cpu.energy=0;hit(cpu,player,"special");}}
  else if(decision==="heavy"){if(action(cpu,"kick"))hit(cpu,player,"kick");}
  else if(decision==="attack"){const move=Math.random()<.35?"grab":"attack";if(action(cpu,move))hit(cpu,player,move);}
}
function update(dt){
  if(!running||paused||roundOver)return;
  if(hitStop>0){hitStop=Math.max(0,hitStop-dt);dt*=.16;}else dt=Math.min(dt,.04);
  elapsed+=dt;timer=Math.max(0,60-elapsed);
  playerInput();
  player.facing=player.x<cpu.x?1:-1;cpu.facing=cpu.x<player.x?1:-1;
  if(Math.random()<Math.min(1,dt*2.2)){brain.observe(playerLastAction);playerLastAction="approach";}
  if(!localMode&&Math.random()<dt*3)cpuThink();
  for(const f of [player,cpu]){
    f.x+=f.vx;f.x=Math.max(48,Math.min(1052,f.x));f.vx*=f.action==="hit"?.88:.72;
    f.y+=f.vy;f.vy+=30*dt;if(f.y>=0){f.y=0;f.vy=0;f.grounded=true;}
    f.cooldown=Math.max(0,f.cooldown-dt);f.actionTime=Math.max(0,f.actionTime-dt);f.actionElapsed=(f.actionElapsed||0)+dt;f.hitFlash=Math.max(0,f.hitFlash-dt);
    if(f.pendingHit){f.pendingHit.delay-=dt;if(f.pendingHit.delay<=0){const pending=f.pendingHit;f.pendingHit=null;resolveHit(f,pending.defender,pending.kind);}}
    if(f.actionTime===0&&!f.guard&&f.action!=="hit"&&f.action!=="knockdown"&&f.action!=="run"&&(f.action!=="jump"||f.grounded))f.action="idle";
    if((f.action==="hit"||f.action==="knockdown")&&f.actionTime===0)f.action="idle";
    if(!f.guard&&f.action==="guard")f.action="idle";
  }
  for(let i=combatFX.length-1;i>=0;i--){const fx=combatFX[i];fx.life-=dt;fx.x+=fx.vx;fx.y+=fx.vy;fx.vx*=.91;fx.vy=fx.vy*.91+.12;if(fx.life<=0)combatFX.splice(i,1);}cameraShake=Math.max(0,cameraShake-dt*34);
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
  const matchFinished=Math.max(...roundWins)>=2&&roundWins[0]!==roundWins[1];
  if(!matchFinished){roundResetTimer=setTimeout(()=>{if(!running)return;for(const f of [player,cpu]){f.health=100;f.energy=0;f.x=f===player?290:810;f.y=0;f.vx=0;f.vy=0;f.action="idle";f.actionTime=0;f.cooldown=0;f.guard=false;f.crouch=false;f.grounded=true;}elapsed=0;timer=60;roundOver=false;$("round-banner").classList.add("hidden");},1800);}
  else{
    const won=roundWins[0]>roundWins[1];$("round-banner").textContent=(won?"VICTORY":"DEFEAT")+"  ·  "+roundWins[0]+" — "+roundWins[1];
    $("result-title").textContent=won?"YOU WIN!":"MATCH OVER";$("result-copy").textContent=won?"The arena belongs to you.":"Run it back and change the outcome.";
    $("result-panel").classList.remove("hidden");
  }
}
function drawFighter(f){
  const c=ctx, x=f.x, ground=414-f.y, face=f.facing, timeline=moveProgress(f), t=timeline.p;
  const actionName=f.action, attacking=["attack","heavy","combo","kick","uppercut","sweep","jumpPunch","jumpKick","grab","special","triple","double","cross","launcher","finisher","double-heavy"].includes(actionName);
  const phase=attacking?timeline.phase:"neutral";const wind=easeInOut(timeline.wind),strike=easeOut(timeline.strike),recovery=easeInOut(timeline.recover);
  const wave=Math.sin(elapsed*7+(f.isCPU?1.4:0)), bob=f.grounded?Math.sin(elapsed*5+(f.isCPU?1:0))*2:0;
  const hurtProgress=actionName==="hit"||actionName==="knockdown"?1-clamp(f.actionTime/Math.max(.001,f.actionDuration||.3)):0;
  let lean=actionName==="hit"?-.24-Math.sin(hurtProgress*Math.PI)*.42:actionName==="knockdown"?-1.22:actionName==="run"?.12:phase==="startup"?-.18:phase==="active"?.16:phase==="recovery"?-.12:0;
  let armA=-.55, armB=.35, legA=.08, legB=-.08, torsoY=-105, headY=-151;
  if(actionName==="guard"){armA=-1.2;armB=-.55;}
  if(actionName==="attack"||actionName==="heavy"||actionName==="combo"||actionName==="triple"||actionName==="double"||actionName==="cross"||actionName==="launcher"||actionName==="finisher"||actionName==="double-heavy"){
    armA=phase==="startup"?-1.85+wind*.35:phase==="active"?-1.5+strike*1.48:recovery*1.15;armB=-.85+wind*.18;
  }
  if(actionName==="kick"||actionName==="jumpKick"){legA=phase==="startup"?-.95+wind*.2:phase==="active"?-.75+strike*2.05:1.3-recovery*1.1;armA=-1.15;armB=-.7;}
  if(actionName==="jumpPunch"){armA=phase==="active"?-1.55+strike*1.5:-1.6+wind*.2;legA=-.4;legB=.5;}
  if(actionName==="uppercut"){armA=phase==="active"?-2.3:-1.6;lean=.12;}
  if(actionName==="sweep"){legA=phase==="active"?-.25+strike*1.7:.15+wind*.3;torsoY=-68;headY=-113;armA=-1.25;armB=-.6;}
  if(actionName==="grab"){armA=phase==="active"?-1.15+strike*1.1:-1.25+wind*.18;armB=phase==="active"?-.9+strike*.65:-.8;}
  if(actionName==="special"){armA=phase==="active"?-1.7+strike*1.6:-1.7+wind*.2;armB=phase==="active"?-1.5+strike*1.1:-1.5;}
  if(actionName==="hit"){armA=1.25;armB=-1.25;legA=-.3;legB=.25;}
  if(actionName==="knockdown"){armA=1.6;armB=-1.4;legA=1.2;legB=-.8;torsoY=-73;headY=-118;}
  if(actionName==="hit"){armA=1.25+hurtProgress*.35;armB=-1.25-hurtProgress*.2;legA=-.3+hurtProgress*.18;legB=.25-hurtProgress*.12;}
  if(actionName==="run"){armA=-.9+wave*.2;armB=.8-wave*.2;legA=.65;legB=-.65;}
  if(actionName==="jump"){legA=-.7;legB=.65;armA=-1.25;armB=-.9;}
  const anticipation=attacking&&phase==="startup"?wind:0;
  const recoil=actionName==="hit"||actionName==="knockdown"?Math.sin(hurtProgress*Math.PI):0;
  const squash=actionName==="knockdown"?.82:actionName==="hit"?.94:phase==="startup"?1-.045*anticipation:phase==="active"?1+.055*strike:phase==="recovery"?1-.025*recovery:1;
  c.save();c.translate(x,ground+bob+(phase==="active"?-2*strike:0));c.scale(face,1);c.rotate(lean);c.scale(1,squash);
  const glow=f.data.glow, color=f.data.color, skin="#edc2a5", dark="#171a30";
  c.globalAlpha=1;c.fillStyle="#05071188";c.beginPath();c.ellipse(0,4,43,10,0,0,Math.PI*2);c.fill();
  const aura=c.createRadialGradient(0,-105,8,0,-105,82);aura.addColorStop(0,glow+"44");aura.addColorStop(1,glow+"00");c.fillStyle=aura;c.beginPath();c.arc(0,-105,82,0,Math.PI*2);c.fill();
  if(f.hitFlash>0){c.globalAlpha=.45+Math.sin(elapsed*48)*.3;}
  // Two-bone legs with visible knees, shin rotation and planted-foot follow-through.
  const limb=(x1,y1,x2,y2,width,col)=>{c.strokeStyle=col;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
  const leg=(angle,offset,front=false)=>{c.save();c.translate(offset,-53);c.rotate(angle);limb(0,0,0,20,18,dark);limb(0,5,0,18,12,color);c.fillStyle=glow;c.beginPath();c.arc(0,20,7,0,Math.PI*2);c.fill();c.translate(0,20);const knee=front&&phase==="active"?-.42:front&&phase==="startup"?.55:.18;c.rotate(knee);limb(0,0,0,20,13,dark);limb(0,4,0,18,8,color);limb(0,20,15,22,14,"#0b1020");c.restore();};
  leg(legB,-12,false);leg(legA,13,true);
  // Coat silhouette, sash and costume accents.
  c.fillStyle=color;c.beginPath();c.moveTo(-25,torsoY+8);c.lineTo(24,torsoY+8);c.lineTo(32,-52);c.lineTo(18,-43);c.lineTo(0,-50);c.lineTo(-19,-42);c.lineTo(-31,-53);c.closePath();c.fill();
  c.fillStyle=glow;c.globalAlpha=.85;c.beginPath();c.moveTo(-25,-82);c.lineTo(24,-82);c.lineTo(17,-72);c.lineTo(-18,-72);c.closePath();c.fill();c.globalAlpha=f.hitFlash>0?.6:1;
  c.strokeStyle=glow;c.lineWidth=3;c.beginPath();c.moveTo(-20,-112);c.lineTo(0,-83);c.lineTo(20,-112);c.stroke();
  if(["coil","glyph","meteor"].includes(f.data.id)){c.fillStyle=glow;c.globalAlpha=.85;c.beginPath();c.moveTo(-29,-108);c.lineTo(-42,-96);c.lineTo(-25,-84);c.closePath();c.fill();c.beginPath();c.moveTo(29,-108);c.lineTo(42,-96);c.lineTo(25,-84);c.closePath();c.fill();c.globalAlpha=1;}
  if(["ember","tide","dusk"].includes(f.data.id)){c.strokeStyle=glow;c.lineWidth=6;c.beginPath();c.moveTo(-20,-75);c.quadraticCurveTo(-42,-56,-57,-68);c.stroke();}
  // Articulated arms: shoulder, elbow and fist follow the attack arc.
  const arm=(angle,side)=>{c.save();c.translate(side*19,-112);c.rotate(angle);limb(0,0,0,19,15,dark);limb(0,3,0,17,11,color);c.fillStyle=glow;c.beginPath();c.arc(0,19,6,0,Math.PI*2);c.fill();c.translate(0,19);const bend=actionName==="guard"?-.95:actionName==="grab"?-.12:phase==="startup"?-.82:phase==="active"?-.18:phase==="recovery"?.72:-.38;c.rotate(bend);limb(0,0,0,19,11,skin);limb(0,4,0,17,8,color);c.fillStyle=skin;c.beginPath();c.arc(0,22,9,0,Math.PI*2);c.fill();c.fillStyle=glow;c.beginPath();c.arc(0,22,4,0,Math.PI*2);c.fill();c.restore();};
  arm(armB,-1);arm(armA,1);
  // Head, spiked hair, expressive eyes.
  c.fillStyle=skin;c.beginPath();c.ellipse(0,headY+12,20,23,0,0,Math.PI*2);c.fill();
  const hair={ember:"#242037",mirage:"#344a7c",coil:"#2a1b26",astral:"#d6e0ff",tide:"#123e40",dusk:"#21182e",glyph:"#3c3020",meteor:"#f0e8d7"}[f.data.id]||dark;
  c.fillStyle=hair;c.beginPath();c.moveTo(-22,headY+2);c.lineTo(-24,headY-20);c.lineTo(-9,headY-10);c.lineTo(1,headY-31);c.lineTo(12,headY-11);c.lineTo(25,headY-21);c.lineTo(20,headY+7);c.lineTo(7,headY-2);c.lineTo(-6,headY+3);c.closePath();c.fill();
  c.strokeStyle=glow;c.lineWidth=3;c.lineCap="round";
  if(["mirage","tide","dusk"].includes(f.data.id)){const flow=Math.sin(elapsed*8+(f.isCPU?1.5:0))*.08+recoil*.32;c.beginPath();c.moveTo(-17,headY-5);c.quadraticCurveTo(-37-flow*22,headY+18,-30-flow*34,headY+42);c.stroke();c.beginPath();c.moveTo(17,headY-4);c.quadraticCurveTo(34+flow*18,headY+16,27+flow*28,headY+37);c.stroke();}
  else if(["coil","meteor"].includes(f.data.id)){c.beginPath();c.moveTo(-13,headY-15);c.lineTo(-5,headY-37);c.lineTo(2,headY-15);c.lineTo(12,headY-32);c.stroke();}
  else if(["glyph","astral"].includes(f.data.id)){c.beginPath();c.moveTo(-18,headY-13);c.lineTo(-25,headY-31);c.moveTo(18,headY-13);c.lineTo(25,headY-31);c.stroke();}
  if(["ember","coil","glyph","meteor"].includes(f.data.id)){c.fillStyle=glow;c.globalAlpha=.8;c.fillRect(-18,headY-7,36,3);c.globalAlpha=1;}
  c.fillStyle="#fff";c.fillRect(-12,headY+11,8,4);c.fillRect(5,headY+11,8,4);c.fillStyle="#1b213c";c.fillRect(-8,headY+11,4,4);c.fillRect(8,headY+11,4,4);
  c.strokeStyle=dark;c.lineWidth=2.5;c.beginPath();c.moveTo(-5,headY+28);c.quadraticCurveTo(0,headY+31,6,headY+27);c.stroke();
  // Action trails and contact cues are tied to the active frames.
  if(attacking&&phase==="active"){
    c.save();c.globalAlpha=.28+.42*strike;c.strokeStyle=glow;c.lineWidth=5+strike*4;c.shadowColor=glow;c.shadowBlur=18;c.lineCap="round";c.beginPath();
    if(["kick","jumpKick","sweep"].includes(actionName)){c.arc(22,-62,58,-.8,.65);c.moveTo(18,-58);c.quadraticCurveTo(65,-92,104,-46);}else{c.arc(32,-104,48,-1.05,.75);c.moveTo(24,-105);c.quadraticCurveTo(72,-142,112,-105);}c.stroke();c.restore();
  }
  if(actionName==="special"){
    const pulse=15+Math.sin(elapsed*24)*4, reach=52+strike*42;
    c.save();c.globalAlpha=.88;c.strokeStyle=glow;c.fillStyle=glow;c.shadowColor=glow;c.shadowBlur=24;c.lineWidth=4;
    if(f.data.id==="ember"){c.beginPath();c.arc(reach,-104,34,-1.25,.85);c.stroke();c.beginPath();c.moveTo(20,-90);c.lineTo(reach+34,-130);c.lineTo(reach+62,-106);c.lineTo(reach+22,-78);c.stroke();}
    else if(f.data.id==="mirage"){c.globalAlpha=.25;c.beginPath();c.ellipse(reach,-100,24,58,-.2,0,Math.PI*2);c.fill();c.globalAlpha=.9;c.beginPath();c.arc(reach,-110,pulse+18,0,Math.PI*2);c.stroke();}
    else if(f.data.id==="coil"){for(let i=0;i<3;i++){c.beginPath();c.arc(reach+i*8,-108,20+i*9,-.9,1.1);c.stroke();}}
    else if(f.data.id==="astral"){c.beginPath();c.arc(reach,-112,pulse+16,0,Math.PI*2);c.stroke();c.beginPath();c.arc(reach,-112,pulse+31,elapsed*3,elapsed*3+Math.PI*1.55);c.stroke();}
    else if(f.data.id==="tide"){c.beginPath();c.moveTo(12,-75);c.bezierCurveTo(48,-155,reach+25,-42,reach+58,-120);c.bezierCurveTo(reach+20,-170,55,-125,12,-75);c.stroke();}
    else if(f.data.id==="dusk"){c.beginPath();c.arc(reach,-110,42,-1.45,.95);c.arc(reach+12,-110,29,-1.2,1.1);c.stroke();}
    else if(f.data.id==="glyph"){for(let i=0;i<3;i++){c.save();c.translate(reach,-110);c.rotate(elapsed*1.7+i*2.09);c.strokeRect(-20-i*5,-20-i*5,40+i*10,40+i*10);c.restore();}}
    else {c.beginPath();c.arc(reach,-108,pulse+25,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(reach-52,-108);c.lineTo(reach+52,-108);c.moveTo(reach,-160);c.lineTo(reach,-56);c.stroke();}
    c.beginPath();c.arc(reach,-110,pulse,0,Math.PI*2);c.fill();c.restore();
  }
  if(f.guard){c.strokeStyle="#78eaff";c.lineWidth=4;c.shadowColor="#78eaff";c.shadowBlur=16;c.beginPath();c.arc(0,-98,54,-1.2,1.2);c.stroke();}
  if(f.hitFlash>0){c.globalAlpha=.8;c.strokeStyle="#fff";c.lineWidth=4;c.beginPath();c.arc(0,-102,48+Math.sin(elapsed*45)*8,0,Math.PI*2);c.stroke();}
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
  ctx.save();if(cameraShake>0)ctx.translate((Math.random()-.5)*cameraShake,(Math.random()-.5)*cameraShake);ctx.clearRect(0,0,1100,520);drawArena();if(!spriteRenderer.draw(ctx,player,elapsed))drawFighter(player);if(!spriteRenderer.draw(ctx,cpu,elapsed))drawFighter(cpu);for(const fx of combatFX){ctx.save();ctx.globalAlpha=clamp(fx.life/fx.max);ctx.strokeStyle=fx.color;ctx.fillStyle=fx.color;ctx.shadowColor=fx.color;ctx.shadowBlur=12;if(fx.ring){ctx.lineWidth=3;ctx.beginPath();ctx.arc(fx.x,fx.y,fx.size*(1-fx.life/fx.max)+4,0,Math.PI*2);ctx.stroke();}else{ctx.beginPath();ctx.arc(fx.x,fx.y,fx.size*clamp(fx.life/fx.max),0,Math.PI*2);ctx.fill();}ctx.restore();}ctx.restore();
  if(player.action==="special"&&player.actionTime>0){ctx.fillStyle=player.data.glow;ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(player.x+player.facing*90,315,85,17,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}
function loop(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);draw();raf=requestAnimationFrame(loop);}
function normalizeKey(e){if(e.code.startsWith("Numpad"))return e.code.toLowerCase();return e.key.toLowerCase();}
document.addEventListener("keydown",e=>{
  const k=normalizeKey(e);if(["arrowleft","arrowright","arrowup","arrowdown"," "].includes(k))e.preventDefault();
  if(k==="escape"&&running){togglePause();return;}
  if(k==="m"){soundEnabled=!soundEnabled;$("sound-toggle").textContent=soundEnabled?"SOUND: ON":"SOUND: OFF";return;}
  if(k==="n"){soundEnabled=false;$("sound-toggle").textContent="SOUND: OFF";return;}
  if(!running&&$("menu-screen").classList.contains("hidden")===false){
    if(k==="enter"){startGame();return;}
    if(k==="t"){const stage=$("arena"),next=(stage.selectedIndex+1)%stage.options.length;stage.selectedIndex=next;return;}
    if(["1","2","3"].includes(k)){$("difficulty").value=["easy","normal","hard"][Number(k)-1];return;}
    if(k==="arrowleft"||k==="arrowright"||k==="arrowup"||k==="arrowdown"){
      const delta=(k==="arrowleft"||k==="arrowup")?-1:1;
      if(selectionSide==="player"&&(k==="arrowleft"||k==="arrowright"))selected=(selected+delta+roster.length)%roster.length;
      if(selectionSide==="cpu"&&(k==="arrowup"||k==="arrowdown"))cpuSelected=(cpuSelected+delta+roster.length)%roster.length;
      $("player-pick-name").textContent=roster[selected].name;$("cpu-pick-name").textContent=roster[cpuSelected].name;renderRoster();return;
    }
  }
  if(e.repeat)return;
  
  if(running&&!paused&&(k==="j"||k==="k"))recordCombo(k);
  keys.add(k);
});
document.addEventListener("keyup",e=>keys.delete(normalizeKey(e)));
document.querySelectorAll("[data-key]").forEach(b=>{
  const k=b.dataset.key;const down=e=>{e.preventDefault();if(running&&!paused&&(k==="j"||k==="k"))recordCombo(k);keys.add(k);b.classList.add("active");};const up=e=>{e.preventDefault();keys.delete(k);b.classList.remove("active");};
  b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up);
});
$("start-button").addEventListener("click",startGame);$("back-button").addEventListener("click",backToMenu);
function togglePause(){paused=!paused;$("pause-overlay").classList.toggle("hidden",!paused);$("pause-button").textContent=paused?"▶ RESUME":"Ⅱ PAUSE";}
$("pause-button").addEventListener("click",togglePause);
function updateOrientationHint(){const small=matchMedia("(max-width: 850px)").matches,portrait=matchMedia("(orientation: portrait)").matches;$("rotate-overlay").classList.toggle("hidden",!(small&&portrait));}
window.addEventListener("resize",updateOrientationHint);window.addEventListener("orientationchange",updateOrientationHint);updateOrientationHint();
$("continue-portrait").addEventListener("click",()=>$("rotate-overlay").classList.add("hidden"));
$("fullscreen-button").addEventListener("click",async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.();}catch(error){console.warn("Fullscreen is unavailable in this browser",error);}});

$("resume-button").addEventListener("click",togglePause);
$("sound-toggle").addEventListener("click",()=>{soundEnabled=!soundEnabled;$("sound-toggle").textContent=soundEnabled?"SOUND: ON":"SOUND: OFF";});
$("quit-button").addEventListener("click",backToMenu);
$("result-rematch").addEventListener("click",()=>{$("result-panel").classList.add("hidden");startGame();});
$("result-select").addEventListener("click",()=>{$("result-panel").classList.add("hidden");backToMenu();});
$("rematch-button").addEventListener("click",()=>{if(player&&cpu){$("result-panel").classList.add("hidden");startGame();}});
$("select-player").addEventListener("click",()=>{selectionSide="player";$("selection-step").textContent="01 / SELECT YOUR FIGHTER";$("select-player").classList.add("active");$("select-cpu").classList.remove("active");});
$("select-cpu").addEventListener("click",()=>{selectionSide="cpu";$("selection-step").textContent="02 / SELECT YOUR CPU RIVAL";$("select-cpu").classList.add("active");$("select-player").classList.remove("active");});
$("random-button").addEventListener("click",()=>{selected=Math.floor(Math.random()*roster.length);do{cpuSelected=Math.floor(Math.random()*roster.length);}while(cpuSelected===selected);$("player-pick-name").textContent=roster[selected].name;$("cpu-pick-name").textContent=roster[cpuSelected].name;renderRoster();});
