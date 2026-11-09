import { mkdir, writeFile } from "node:fs/promises";

// Original anime-fighter atlas generator. Each atlas is 8 columns x 6 rows:
// idle, punch, kick, jump, hit, guard. Artwork is authored as layered vector
// illustration so it stays crisp at game and roster sizes.
const fighters = [
 {id:"ember",name:"Ember Ronin",hair:"#f18b73",hair2:"#ffd0a7",coat:"#a92f3c",trim:"#ffbd67",skin:"#f4c5ad",pants:"#25253a",style:"spiky",weapon:"katana",accent:"#ff754d"},
 {id:"mirage",name:"Mirage",hair:"#c6b5ef",hair2:"#f4e9ff",coat:"#55458f",trim:"#a9d8ff",skin:"#f2cbbd",pants:"#24213b",style:"long",weapon:"ribbon",accent:"#9b8cff"},
 {id:"coil",name:"Iron Coil",hair:"#e8d18c",hair2:"#fff0bd",coat:"#315c73",trim:"#54e5df",skin:"#dba98f",pants:"#202c3b",style:"undercut",weapon:"gauntlet",accent:"#42d9df"},
 {id:"astral",name:"Oracle Zero",hair:"#8b9be7",hair2:"#dce4ff",coat:"#353a78",trim:"#f0d8ff",skin:"#f1cbbb",pants:"#242342",style:"halo",weapon:"orb",accent:"#a98bff"},
 {id:"tide",name:"Tidebound",hair:"#4fcbb9",hair2:"#c0fff0",coat:"#176e72",trim:"#9bf4e1",skin:"#e9bd9e",pants:"#183c4b",style:"wave",weapon:"twinblades",accent:"#4ce6d0"},
 {id:"dusk",name:"Night Vow",hair:"#55456e",hair2:"#c6a4f4",coat:"#392747",trim:"#d69aff",skin:"#e4b9a8",pants:"#171727",style:"horn",weapon:"claws",accent:"#bd70f6"},
 {id:"glyph",name:"Sigil Forge",hair:"#d58c4d",hair2:"#ffe0a1",coat:"#77502d",trim:"#ffd36e",skin:"#edc3a5",pants:"#3d2c27",style:"braid",weapon:"runes",accent:"#f5b64f"},
 {id:"meteor",name:"Comet Saint",hair:"#eee5ce",hair2:"#ffffff",coat:"#e6e6f0",trim:"#94d9ff",skin:"#f0c7ac",pants:"#34435c",style:"crown",weapon:"staff",accent:"#83cfff"}
];
const W=192,H=192,COLS=8,ROWS=6;
const esc=s=>s;
function frame(f,row,n){
 const t=n/7, bob=row===0?Math.sin(t*Math.PI*2)*2:0;
 const punch=row===1?[0,8,22,38,48,35,14,0][n]:0;
 const kick=row===2?[0,4,12,25,38,32,15,0][n]:0;
 const jump=row===3?[0,10,23,34,38,30,15,0][n]:0;
 const recoil=row===4?[0,7,15,20,16,10,4,0][n]:0;
 const guard=row===5;
 const y=jump*-1+bob, lean=row===4?recoil*.45:row===1?2:0;
 const armA=row===1?[72+punch,88]:row===2?[68,82]:guard?[66,69]:[66,91];
 const armB=row===1?[135,75]:row===2?[145,62]:guard?[124,69]:[126+punch*.5,91];
 const legA=row===2?[56,153-kick*.8]:[73,153+jump*.35];
 const legB=row===2?[143+kick,143-kick*.55]:[119,153-jump*.2];
 const hairBack=f.style==="long"||f.style==="wave"||f.style==="braid"
  ? `<path d="M62 52 Q35 76 47 133 Q55 151 65 129 L76 76 M123 48 Q157 78 145 132 Q136 151 127 122 L116 74" fill="${f.hair}" stroke="#17182b" stroke-width="5"/>`
  : `<path d="M61 54 Q48 18 82 17 Q112 4 133 31 L128 71 L116 56 L75 67Z" fill="${f.hair}" stroke="#17182b" stroke-width="5"/>`;
 let fringe;
 if(f.style==="spiky") fringe='<path d="M60 48L48 18 76 32 83 5 101 30 126 13 132 51 112 44 98 56 81 44Z"/>';
 else if(f.style==="long"||f.style==="wave") fringe='<path d="M57 50Q48 10 91 12Q132 8 135 49L117 42 107 60 91 43 76 61 68 42Z"/>';
 else if(f.style==="braid") fringe='<path d="M57 50Q51 12 90 11Q132 9 134 50L116 43 103 57 91 42 75 58 68 42Z"/>';
 else if(f.style==="crown") fringe='<path d="M58 49L49 19 78 33 92 8 106 32 135 17 130 51 112 44 95 57 78 44Z"/>';
 else if(f.style==="halo") fringe='<path d="M58 49Q52 13 90 11Q130 11 134 49L115 41 104 58 91 42 76 58 68 41Z"/>';
 else fringe='<path d="M58 50L50 18 78 31 91 8 105 31 134 17 130 52 112 43 96 58 78 44Z"/>';
 const legs=`<path d="M79 125 L${legA[0]} ${legA[1]} L${legA[0]-8} 164 L${legA[0]-23} 166 L${legA[0]-12} 151 L70 130Z M111 125 L${legB[0]} ${legB[1]} L${legB[0]+9} 164 L${legB[0]-8} 166 L${legB[0]-8} 151 L101 131Z" fill="${f.pants}" stroke="#17182b" stroke-width="5" stroke-linejoin="round"/>`;
 const boots=`<path d="M${legA[0]-23} 163q14 -7 25 1l-2 9h-28Z M${legB[0]-8} 163q14 -7 25 1l3 9h-29Z" fill="#171a2c" stroke="#090d19" stroke-width="3"/>`;
 const torso=`<path d="M72 ${75+y} Q94 ${65+y} 119 ${76+y} L132 ${122+y} Q96 ${139+y} 59 ${122+y}Z" fill="${f.coat}" stroke="#17182b" stroke-width="5"/><path d="M93 ${76+y}L95 ${127+y} M72 ${91+y}Q95 ${103+y} 122 ${90+y}" fill="none" stroke="${f.trim}" stroke-width="5"/><path d="M67 ${119+y}Q96 ${129+y} 126 ${118+y}L121 ${132+y}Q96 ${142+y} 71 ${132+y}Z" fill="#202238" stroke="#17182b" stroke-width="3"/><path d="M87 ${88+y}l8 9 8-9" fill="none" stroke="${f.trim}" stroke-width="3"/>`;
 const arms=`<path d="M70 ${83+y} Q${armA[0]-10} ${armA[1]-18+y} ${armA[0]} ${armA[1]+y}" fill="none" stroke="#17182b" stroke-width="19" stroke-linecap="round"/><path d="M70 ${83+y} Q${armA[0]-10} ${armA[1]-18+y} ${armA[0]} ${armA[1]+y}" fill="none" stroke="${f.coat}" stroke-width="13" stroke-linecap="round"/><path d="M121 ${83+y} Q${armB[0]+4} ${armB[1]-14+y} ${armB[0]} ${armB[1]+y}" fill="none" stroke="#17182b" stroke-width="19" stroke-linecap="round"/><path d="M121 ${83+y} Q${armB[0]+4} ${armB[1]-14+y} ${armB[0]} ${armB[1]+y}" fill="none" stroke="${f.coat}" stroke-width="13" stroke-linecap="round"/><circle cx="${armA[0]}" cy="${armA[1]+y}" r="8" fill="${f.skin}" stroke="#17182b" stroke-width="3"/><circle cx="${armB[0]}" cy="${armB[1]+y}" r="8" fill="${f.skin}" stroke="#17182b" stroke-width="3"/>`;
 const head=`<rect x="85" y="48" width="22" height="27" rx="8" fill="${f.skin}" stroke="#17182b" stroke-width="3"/><ellipse cx="96" cy="43" rx="29" ry="34" fill="${f.skin}" stroke="#17182b" stroke-width="4"/><g fill="${f.hair}" stroke="#17182b" stroke-width="5" stroke-linejoin="round">${fringe}</g><path d="M68 46Q78 39 88 45 M103 45Q114 39 123 46" fill="none" stroke="#36263b" stroke-width="3"/><ellipse cx="82" cy="53" rx="7" ry="5" fill="#fff"/><ellipse cx="109" cy="53" rx="7" ry="5" fill="#fff"/><ellipse cx="84" cy="53" rx="3.5" ry="4" fill="#29324c"/><ellipse cx="107" cy="53" rx="3.5" ry="4" fill="#29324c"/><circle cx="85" cy="52" r="1.4" fill="#fff"/><circle cx="108" cy="52" r="1.4" fill="#fff"/><path d="M92 68q5 3 10 0" fill="none" stroke="#a85e67" stroke-width="2.5"/>`;
 let prop="";
 if(f.weapon==="katana") prop=`<path d="M${armB[0]+4} ${armB[1]-4+y}L${armB[0]+42} ${armB[1]-65+y}" stroke="#e9f4ff" stroke-width="7" stroke-linecap="round"/><path d="M${armB[0]-4} ${armB[1]+3+y}l17 -8" stroke="${f.trim}" stroke-width="7"/>`;
 if(f.weapon==="orb") prop=`<circle cx="148" cy="60" r="13" fill="${f.accent}" opacity=".8"/><circle cx="148" cy="60" r="20" fill="none" stroke="${f.trim}" stroke-width="2"/>`;
 if(f.weapon==="staff") prop=`<path d="M145 39L151 161" stroke="#d9e9ff" stroke-width="7"/><circle cx="144" cy="34" r="11" fill="${f.accent}" stroke="#fff" stroke-width="3"/>`;
 if(f.weapon==="gauntlet") prop=`<path d="M${armB[0]-8} ${armB[1]-5+y}l21 -7 7 17 -20 8Z" fill="${f.accent}" stroke="#172239" stroke-width="3"/>`;
 if(f.weapon==="runes") prop=`<path d="M146 51l8 10 -8 10 -8 -10Z" fill="none" stroke="${f.trim}" stroke-width="4"/>`;
 if(f.weapon==="twinblades"||f.weapon==="claws"||f.weapon==="ribbon") prop=`<path d="M${armB[0]+3} ${armB[1]+y}q28 -30 37 -52" fill="none" stroke="${f.accent}" stroke-width="5" stroke-linecap="round"/>`;
 const aura=(row===1||row===2||row===3)&&n>1&&n<6?`<path d="M140 85q35 -26 42 2q-19 -3 -29 22" fill="none" stroke="${f.accent}" stroke-width="5" opacity=".75"/>`:"";
 const accessory=f.style==="halo"?`<ellipse cx="96" cy="16" rx="31" ry="6" fill="none" stroke="${f.trim}" stroke-width="4"/>`:f.style==="braid"?`<path d="M128 49q26 25 8 60q-7 10 -14 2" fill="none" stroke="${f.hair2}" stroke-width="9"/>`:f.style==="horn"?`<path d="M72 25L58 3l26 16 M117 24l18 -20 -2 29" fill="${f.hair2}" stroke="#17182b" stroke-width="4"/>`:"";
 const flash=(row===4)?`<path d="M43 61l-14 -9m18 28l-19 0m121 -23l14 -9" stroke="#fff" stroke-width="4" opacity=".7"/>`:"";
 return `<g><ellipse cx="96" cy="174" rx="43" ry="7" fill="#080c18" opacity=".32"/>${aura}${hairBack}${legs}${boots}${torso}${arms}${prop}${head}${accessory}${flash}</g>`;
}
await mkdir("assets/fighters",{recursive:true});
for(const f of fighters){
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W*COLS}" height="${H*ROWS}" viewBox="0 0 ${W*COLS} ${H*ROWS}"><title>${f.name} anime fighting game sprite atlas</title>`];
 for(let row=0;row<ROWS;row++)for(let n=0;n<COLS;n++)parts.push(`<g transform="translate(${n*W} ${row*H})">${frame(f,row,n)}</g>`);
 parts.push("</svg>");
 await writeFile(`assets/fighters/${f.id}.svg`,parts.join(""));
}
console.log("Generated 8 detailed anime fighter atlases: 8 frames x 6 animations each.");
