import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const PALETTES = {
  ember: { skin:"#d9a17f", hair:"#f4a34c", cloth:"#263c58", trim:"#ffb84f", accent:"#ff613d", hairStyle:"crest" },
  mirage:{ skin:"#a96f52", hair:"#d7d4c7", cloth:"#354b7b", trim:"#92d7ff", accent:"#735cff", hairStyle:"flow" },
  coil:  { skin:"#e0b18e", hair:"#253044", cloth:"#a53c45", trim:"#f0d4a2", accent:"#ff775d", hairStyle:"spikes" },
  astral:{ skin:"#e5c3a4", hair:"#202b4b", cloth:"#20243d", trim:"#a8c9ff", accent:"#77a7ff", hairStyle:"long" },
  tide:  { skin:"#bd8b6d", hair:"#1d4d4a", cloth:"#276b68", trim:"#b7f3d6", accent:"#52dfc2", hairStyle:"bob" },
  dusk:  { skin:"#c58d77", hair:"#2a263a", cloth:"#40324d", trim:"#e2a4c9", accent:"#b66cff", hairStyle:"spikes", weapon:"greatblade" },
  glyph: { skin:"#e4b995", hair:"#6b563c", cloth:"#826b42", trim:"#f1dc91", accent:"#e6a947", hairStyle:"tied" },
  meteor:{ skin:"#9e725c", hair:"#eee0bd", cloth:"#d7d5d0", trim:"#e9b94e", accent:"#fff0a8", hairStyle:"short" }
};

const FIGHTER_META = {
  ember:{ height:1.92, build:1.02, shoulder:1.0, cape:false, headgear:"band" },
  mirage:{ height:1.82, build:.88, shoulder:.86, cape:true, headgear:"hood" },
  coil:{ height:1.9, build:1.18, shoulder:1.18, cape:false, headgear:"none" },
  astral:{ height:1.94, build:.92, shoulder:.92, cape:true, headgear:"visor" },
  tide:{ height:1.84, build:.94, shoulder:.94, cape:false, headgear:"none" },
  dusk:{ height:2.02, build:1.12, shoulder:1.12, cape:true, headgear:"none" },
  glyph:{ height:1.78, build:.9, shoulder:.9, cape:false, headgear:"goggles" },
  meteor:{ height:1.88, build:1.05, shoulder:1.05, cape:false, headgear:"scarf" }
};

const hex = (v) => new THREE.Color(v);
function mat(color, roughness=.65, metalness=.05, emissive=null) {
  return new THREE.MeshStandardMaterial({color,roughness,metalness, ...(emissive?{emissive:color,emissiveIntensity:.32}:{})});
}
function mesh(geometry, material, parent, x=0,y=0,z=0) {
  const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function limb(parent, material, length, radius, x, y, z, angle=0) {
  const pivot=new THREE.Group();pivot.position.set(x,y,z);pivot.rotation.z=angle;parent.add(pivot);
  mesh(new THREE.CapsuleGeometry(radius,length,5,9),material,pivot,0,-length*.34,0);
  const joint=mesh(new THREE.SphereGeometry(radius*1.08,12,10),material,pivot,0,-length*.68,0);
  return pivot;
}
function makeFighter(id) {
  const p=PALETTES[id]||PALETTES.ember, meta=FIGHTER_META[id]||FIGHTER_META.ember;
  const root=new THREE.Group(), body=new THREE.Group();root.add(body);
  const skin=mat(p.skin), cloth=mat(p.cloth), trim=mat(p.trim,.38,.24), hair=mat(p.hair,.52,.04), dark=mat("#182033"), accent=mat(p.accent,.25,.28,p.accent);
  const scale=meta.height/1.9;body.scale.setScalar(scale);
  // Legs, layered boots and articulated joints.
  const legs=[];
  for(const side of [-1,1]){
    const leg=limb(body,cloth,.62,.135,side*.19,-.47,0,side*.04);legs.push(leg);
    mesh(new THREE.CapsuleGeometry(.14,.22,4,8),dark,leg,0,-.52,.015);
    mesh(new THREE.BoxGeometry(.29,.15,.42),trim,leg,0,-.68,.12);
    mesh(new THREE.BoxGeometry(.2,.045,.43),dark,leg,0,-.59,.13);
    mesh(new THREE.SphereGeometry(.145,12,10),skin,body,side*.19,-.9,0);
  }
  // Torso with chest plate, collar, waist wrap and asymmetric panels.
  const torso=mesh(new THREE.CapsuleGeometry(.34*meta.build,.62,7,14),cloth,body,0,.12,0);
  torso.scale.set(meta.shoulder,1,.72);
  mesh(new THREE.BoxGeometry(.68*meta.shoulder,.13,.48),trim,body,0,.47,.015);
  mesh(new THREE.BoxGeometry(.52,.09,.52),dark,body,0,-.28,.01);
  mesh(new THREE.BoxGeometry(.2,.22,.08),accent,body,0,.02,.275);
  // Layered anime battle costume: chest piping, waist sash, shoulder guards and split coat panels.
  const sash=mesh(new THREE.BoxGeometry(.76,.105,.57),trim,body,0,-.205,.015);sash.rotation.z=-.08;
  mesh(new THREE.BoxGeometry(.16,.16,.035),accent,body,.19,-.205,.315).rotation.z=.2;
  for(const side of [-1,1]){
    const pauldron=mesh(new THREE.SphereGeometry(.19,14,10),trim,body,side*.43,.43,.015);pauldron.scale.set(1.25,.72,.92);
    const panel=mesh(new THREE.BoxGeometry(.2,.52,.07),cloth,body,side*.23,-.51,.16);panel.rotation.z=side*.12;
    mesh(new THREE.BoxGeometry(.205,.045,.08),accent,body,side*.23,-.34,.205);
  }
  for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.055,.22,.025),trim,body,-.16+i*.16,.08,.292);
  // Arms with oversized cuffs and articulated forearms.
  const arms=[],forearms=[];
  for(const side of [-1,1]){
    const arm=limb(body,cloth,.48,.115,side*.43,.39,0,side*.23);arms.push(arm);
    const forearm=limb(arm,skin,.34,.09,0,-.29,.01,0);forearms.push(forearm);
    mesh(new THREE.TorusGeometry(.125,.035,8,14),trim,arm,0,-.49,.015);
    mesh(new THREE.SphereGeometry(.12,12,10),skin,arm,0,-.62,.015);
    mesh(new THREE.BoxGeometry(.24,.1,.27),dark,arm,0,-.72,.02);
  }
  // Head, face, nose, eyes and brows.
  const head=new THREE.Group();head.position.set(0,.88,.015);body.add(head);
  const face=mesh(new THREE.SphereGeometry(.265,28,24),skin,head,0,0,0);face.scale.set(.88,1.12,.86);
  mesh(new THREE.SphereGeometry(.045,12,10),skin,head,0,-.055,.222);
  const eyes=[],brows=[];
  for(const side of [-1,1]){
    const eye=mesh(new THREE.SphereGeometry(.041,14,10),mat("#fffaf1"),head,side*.095,.045,.222);eye.scale.set(1.15,.68,.42);eyes.push(eye);
    const iris=mesh(new THREE.SphereGeometry(.021,12,10),mat("#26324c"),head,side*.095,.045,.242);iris.scale.set(.9,1.1,.5);
    mesh(new THREE.SphereGeometry(.009,8,8),mat("#ffffff"),head,side*.091,.052,.253);
    const brow=mesh(new THREE.BoxGeometry(.085,.022,.026),hair,head,side*.095,.112,.218);brow.rotation.z=side*.1;brows.push(brow);
  }
  const mouth=mesh(new THREE.SphereGeometry(.052,14,10),dark,head,0,-.135,.215);mouth.scale.set(.78,.16,.25);
  const mouthLine=mesh(new THREE.BoxGeometry(.09,.012,.015),mat("#713f45"),head,0,-.132,.239);
  const nose=mesh(new THREE.SphereGeometry(.026,10,8),skin,head,0,-.045,.245);nose.scale.set(.75,1,.6);
  // Signature hair silhouettes are original and deliberately varied.
  if(p.hairStyle==="crest"||p.hairStyle==="spikes"){
    const count=p.hairStyle==="crest"?7:9;
    for(let i=0;i<count;i++){
      const a=(i/(count-1))*Math.PI*.94+Math.PI*.03;
      const spike=mesh(new THREE.ConeGeometry(.105+(i%2)*.025,.38+(i%3)*.07,7),hair,head,Math.cos(a)*.19,.22+Math.sin(a)*.12,.015);
      spike.rotation.z=-Math.cos(a)*.55;spike.rotation.x=Math.sin(a)*.25;
    }
  } else if(p.hairStyle==="flow"||p.hairStyle==="long"){
    mesh(new THREE.SphereGeometry(.27,18,14),hair,head,0,.105,-.035).scale.set(1.03,.55,1.02);
    for(let i=0;i<5;i++){
      const strand=mesh(new THREE.ConeGeometry(.075,.58,7),hair,head,(i-2)*.09,-.22,-.1);
      strand.rotation.x=-.22;strand.rotation.z=(i-2)*.1;
    }
    if(p.hairStyle==="flow")mesh(new THREE.CapsuleGeometry(.09,.45,4,8),hair,head,.23,-.23,-.12).rotation.z=-.2;
  } else if(p.hairStyle==="bob"){
    mesh(new THREE.SphereGeometry(.27,18,14),hair,head,0,.1,-.04).scale.set(1.04,.62,1.04);
    for(const side of [-1,1])mesh(new THREE.ConeGeometry(.09,.42,8),hair,head,side*.22,-.16,-.02).rotation.z=-side*.2;
  } else {
    mesh(new THREE.SphereGeometry(.26,18,14),hair,head,0,.13,-.035).scale.set(1,.52,.96);
    if(p.hairStyle==="tied"){const knot=mesh(new THREE.SphereGeometry(.09,12,10),accent,head,0,.32,-.16);knot.scale.set(1,1.5,1);}
  }
  // Character-specific accessories.
  if(meta.headgear==="band")mesh(new THREE.BoxGeometry(.48,.055,.12),trim,head,0,.16,.19);
  if(meta.headgear==="visor"){const visor=mesh(new THREE.BoxGeometry(.47,.095,.12),accent,head,0,.065,.2);visor.rotation.x=-.12;}
  if(meta.headgear==="hood"){mesh(new THREE.SphereGeometry(.3,16,12),cloth,head,0,.06,-.12).scale.set(1.12,1.15,.62);}
  if(meta.headgear==="goggles"){mesh(new THREE.TorusGeometry(.095,.025,8,16),trim,head,-.095,.05,.22);mesh(new THREE.TorusGeometry(.095,.025,8,16),trim,head,.095,.05,.22);}
  if(meta.headgear==="scarf"){mesh(new THREE.CapsuleGeometry(.07,.55,4,8),accent,head,.27,-.13,-.03).rotation.z=-.8;}
  if(meta.cape){const cape=mesh(new THREE.BoxGeometry(.72,.92,.07),mat(p.cloth,.9),body,0,.05,-.25);cape.rotation.x=-.12;cape.rotation.z=.06;}
  // Original character silhouettes use no weapon props.
  // Glowing shoulder/hip details and a subtle aura ring.
  for(const side of [-1,1]){
    mesh(new THREE.SphereGeometry(.105,12,10),accent,body,side*.42,.42,.015);
    mesh(new THREE.TorusGeometry(.16,.025,7,18),trim,body,side*.22,-.29,.01).rotation.x=Math.PI/2;
  }
  const aura=new THREE.Mesh(new THREE.SphereGeometry(1.18,20,16),new THREE.MeshBasicMaterial({color:p.accent,transparent:true,opacity:.055,side:THREE.BackSide}));
  aura.position.y=.08;body.add(aura);
  root.userData={id,body,arms,forearms,legs,aura,head,eyes,brows,mouth,mouthLine,accent:p.accent,baseY:0,baseScale:scale};
  return root;
}

function makeArena(scene, type) {
  const group=new THREE.Group();scene.add(group);
  const floorMat=mat(type==="temple"?"#33445e":type==="dojo"?"#422c40":"#18233f",.86,.12);
  const floor=mesh(new THREE.CylinderGeometry(8.7,9.1,.32,8),floorMat,group,0,-.22,0);floor.rotation.y=Math.PI/8;
  const platform=mesh(new THREE.CylinderGeometry(8.45,8.45,.12,8),mat("#687b9e",.45,.45),group,0,-.02,0);platform.rotation.y=Math.PI/8;
  const grid=new THREE.GridHelper(17,34,"#85a4d7","#35456c");grid.position.y=.05;group.add(grid);
  const ring=mesh(new THREE.TorusGeometry(6.2,.025,8,100),mat("#a4c6ed",.35,.4),group,0,.055,0);ring.rotation.x=Math.PI/2;
  const ring2=mesh(new THREE.TorusGeometry(3.4,.018,8,100),mat("#6d8cbf",.35,.4),group,0,.06,0);ring2.rotation.x=Math.PI/2;
  const centerSigil=mesh(new THREE.TorusGeometry(1.05,.035,8,64),mat(type==="temple"?"#9ce8ff":type==="dojo"?"#ff9a80":"#8bcaff",.25,.45),group,0,.065,0);centerSigil.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const rune=mesh(new THREE.BoxGeometry(.055,.018,.62),mat(i%2?"#7da7d8":"#e4b66c",.35,.35),group,Math.cos(i*Math.PI/4)*4.8,.065,Math.sin(i*Math.PI/4)*4.8);rune.rotation.y=-i*Math.PI/4;}
  const back=mat(type==="temple"?"#7086a8":type==="dojo"?"#57344b":"#293b67",.8,.15);
  for(let i=0;i<13;i++){
    const x=(i-6)*1.55, height=1.5+(i*7%5)*.55;
    const tower=mesh(new THREE.BoxGeometry(.78,height,.72),back,group,x,height/2-0.08,-5.7-(i%3)*.55);
    mesh(new THREE.BoxGeometry(.92,.1,.84),mat("#c0a66c",.5,.3),group,x,height-.1,-5.7-(i%3)*.55);
    if(i%2===0){const light=mesh(new THREE.BoxGeometry(.12,.5,.04),mat("#83c9ff",.35,.2,"#83c9ff"),group,x,height*.48,-5.31-(i%3)*.55);light.material.emissiveIntensity=.65;}
  }
  for(const x of [-7.4,7.4]){
    const pillar=mesh(new THREE.CylinderGeometry(.3,.42,3.5,10),back,group,x,1.7,-2.9);
    mesh(new THREE.CylinderGeometry(.48,.48,.22,10),mat("#c5a96d",.5,.35),group,x,3.4,-2.9);
    mesh(new THREE.CylinderGeometry(.055,.055,2.7,8),mat(type==="dojo"?"#ff8b78":"#80dfff",.25,.25,type==="dojo"?"#ff8b78":"#80dfff"),group,x,1.8,-2.55);
  }
  // Distinct stage landmarks make each arena read as its own place.
  if(type==="temple"){
    for(let x=-5;x<=5;x+=10){
      const arch=mesh(new THREE.TorusGeometry(1.45,.12,10,32,Math.PI),mat("#d8c59a",.55,.25),group,x,2.1,-6.3);arch.rotation.z=Math.PI;
      mesh(new THREE.BoxGeometry(.24,3.2,.24),mat("#c4b28d",.6,.12),group,x-1.35,1.45,-6.3);
      mesh(new THREE.BoxGeometry(.24,3.2,.24),mat("#c4b28d",.6,.12),group,x+1.35,1.45,-6.3);
    }
  }else if(type==="dojo"){
    for(let x=-6;x<=6;x+=3){
      const banner=mesh(new THREE.BoxGeometry(.8,2.1,.08),mat("#792f45",.8,.05),group,x,3.2,-6.8);
      mesh(new THREE.BoxGeometry(.48,.08,.1),mat("#e7b878",.4,.25),group,x,3.3,-6.72);
    }
  }else{
    for(let x=-6;x<=6;x+=2){
      const billboard=mesh(new THREE.BoxGeometry(1.25,.62,.12),mat("#233f76",.35,.25,"#347dff"),group,x,3.25,-6.7);
      mesh(new THREE.BoxGeometry(.8,.07,.035),mat("#8feaff",.25,.15,"#8feaff"),group,x,3.25,-6.61);
    }
  }
  const sky=new THREE.Mesh(new THREE.SphereGeometry(45,24,16),new THREE.MeshBasicMaterial({color:type==="temple"?"#182b4c":type==="dojo"?"#281b36":"#0c1731",side:THREE.BackSide}));
  group.add(sky);
  // Floating light shards add depth without heavy particle counts.
  for(let i=0;i<26;i++){
    const shard=mesh(new THREE.OctahedronGeometry(.045+(i%3)*.025),mat(i%2?"#70bfff":"#ffb86b",.3,.3,i%2?"#70bfff":"#ffb86b"),group,Math.sin(i*8)*7,.6+(i%6)*.55,-3.5-(i%5));
    shard.userData.floatOffset=i*.7;
  }
  return group;
}

export function createArena3D(container) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.domElement.className="arena-3d-canvas";renderer.domElement.setAttribute("aria-label","Three-dimensional fighting arena");
  container.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color("#0b1024");scene.fog=new THREE.Fog("#0b1024",15,32);
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,5.7,16.5);camera.lookAt(0,1.45,0);
  scene.add(new THREE.HemisphereLight("#b9d8ff","#1a1832",2.05));
  const key=new THREE.DirectionalLight("#fff0d8",3.1);key.position.set(-5,9,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-11;key.shadow.camera.right=11;key.shadow.camera.top=11;key.shadow.camera.bottom=-11;scene.add(key);
  const rim=new THREE.PointLight("#5e9cff",48,18);rim.position.set(5,4,-2);scene.add(rim);
  const warm=new THREE.PointLight("#ff7a56",30,16);warm.position.set(-6,3,2);scene.add(warm);
  let arenaRoot=makeArena(scene,"neon");
  const fighters=[makeFighter("ember"),makeFighter("coil")];fighters.forEach(f=>scene.add(f));
  const effects=[];
  function resize(){
    const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function setArena(type){
    scene.remove(arenaRoot);arenaRoot=makeArena(scene,type);
  }
  function setFighters(a,b){
    for(const f of fighters)scene.remove(f);
    fighters[0]=makeFighter(a);fighters[1]=makeFighter(b);
    fighters.forEach(f=>scene.add(f));
  }
  function burst(x,color){
    const group=new THREE.Group();scene.add(group);
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95}));
    group.add(core);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.045,8,36),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));ring.rotation.x=Math.PI/2;group.add(ring);
    group.position.set(x,1.25,.1);effects.push({group,life:.42,max:.42});
  }
  let previous=[null,null],cameraShake=0;
  function impactBurst(x,y,color){
    const group=new THREE.Group();scene.add(group);
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));
    group.add(core);
    for(let n=0;n<8;n++){
      const shard=new THREE.Mesh(new THREE.ConeGeometry(.035,.34,5),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95}));
      shard.rotation.z=n*Math.PI/4;shard.position.set(Math.cos(n*Math.PI/4)*.28,Math.sin(n*Math.PI/4)*.28,0);group.add(shard);
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.035,7,28),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));
    group.add(ring);group.position.set(x,y,.3);effects.push({group,life:.24,max:.24});cameraShake=Math.max(cameraShake,.24);
  }
  const smooth=(a,b,x)=>{const q=Math.max(0,Math.min(1,(x-a)/(b-a)));return q*q*(3-2*q);};
  function render(state){
    const list=[state.player,state.cpu];
    for(let i=0;i<2;i++){
      const f=list[i],model=fighters[i],d=model.userData;
      model.position.set((f.x-550)/92,Math.max(0,-f.y)/82,i===0?.35:-.35);
      model.rotation.y=f.facing>0?Math.PI/2:-Math.PI/2;
      const t=state.elapsed,move=Math.abs(f.vx)>.4,actionName=f.action||"idle";
      const durations={special:1.05,grab:.48,uppercut:.48,sweep:.55,jumpPunch:.34,jumpKick:.4,kick:.34,heavy:.38,attack:.27,combo:.34,triple:.55,double:.42,cross:.4,launcher:.5,finisher:.58,"double-heavy":.5};
      const phase=Math.max(0,Math.min(1,1-(f.actionTime||0)/(durations[actionName]||.34)));
      // Three-beat animation: anticipation, committed strike, then visible recovery.
      const windup=1-smooth(.0,.28,phase);
      const extension=smooth(.18,.48,phase)*(1-smooth(.62,.94,phase));
      const recoil=smooth(.58,1,phase);
      const pulse=Math.sin(phase*Math.PI);
      const punch=["attack","heavy","combo","uppercut","jumpPunch","triple","double","cross","launcher","finisher"].includes(actionName);
      const kick=["kick","sweep","jumpKick","double-heavy"].includes(actionName);
      const running=move&&["run","idle"].includes(actionName);
      d.body.rotation.set(0,0,0);
      d.body.rotation.z=actionName==="sweep"?.48*extension:actionName==="knockdown"?.9:actionName==="hit"?-.2:0;
      d.body.rotation.x=actionName==="uppercut"?-.28*extension:actionName==="jumpPunch"||actionName==="jumpKick"?-.24:actionName==="kick"?.12*extension:0;
      d.body.rotation.y=punch?-.18*extension+ .12*recoil:kick?.12*extension:0;
      d.body.position.y=actionName==="knockdown"?.07:(f.y>0?0:Math.abs(Math.sin(t*9+i))*(running?.055:.018));
      d.body.scale.y=d.baseScale*(f.crouch?.72:1);d.body.position.z=f.crouch?.08:0;
      // The lead fist drives forward while the rear hand protects the face.
      const jab=actionName==="attack"||actionName==="combo";
      const power=actionName==="heavy"||actionName==="triple"||actionName==="finisher";
      const leadReach=(jab?1.15:power?1.55:1.32);
      d.arms[0].rotation.x=punch?(actionName==="uppercut"?-2.25*extension-.35*windup:-leadReach*extension+.38*windup):actionName==="grab"?-.9*extension:actionName==="special"?-1.75*pulse:f.guard?-.95:running?Math.sin(t*13+i)*.32:0;
      d.arms[1].rotation.x=punch?-.72+.28*extension:actionName==="grab"?-1.2*extension:actionName==="special"?-1.5*pulse:f.guard?-1.05:running?Math.sin(t*13+i+Math.PI)*.32:0;
      d.arms[0].rotation.z=actionName==="grab"?.42*extension:power?-.18*extension:0;
      d.arms[1].rotation.z=f.guard?.18:0;
      d.forearms[0].rotation.x=punch?-.25*extension:0;d.forearms[1].rotation.x=f.guard?-.35:0;
      // Kicks chamber the knee, snap the lower leg out, then retract; sweeps stay low.
      const highKick=actionName==="kick"||actionName==="jumpKick"||actionName==="double-heavy";
      d.legs[0].rotation.set(0,0,0);d.legs[1].rotation.set(0,0,0);
      d.legs[0].rotation.x=actionName==="sweep"?1.45*extension:highKick?-1.65*extension+.35*windup:running?Math.sin(t*13+i)*.48:0;
      d.legs[1].rotation.x=actionName==="sweep"?-.72*extension:highKick?.28*extension:running?Math.sin(t*13+i+Math.PI)*.48:0;
      d.legs[0].rotation.z=highKick?-.18*extension:0;
      d.legs[1].rotation.z=actionName==="sweep"?.28*extension:0;
      if(actionName==="jumpPunch"||actionName==="jumpKick"){d.body.position.y+=.16;d.legs[1].rotation.x=.55;}
      if(actionName==="special"){d.body.rotation.z=-.12*pulse;d.arms[0].rotation.x=-1.8*pulse;d.arms[1].rotation.x=-1.8*pulse;}
      if(actionName==="hit"){d.body.rotation.z=-.24*pulse;d.head.rotation.z=.16*pulse;}
      else if(actionName==="knockdown"){d.body.rotation.z=.9;d.head.rotation.z=-.22;}
      else d.head.rotation.z=actionName==="special"?.12*pulse:actionName==="uppercut"?-.12*extension:0;
      // Readable facial acting follows the move's anticipation and impact.
      const fierce=punch||kick||actionName==="special";
      const hurt=actionName==="hit"||actionName==="knockdown";
      d.brows[0].rotation.z=fierce?.38:hurt?-.18:.1;d.brows[1].rotation.z=fierce?-.38:hurt?.18:-.1;
      d.eyes.forEach(eye=>{eye.scale.y=f.guard?.48:hurt?.82:.68;});
      d.mouth.scale.y=actionName==="special"?.9:hurt?.58:f.guard?.12:fierce?.32:.2;
      d.mouthLine.visible=![ "special","hit","knockdown" ].includes(actionName);
      d.aura.material.opacity=actionName==="special"?.2:.055;
      if(actionName==="special"&&previous[i]!=="special")burst(model.position.x+(f.facing>0?.9:-.9),d.accent);
      if((actionName==="hit"||actionName==="knockdown")&&previous[i]!==actionName)impactBurst(model.position.x,model.position.y+1.1,d.accent);
      previous[i]=actionName;
    }
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=1/60;e.group.scale.multiplyScalar(1.035);e.group.children.forEach(c=>{c.material.opacity=Math.max(0,e.life/e.max);});if(e.life<=0){scene.remove(e.group);e.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});effects.splice(i,1);}}
    scene.children.forEach(o=>{if(o.userData?.floatOffset!==undefined)o.position.y=.6+(Math.sin(state.elapsed*1.2+o.userData.floatOffset)+1)*.35;});
    cameraShake=Math.max(0,cameraShake-.025);
    camera.position.x+=( (state.player.x+state.cpu.x)/2-550)/250-camera.position.x;camera.position.x*=.985;
    const cinematic=list.some(f=>f.action==="special");
    const actionCam=list.some(f=>["heavy","uppercut","sweep","finisher","launcher"].includes(f.action));
    camera.position.z+=((cinematic?12.8:actionCam?15.2:16.5)-camera.position.z)*.12;
    camera.position.y+=(5.7+(Math.random()-.5)*cameraShake-camera.position.y)*.18;
    camera.lookAt(0,1.42,0);renderer.render(scene,camera);
  }
  return {
    setArena, setFighters, render,
    dispose(){observer.disconnect();renderer.dispose();container.removeChild(renderer.domElement);}
  };
}
