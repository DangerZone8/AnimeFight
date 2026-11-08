import { AdaptiveCPU } from "./ai.js";

const roster = [
  {id:"son",name:"SON GOKU",series:"DRAGON BALL",style:"Saiyan striker",color:"#ff9c32",glow:"#ff6b25",speed:4.2,power:1.12,move:"KAMEHAMEHA"},
  {id:"ninja",name:"NARUTO",series:"NARUTO",style:"Ninja brawler",color:"#ff7a27",glow:"#ffb13d",speed:4.6,power:1,move:"RASENGAN"},
  {id:"captain",name:"LUFFY",series:"ONE PIECE",style:"Rubber brawler",color:"#e84a43",glow:"#ffca65",speed:4.3,power:1.06,move:"GUM-GUM"},
  {id:"sorcerer",name:"GOJO",series:"JUJUTSU KAISEN",style:"Limitless tactician",color:"#d7e6ff",glow:"#5b9dff",speed:4,power:1.08,move:"BLUE VOID"},
  {id:"blade",name:"TANJIRO",series:"DEMON SLAYER",style:"Breathing swordsman",color:"#37b78b",glow:"#52e8cb",speed:4.1,power:1.1,move:"WATER WHEEL"},
  {id:"reaper",name:"ICHIGO",series:"BLEACH",style:"Soul reaper",color:"#ff7b5e",glow:"#ff3f4f",speed:4.4,power:1.13,move:"GETSUGA"},
  {id:"homunculus",name:"EDWARD",series:"FULLMETAL ALCHEMIST",style:"Alchemist",color:"#dfc05e",glow:"#f3a849",speed:4,power:1.02,move:"ALCHEMY"},
  {id:"hero",name:"SAITAMA",series:"ONE PUNCH MAN",style:"Overwhelming hero",color:"#f2cf45",glow:"#ffef80",speed:3.8,power:1.22,move:"SERIOUS STRIKE"}
];

const $ = (id) => document.getElementById(id);
const canvas = $("game-canvas"), ctx = canvas.getContext("2d");
let selected = 0, player, cpu, brain, keys = new Set(), last = 0, elapsed = 0, timer = 60, running = false, paused = false, raf = 0, arena = "neon", roundOver = false, roundWins = [0,0], playerLastAction = "approach", statusTick = 0;

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
    const b=document.createElement("button"); b.className="fighter-card"+(i===selected?" selected":""); b.type="button"; b.setAttribute("aria-pressed",String(i===selected));
    const art=document.createElement("div"); art.className="fighter-art"; art.style.setProperty("--glow",f.glow); const pc=document.createElement("canvas"); art.append(pc); drawPortrait(pc,f);
    const name=document.createElement("strong"); name.textContent=f.name; const series=document.createElement("small"); series.textContent=f.series;
    const pick=document.createElement("span"); pick.className="pick"; pick.textContent="SELECTED";
    b.append(art,name,series,pick); b.addEventListener("click",()=>{selected=i;renderRoster()}); $("roster").append(b);
  });
}
renderRoster();

class Fighter {
  constructor(x, data, facing, isCPU=false){this.x=x;this.y=0;this.vx=0;this.vy=0;this.data=data;this.facing=facing;this.health=100;this.energy=0;this.grounded=true;this.action="idle";this.actionTime=0;this.cooldown=0;this.guard=false;this.isCPU=isCPU;this.hitFlash=0;this.combo=0;}
}
function startGame(){
  $("menu-screen").classList.add("hidden"); $("fight-screen").classList.remove("hidden");
  arena=$("arena").value; const hero=roster[selected], rival=roster[(selected+3)%roster.length];
  player=new Fighter(290,hero,1); cpu=new Fighter(810,rival,-1,true);
  $("player-name").textContent=hero.name; $("cpu-name").textContent=rival.name;
  brain=new AdaptiveCPU({difficulty:$("difficulty").value,personality:$("cpu-style").value});
  timer=60; elapsed=0; roundWins=[0,0]; roundOver=false; paused=false; running=true; $("round-banner").classList.add("hidden"); last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
}
function backToMenu(){running=false;cancelAnimationFrame(raf);$("fight-screen").classList.add("hidden");$("menu-screen").classList.remove("hidden");}
function action(f,a){if(f.cooldown>0||f.action==="hit")return false;f.action=a;f.actionTime=a==="special"?0.48:a==="heavy"?0.36:a==="attack"?0.23:0.3;f.cooldown=a==="special"?0.85:a==="heavy"?0.48:0.27;f.guard=a==="guard";if(!f.isCPU)playerLastAction=a;return true;}
function hit(attacker, defender, kind){
  const reach=kind==="special"?260:kind==="heavy"?115:88;
  if(Math.abs(attacker.x-defender.x)>reach)return false;
  if(defender.guard){defender.health=Math.max(0,defender.health-(kind==="special"?5:2));defender.energy=Math.min(100,defender.energy+7);return false;}
  const damage=(kind==="special"?23:kind==="heavy"?13:7)*attacker.data.power;
  defender.health=Math.max(0,defender.health-damage);defender.energy=Math.min(100,defender.energy+12);attacker.energy=Math.min(100,attacker.energy+(kind==="special"?0:8));defender.action="hit";defender.actionTime=.2;defender.vx=attacker.facing*(kind==="heavy"?8:4);defender.hitFlash=.15;return true;
}
function playerInput(){
  if(!running||paused||roundOver)return;
  player.vx=0;player.guard=false;
  if(keys.has("a")||keys.has("arrowleft")){player.vx=-player.data.speed;player.facing=-1;}
  if(keys.has("d")||keys.has("arrowright")){player.vx=player.data.speed;player.facing=1;}
  if((keys.has("w")||keys.has("arrowup")||keys.has(" "))&&player.grounded){player.vy=-12;player.grounded=false;}
  if(keys.has("i")){player.guard=true;player.action="guard";}
  if(keys.has("j")){if(action(player,"attack"))hit(player,cpu,"attack");keys.delete("j");}
  if(keys.has("k")){if(action(player,"heavy"))hit(player,cpu,"heavy");keys.delete("k");}
  if(keys.has("l")&&player.energy>=35){if(action(player,"special")){player.energy-=35;hit(player,cpu,"special");keys.delete("l");}}
}
function cpuThink(){
  if(cpu.cooldown>0||cpu.action==="hit")return;
  const distance=Math.abs(player.x-cpu.x);
  const decision=brain.choose({distance,selfHealth:cpu.health,enemyHealth:player.health,selfEnergy:cpu.energy,enemyAction:player.action,selfCooldown:cpu.cooldown});
  $("cpu-status").textContent="CPU: "+decision.toUpperCase();
  cpu.vx=0;cpu.guard=false;
  if(decision==="approach"){cpu.vx=cpu.facing*2.8;cpu.action="run";}
  else if(decision==="guard"){cpu.guard=true;cpu.action="guard";}
  else if(decision==="evade"){cpu.vx=-cpu.facing*4;cpu.action="run";}
  else if(decision==="counter"){if(action(cpu,"heavy"))hit(cpu,player,"heavy");}
  else if(decision==="special"&&cpu.energy>=35){if(action(cpu,"special")){cpu.energy-=35;hit(cpu,player,"special");}}
  else if(decision==="heavy"){if(action(cpu,"heavy"))hit(cpu,player,"heavy");}
  else if(decision==="attack"){if(action(cpu,"attack"))hit(cpu,player,"attack");}
}
function update(dt){
  if(!running||paused||roundOver)return;
  elapsed+=dt;timer=Math.max(0,60-elapsed);
  playerInput();
  cpu.facing=player.x<cpu.x?-1:1;player.facing=player.x<cpu.x?-1:1;
  if(Math.random()<Math.min(1,dt*2.2)){brain.observe(playerLastAction);playerLastAction="approach";}
  if(Math.random()<dt*3)cpuThink();
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
}
function finishRound(){
  roundOver=true;const winner=player.health>cpu.health?0:cpu.health>player.health?1:2;
  if(winner!==2)roundWins[winner]++;
  const text=winner===2?"DRAW":winner===0?"ROUND WON":"CPU WINS ROUND";
  $("round-banner").textContent=text+"  ·  "+roundWins[0]+" — "+roundWins[1];$("round-banner").classList.remove("hidden");
  if(roundWins[0]<2&&roundWins[1]<2){setTimeout(()=>{if(!running)return;player.health=100;cpu.health=100;player.energy=0;cpu.energy=0;player.x=290;cpu.x=810;elapsed=0;timer=60;roundOver=false;$("round-banner").classList.add("hidden");},1800);}
  else{$("round-banner").textContent=(roundWins[0]>roundWins[1]?"VICTORY":"DEFEAT")+"  ·  "+roundWins[0]+" — "+roundWins[1];}
}
function drawFighter(f){
  const x=f.x,y=414-f.y,face=f.facing, c=ctx; c.save();c.translate(x,y);c.scale(face,1);
  if(f.hitFlash>0){c.globalAlpha=.5+Math.sin(elapsed*40)*.3;}
  const col=f.data.color;
  c.fillStyle="#05071180";c.beginPath();c.ellipse(0,5,37,9,0,0,Math.PI*2);c.fill();
  c.fillStyle=f.data.glow+"55";c.beginPath();c.arc(0,-76,48,0,Math.PI*2);c.fill();
  // Original, graphic anime-inspired fighter silhouette.
  c.fillStyle="#20243c";c.fillRect(-19,-57,14,48);c.fillRect(6,-57,14,48);
  c.fillStyle=col;c.beginPath();c.moveTo(-24,-108);c.lineTo(23,-108);c.lineTo(30,-56);c.lineTo(-27,-56);c.closePath();c.fill();
  c.fillStyle="#f0c7a9";c.beginPath();c.arc(0,-128,22,0,Math.PI*2);c.fill();
  c.fillStyle="#17172a";c.beginPath();c.moveTo(-23,-134);c.lineTo(-25,-158);c.lineTo(-8,-148);c.lineTo(2,-165);c.lineTo(14,-147);c.lineTo(26,-154);c.lineTo(20,-128);c.lineTo(8,-139);c.lineTo(-6,-132);c.closePath();c.fill();
  c.fillStyle="#20203a";c.fillRect(-12,-130,7,3);c.fillRect(6,-130,7,3);
  c.strokeStyle="#20203a";c.lineWidth=3;c.beginPath();c.moveTo(-5,-117);c.lineTo(5,-117);c.stroke();
  c.strokeStyle=col;c.lineWidth=12;c.lineCap="round";c.beginPath();
  const arm=f.action==="attack"||f.action==="heavy"||f.action==="special"?32:20;
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
  ctx.clearRect(0,0,1100,520);drawArena();drawFighter(player);drawFighter(cpu);
  if(player.action==="special"&&player.actionTime>0){ctx.fillStyle=player.data.glow;ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(player.x+player.facing*90,315,85,17,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}
function loop(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);draw();raf=requestAnimationFrame(loop);}
document.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["arrowleft","arrowright","arrowup"," "].includes(k))e.preventDefault();keys.add(k);});
document.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll("[data-key]").forEach(b=>{
  const k=b.dataset.key;const down=e=>{e.preventDefault();keys.add(k);b.classList.add("active");};const up=e=>{e.preventDefault();keys.delete(k);b.classList.remove("active");};
  b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up);
});
$("start-button").addEventListener("click",startGame);$("back-button").addEventListener("click",backToMenu);
$("pause-button").addEventListener("click",()=>{paused=!paused;$("pause-button").textContent=paused?"▶ RESUME":"Ⅱ PAUSE";});
$("rematch-button").addEventListener("click",()=>{if(player&&cpu){player.health=cpu.health=100;player.energy=cpu.energy=0;player.x=290;cpu.x=810;roundWins=[0,0];elapsed=0;timer=60;roundOver=false;paused=false;$("round-banner").classList.add("hidden");}});
