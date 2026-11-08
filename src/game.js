import { AdaptiveCPU } from "./ai.js";
import { ATTACKS, isInHitRange, comboDamage, nextCombo, addStamina, canUseSuper, spendSuper } from "./combat.js";

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
  constructor(x, data, facing, isCPU=false){this.x=x;this.y=0;this.vx=0;this.vy=0;this.data=data;this.facing=facing;this.health=100;this.energy=0;this.grounded=true;this.action="idle";this.actionTime=0;this.cooldown=0;this.guard=false;this.isCPU=isCPU;this.isBoss=isCPU&&["sorcerer","hero"].includes(data.id);this.hitFlash=0;this.combo=0;this.comboAge=99;this.attackConnected=false;this.animTime=Math.random()*6;}
}
function startGame(){
  $("menu-screen").classList.add("hidden"); $("fight-screen").classList.remove("hidden");
  arena=$("arena").value; const hero=roster[selected], rival=roster[(selected+3)%roster.length];
  player=new Fighter(290,hero,1); cpu=new Fighter(810,rival,-1,true);
  $("player-name").textContent=hero.name; $("cpu-name").textContent=rival.name;
  brain=new AdaptiveCPU({difficulty:$("difficulty").value,personality:$("cpu-style").value});
  timer=60; elapsed=0; roundWins=[0,0]; roundOver=false; paused=false; running=true; $("round-banner").classList.add("hidden");$("super-button").disabled=true;$("super-button").classList.remove("ready"); last=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
}
function backToMenu(){running=false;cancelAnimationFrame(raf);$("fight-screen").classList.add("hidden");$("menu-screen").classList.remove("hidden");}
function action(f,a){if(f.cooldown>0||f.action==="hit")return false;const profile=ATTACKS[a];if((a==="super"||a==="bossSuper")&&!canUseSuper(f.energy))return false;f.action=a;f.actionTime=a==="super"||a==="bossSuper"?0.62:a==="grab"?0.42:a==="kick"?0.36:0.23;f.cooldown=(profile?.cooldown??0.25)*(f.isCPU?brain.cooldownScale:1);f.guard=a==="guard";f.attackConnected=false;if(!f.isCPU)playerLastAction=a;return true;}
function hit(attacker, defender, kind){
  const move=kind==="super"&&attacker.isBoss?"bossSuper":kind;
  const profile=ATTACKS[move];
  if(!profile||attacker.attackConnected||!isInHitRange(attacker,defender,profile.reach))return false;
  attacker.attackConnected=true;
  if(defender.guard&&!profile.ignoresGuard){
    defender.health=Math.max(0,defender.health-(move==="super"||move==="bossSuper"?6:2));
    
    return false;
  }
  attacker.combo=nextCombo(attacker.combo,attacker.comboAge);
  attacker.comboAge=0;
  const damage=comboDamage(profile.damage*attacker.data.power*(attacker.isCPU?brain.damageScale:1),attacker.combo);
  defender.health=Math.max(0,defender.health-damage);
  defender.energy=Math.min(100,defender.energy+12);
  attacker.energy=Math.min(100,attacker.energy+(move==="super"||move==="bossSuper"?0:8));
  defender.action="hit";defender.actionTime=.2;defender.vx=attacker.facing*profile.push;defender.hitFlash=.15;
  $("cpu-status").textContent=(attacker.isCPU?"CPU":"PLAYER")+" COMBO ×"+attacker.combo;
  return true;
}

function playerInput(){
  if(!running||paused||roundOver)return;
  player.vx=0;player.guard=false;
  if(keys.has("a")||keys.has("arrowleft")){player.vx=-player.data.speed;player.facing=-1;}
  if(keys.has("d")||keys.has("arrowright")){player.vx=player.data.speed;player.facing=1;}
  if((keys.has("w")||keys.has("arrowup")||keys.has(" "))&&player.grounded){player.vy=-12;player.grounded=false;}
  if(keys.has("i")){player.guard=true;player.action="guard";playerLastAction="guard";}
  if(keys.has("j")){if(action(player,"punch"))hit(player,cpu,"punch");keys.delete("j");}
  if(keys.has("k")){if(action(player,"kick"))hit(player,cpu,"kick");keys.delete("k");}
  if(keys.has("g")){if(action(player,"grab"))hit(player,cpu,"grab");keys.delete("g");}
  if(keys.has("l")&&canUseSuper(player.energy)){if(action(player,"super")){player.energy=spendSuper(player.energy);hit(player,cpu,"super");keys.delete("l");}}
}

function cpuThink(){
  if(cpu.cooldown>0||cpu.action==="hit")return;
  const distance=Math.abs(player.x-cpu.x);
  const decision=brain.choose({distance,selfHealth:cpu.health,enemyHealth:player.health,selfEnergy:cpu.energy,enemyAction:player.action,selfCooldown:cpu.cooldown});
  $("cpu-status").textContent="CPU: "+decision.toUpperCase();
  cpu.vx=0;cpu.guard=false;
  if(decision==="approach"){cpu.vx=cpu.facing*brain.moveSpeed;cpu.action="run";}
  else if(decision==="guard"){cpu.guard=true;cpu.action="guard";}
  else if(decision==="evade"){cpu.vx=-cpu.facing*brain.moveSpeed*1.12;cpu.action="run";}
  else if(decision==="grab"){if(action(cpu,"grab"))hit(cpu,player,"grab");}
  else if(decision==="counter"){if(action(cpu,"kick"))hit(cpu,player,"kick");}
  else if(decision==="special"&&canUseSuper(cpu.energy)){if(action(cpu,"super")){cpu.energy=spendSuper(cpu.energy);hit(cpu,player,"super");}}
  else if(decision==="heavy"){if(action(cpu,"kick"))hit(cpu,player,"kick");}
  else if(decision==="attack"){if(action(cpu,"punch"))hit(cpu,player,"punch");}
}
function update(dt){
  if(!running||paused||roundOver)return;
  elapsed+=dt;timer=Math.max(0,60-elapsed);
  playerInput();
  cpu.facing=player.x<cpu.x?-1:1;player.facing=player.x<cpu.x?1:-1;
  if(Math.random()<Math.min(1,dt*2.2)){brain.observe(playerLastAction);playerLastAction="approach";}
  if(Math.random()<Math.min(1,dt*brain.thinkRate))cpuThink();
  for(const f of [player,cpu]){
    f.animTime+=dt;f.comboAge+=dt;if(f.comboAge>1.15)f.combo=0;
    f.x+=f.vx;f.x=Math.max(48,Math.min(1052,f.x));f.vx*=f.action==="hit"?.88:.72;
    f.y+=f.vy;f.vy+=30*dt;if(f.y>=0){f.y=0;f.vy=0;f.grounded=true;}
    f.cooldown=Math.max(0,f.cooldown-dt);f.actionTime=Math.max(0,f.actionTime-dt);f.hitFlash=Math.max(0,f.hitFlash-dt);
    if(f.actionTime===0&&!f.guard&&f.action!=="hit"&&f.action!=="run")f.action="idle";
    if(f.action==="hit"&&f.actionTime===0)f.action="idle";
    if(!f.guard&&f.action==="guard")f.action="idle";
  }
  if(timer<=0||player.health<=0||cpu.health<=0)finishRound();
  $("player-health").style.width=player.health+"%";$("cpu-health").style.width=cpu.health+"%";$("player-energy").style.width=player.energy+"%";$("cpu-energy").style.width=cpu.energy+"%";$("player-energy").classList.toggle("super-ready",canUseSuper(player.energy));$("cpu-energy").classList.toggle("super-ready",canUseSuper(cpu.energy));$("super-button").disabled=!canUseSuper(player.energy);$("super-button").classList.toggle("ready",canUseSuper(player.energy));$("timer").textContent=String(Math.ceil(timer)).padStart(2,"0");
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
  const x=f.x,y=414-f.y,face=f.facing,c=ctx;
  const moving=Math.abs(f.vx)>0.8, attacking=["punch","kick","grab","super","bossSuper"].includes(f.action);
  const phase=f.animTime, bob=f.grounded?(moving?Math.abs(Math.sin(phase*12))*3:Math.sin(phase*2)*1.5):0;
  const lean=attacking?Math.min(13,f.actionTime*35):moving?3:0;
  c.save();c.translate(x,y-bob);c.scale(face,1);
  if(f.hitFlash>0)c.globalAlpha=.55+Math.sin(elapsed*40)*.3;
  const col=f.data.color, skin="#efc5a5", dark="#17172a";
  c.fillStyle="#05071180";c.beginPath();c.ellipse(0,5,37,9,0,0,Math.PI*2);c.fill();
  c.globalAlpha*=.65;c.fillStyle=f.data.glow;c.beginPath();c.ellipse(0,-78,31+Math.sin(phase*5)*4,54,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
  const stride=moving?Math.sin(phase*12)*8:0;
  c.lineCap="round";c.lineWidth=13;c.strokeStyle=dark;
  c.beginPath();c.moveTo(-10,-58);c.lineTo(-13-stride,-17);c.stroke();
  c.beginPath();c.moveTo(10,-58);c.lineTo(13+stride,-17);c.stroke();
  c.strokeStyle=col;c.lineWidth=8;c.beginPath();c.moveTo(-13-stride,-17);c.lineTo(-23-stride,-10);c.stroke();
  c.beginPath();c.moveTo(13+stride,-17);c.lineTo(23+stride,-10);c.stroke();
  if(f.action==="kick"){c.strokeStyle=col;c.lineWidth=12;c.beginPath();c.moveTo(10,-58);c.lineTo(47,-37);c.stroke();c.strokeStyle=skin;c.lineWidth=9;c.beginPath();c.moveTo(47,-37);c.lineTo(62,-34);c.stroke();}
  c.fillStyle=col;c.beginPath();c.moveTo(-23,-108);c.lineTo(22,-108);c.lineTo(29,-59);c.lineTo(-28,-59);c.closePath();c.fill();
  c.fillStyle="#ffffff35";c.beginPath();c.moveTo(-13,-103);c.lineTo(0,-103);c.lineTo(7,-65);c.lineTo(-8,-65);c.closePath();c.fill();
  c.fillStyle=dark;c.fillRect(-25,-66,51,7);
  c.fillStyle=skin;c.beginPath();c.ellipse(0,-130,20,24,0,0,Math.PI*2);c.fill();
  c.fillStyle=dark;c.beginPath();c.moveTo(-21,-137);c.lineTo(-25,-157);c.lineTo(-12,-149);c.lineTo(-5,-166);c.lineTo(4,-151);c.lineTo(17,-160);c.lineTo(23,-137);c.lineTo(11,-143);c.lineTo(2,-137);c.lineTo(-8,-143);c.closePath();c.fill();
  c.fillStyle="#fff";c.fillRect(-12,-132,8,4);c.fillRect(5,-132,8,4);
  c.fillStyle="#20203a";c.fillRect(-9,-132,4,4);c.fillRect(8,-132,4,4);
  c.strokeStyle="#8c4e4a";c.lineWidth=2;c.beginPath();c.moveTo(-4,-117);c.lineTo(5,-117);c.stroke();
  const reach=attacking?(f.action==="kick"?58:f.action==="grab"?48:39)+lean:f.guard?9:moving?24+Math.sin(phase*12)*7:19;
  c.lineCap="round";c.strokeStyle=col;c.lineWidth=12;c.beginPath();c.moveTo(17,-99);c.lineTo(reach,-91);c.stroke();
  c.strokeStyle=skin;c.lineWidth=9;c.beginPath();c.moveTo(reach,-91);c.lineTo(reach+13,-87);c.stroke();
  c.strokeStyle=col;c.lineWidth=11;c.beginPath();c.moveTo(-17,-99);c.lineTo(f.action==="grab"?-49:-29,-78+(f.guard?-17:0));c.stroke();
  c.strokeStyle=skin;c.lineWidth=8;c.beginPath();c.moveTo(f.action==="grab"?-49:-29,-78+(f.guard?-17:0));c.lineTo(f.action==="grab"?-62:-34,-70+(f.guard?-17:0));c.stroke();
  if(f.action==="super"||f.action==="bossSuper"){c.shadowColor=f.data.glow;c.shadowBlur=32;c.fillStyle=f.data.glow;c.beginPath();c.arc(reach+22,-88,(f.action==="bossSuper"?28:16)+Math.sin(phase*20)*5,0,Math.PI*2);c.fill();c.shadowBlur=0;}
  if(f.guard){c.strokeStyle="#78eaff";c.lineWidth=4;c.beginPath();c.arc(0,-88,48,-1.2,1.2);c.stroke();}
  if(f.combo>1&&f.comboAge<.65){c.fillStyle="#fff";c.font="700 13px Rajdhani";c.textAlign="center";c.fillText("×"+f.combo,0,-184);}
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
  if((player.action==="super"||player.action==="bossSuper")&&player.actionTime>0){ctx.fillStyle=player.data.glow;ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(player.x+player.facing*90,315,85,17,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}
function loop(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);draw();raf=requestAnimationFrame(loop);}
document.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["arrowleft","arrowright","arrowup"," "].includes(k))e.preventDefault();keys.add(k);});
document.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll("[data-key]").forEach(b=>{
  const k=b.dataset.key;const down=e=>{e.preventDefault();keys.add(k);b.classList.add("active");};const up=e=>{e.preventDefault();keys.delete(k);b.classList.remove("active");};
  b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up);b.addEventListener("lostpointercapture",up);
});
$("super-button").addEventListener("click",()=>{if(player&&canUseSuper(player.energy)){keys.add("l");}});\n$("start-button").addEventListener("click",startGame);$("back-button").addEventListener("click",backToMenu);
$("pause-button").addEventListener("click",()=>{paused=!paused;$("pause-button").textContent=paused?"▶ RESUME":"Ⅱ PAUSE";});
$("rematch-button").addEventListener("click",()=>{if(player&&cpu){player.health=cpu.health=100;player.energy=cpu.energy=0;player.x=290;cpu.x=810;roundWins=[0,0];elapsed=0;timer=60;roundOver=false;paused=false;$("round-banner").classList.add("hidden");$("super-button").disabled=true;$("super-button").classList.remove("ready");}});
