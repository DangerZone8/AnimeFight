import { mkdir, writeFile } from "node:fs/promises";

const fighters = [
  ["ember","#e88b42","#ff9c55","#201d2a","#f3d1a5","spike"],
  ["mirage","#7b9bd9","#92d7ff","#242b4a","#e9c9b0","long"],
  ["coil","#b84e55","#ff775d","#30343b","#d9aa8b","crest"],
  ["astral","#a4b9ef","#77a7ff","#2a2850","#f1d9c9","halo"],
  ["tide","#37b78b","#52dfc2","#173b43","#d9b68e","wave"],
  ["dusk","#9a6cb8","#b66cff","#241c35","#d9b6a0","horn"],
  ["glyph","#c9a85c","#e6a947","#3d3025","#d7b18d","braid"],
  ["meteor","#e6d7b4","#fff0a8","#353b52","#f0c9a8","crown"]
];
const hair = {
  spike: '<path d="M62 46L51 8 78 25 91 -2 104 24 132 8 128 50Z"/>',
  long: '<path d="M62 46Q52 -3 96 -4Q140 -2 130 50L122 106 110 67 96 86 80 65 68 92Z"/>',
  crest: '<path d="M62 48L50 10 76 22 91 -4 105 23 133 8 128 50Z"/>',
  halo: '<path d="M62 47Q52 0 96 -5Q140 0 130 48L116 32 106 18 94 40 78 18Z"/><path d="M52 0Q96 -20 140 0" fill="none" stroke="#e7f1ff" stroke-width="5"/>',
  wave: '<path d="M60 47Q51 2 90 -5Q126 -10 137 27L119 22 105 46 88 27 72 56Z"/>',
  horn: '<path d="M62 48L47 5 78 22 92 -4 105 23 141 4 129 50Z"/>',
  braid: '<path d="M62 47Q51 0 95 -5Q138 -2 130 49L115 27 105 17 92 42 78 20Z"/><path d="M128 42Q158 68 132 105" fill="none" stroke-width="9"/>',
  crown: '<path d="M62 48L48 8 78 22 92 -5 106 22 138 5 129 50Z"/>'
};
const frames = 8, cell = 192, rows = 6;
function line(x1,y1,x2,y2,color,width=15) {
  return '<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="#171827" stroke-width="'+(width+5)+'" stroke-linecap="round"/><path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';
}
function fighterFrame(f,row,n) {
  const [id,coat,glow,hairColor,skin,style]=f;
  const bob=Math.round(Math.sin(n*Math.PI/4)*2);
  const lift=row===3?[0,8,18,30,34,26,12,0][n]:0;
  const punch=row===1?[0,5,18,34,38,24,8,0][n]:0;
  const kick=row===2?[0,4,14,28,40,34,16,0][n]:0;
  const recoil=row===4?[0,4,10,14,12,8,3,0][n]:0;
  let ax=143+punch, ay=83, lx=120+kick, ly=150-kick*.55;
  if(row===2){ax=145;ay=68;}
  if(row===3){ax=150;ay=57;lx=133;ly=139;}
  if(row===4){ax=153;ay=58;}
  if(row===5){ax=102;ay=58;}
  const armL=row===5?[91,63]:row===3?[43,58]:row===4?[42,65]:[48,95];
  const armR=row===5?[102,58]:row===3?[150,57]:row===4?[153,58]:[ax,ay];
  const baseY=125+bob-lift, shift=-recoil;
  const legs='<g>'+line(81+shift,baseY,72-recoil,158-lift+bob,coat,16)+line(109+shift,baseY,lx+shift,ly-lift+bob,coat,16)+
    '<path d="M57 '+(160-lift+bob)+'q14 -9 27 0l-2 10q-17 4-27-2Z M'+(lx-12)+' '+(ly-lift+bob)+'q14 -8 27 0l-2 10q-17 4-27-2Z" fill="#20243a" stroke="#171827" stroke-width="4"/></g>';
  const torso='<path d="M68 '+(72+bob-lift)+'L124 '+(72+bob-lift)+'L133 '+(119+bob-lift)+'L116 '+(135+bob-lift)+'L76 '+(135+bob-lift)+'L59 '+(118+bob-lift)+'Z" fill="'+coat+'" stroke="#171827" stroke-width="5"/>'+
    '<path d="M96 '+(75+bob-lift)+'L96 '+(130+bob-lift)+'M74 '+(91+bob-lift)+'q22 12 44 0" fill="none" stroke="'+glow+'" stroke-width="4"/>'+
    '<path d="M66 '+(115+bob-lift)+'L126 '+(115+bob-lift)+'L123 '+(124+bob-lift)+'L69 '+(124+bob-lift)+'Z" fill="#25283a" stroke="#171827" stroke-width="3"/><circle cx="96" cy="'+(119+bob-lift)+'" r="5" fill="'+glow+'"/>';
  const arms=line(65,81+bob-lift,armL[0]+shift,armL[1]+bob-lift,coat,14)+line(127,81+bob-lift,armR[0]+shift,armR[1]+bob-lift,coat,14)+
    '<circle cx="'+(armL[0]+shift)+'" cy="'+(armL[1]+bob-lift)+'" r="8" fill="'+skin+'" stroke="#171827" stroke-width="3"/><circle cx="'+(armR[0]+shift)+'" cy="'+(armR[1]+bob-lift)+'" r="8" fill="'+skin+'" stroke="#171827" stroke-width="3"/>';
  const head='<rect x="85" y="48" width="22" height="28" rx="8" fill="'+skin+'" stroke="#171827" stroke-width="4"/><ellipse cx="96" cy="43" rx="31" ry="35" fill="'+skin+'" stroke="#171827" stroke-width="5"/>'+
    '<g fill="'+hairColor+'" stroke="#171827" stroke-width="5" stroke-linejoin="round">'+hair[style]+'</g>'+
    '<path d="M76 45l12 -2m16 0l12 -2" stroke="#24243a" stroke-width="4" stroke-linecap="round"/><ellipse cx="84" cy="51" rx="5" ry="3" fill="#fff"/><ellipse cx="108" cy="51" rx="5" ry="3" fill="#fff"/><circle cx="86" cy="51" r="2.5" fill="#20243a"/><circle cx="110" cy="51" r="2.5" fill="#20243a"/><path d="M91 65q6 4 12 0" stroke="#8c4c4b" stroke-width="3" fill="none"/><path d="M66 35Q96 22 126 35" fill="none" stroke="'+glow+'" stroke-width="5"/>';
  const aura=(row===1||row===2||row===3)&&n>=2&&n<=5?'<path d="M139 75q25 -18 40 0q-18 0-27 20" fill="none" stroke="'+glow+'" stroke-width="5" opacity=".6"/>':'';
  const extras=id==="astral"?'<circle cx="96" cy="42" r="43" fill="none" stroke="'+glow+'" stroke-width="2" opacity=".65"/>':id==="glyph"?'<path d="M85 91l11 -8 11 8 -11 8Z" fill="none" stroke="'+glow+'" stroke-width="3"/>':id==="coil"?'<path d="M70 88q-20 10-9 29q12 12 23 0" fill="none" stroke="#d8e1ea" stroke-width="5"/>':id==="meteor"?'<path d="M74 28q22 -14 44 0" stroke="#fff" stroke-width="4" fill="none"/>':'';
  return '<g>'+aura+'<ellipse cx="96" cy="169" rx="43" ry="8" fill="#0a0d18" opacity=".22"/>'+legs+torso+arms+head+extras+'</g>';
}
await mkdir("assets/fighters",{recursive:true});
for(const f of fighters){
  const [id]=f, parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1152" viewBox="0 0 1536 1152"><title>'+id+' original anime fighter sprite atlas</title>'];
  for(let row=0;row<rows;row++)for(let n=0;n<frames;n++)parts.push('<g transform="translate('+(n*cell)+' '+(row*cell)+')">'+fighterFrame(f,row,n)+'</g>');
  parts.push('</svg>');
  await writeFile('assets/fighters/'+id+'.svg',parts.join(''));
}
console.log("Generated 8 original fighter atlases (8 frames x 6 animation rows each).");
