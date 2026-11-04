import * as T from "three";
import { getFighter } from "./data.js";
const materials = new Map();
export function material(color) {
  if (!materials.has(color))
    materials.set(
      color,
      new T.MeshLambertMaterial({ color, flatShading: true }),
    );
  materials.get(color).userData.shared = true;
  return materials.get(color);
}
export function mesh(
  parent,
  geometry,
  color,
  pos = [0, 0, 0],
  scale = [1, 1, 1],
) {
  const m = new T.Mesh(
    geometry,
    typeof color === "object" ? color : material(color),
  );
  m.position.set(...pos);
  m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function ellipsoid(parent, color, pos, scale, segments = 10) {
  return mesh(parent, new T.SphereGeometry(1, segments, 6), color, pos, scale);
}
export function box(parent, color, pos, size) {
  return mesh(parent, new T.BoxGeometry(...size), color, pos);
}
export function cylinder(parent, color, pos, top, bottom, height, sides = 8) {
  return mesh(
    parent,
    new T.CylinderGeometry(top, bottom, height, sides),
    color,
    pos,
  );
}
export function tube(parent, color, points, radius = 0.1, sides = 7) {
  return mesh(
    parent,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      Math.max(6, points.length * 3),
      radius,
      sides,
      false,
    ),
    color,
  );
}
export function group(parent, pos = [0, 0, 0]) {
  const g = new T.Group();
  g.position.set(...pos);
  parent.add(g);
  return g;
}
// Faceted tailored volumes use a shared human skeleton. `wings` remains the
// animation API's legacy name for the two shoulder joints; no bird parts remain.
function named(object, name, role = name) { object.name = name; object.userData.role = role; return object; }
function loft(parent, color, rings, sides = 10, name = 'tailored-volume') {
  const vertices = [], indices = [];
  for (const ring of rings) for (let i = 0; i < sides; i++) {
    const angle = i * Math.PI * 2 / sides;
    vertices.push(Math.cos(angle) * ring[1], ring[0], Math.sin(angle) * ring[2] + (ring[3] || 0));
  }
  for (let row = 0; row < rings.length - 1; row++) for (let i = 0; i < sides; i++) {
    const a = row * sides + i, b = row * sides + (i + 1) % sides, c = a + sides, d = b + sides;
    indices.push(a, c, b, b, c, d);
  }
  for (let i = 1; i < sides - 1; i++) indices.push(0, i, i + 1);
  const top = (rings.length - 1) * sides;
  for (let i = 1; i < sides - 1; i++) indices.push(top, top + i + 1, top + i);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return named(mesh(parent, geometry, color), name);
}
function panel(parent, color, points, z, depth = .035, name = 'cloth-panel') {
  const shape = new T.Shape(); points.forEach(([x,y],i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y));shape.closePath();
  return named(mesh(parent, new T.ExtrudeGeometry(shape, {depth, bevelEnabled:false, curveSegments:1}), color, [0,0,z]), name);
}
function humanFace(head, skin, id) {
  const width = id === 'chef' ? .35 : id === 'witch' ? .285 : .315;
  loft(head, skin, [[-.31,.16,.18,.02],[-.23,width*.79,.24,.02],[-.055,width,.285],[.18,width*.96,.285],[.31,width*.77,.23],[.37,.10,.13]], 12, 'human-face');
  for (const s of [-1,1]) {
    named(ellipsoid(head, skin, [s*(width+.018),-.035,-.005],[.065,.105,.065],8),'ear');
    named(ellipsoid(head, 0xb57563,[s*(width+.04),-.03,.035],[.025,.058,.026],8),'ear-fold');
    named(ellipsoid(head,0xfff7e9,[s*.135,.035,.271],[.068,.058,.032],8),'eye-white');
    named(ellipsoid(head,id==='witch'?0x497f78:0x382b28,[s*.135,.027,.301],[.031,.042,.019],8),'iris');
    named(ellipsoid(head,0x171d28,[s*.135,.026,.316],[.018,.033,.009],6),'pupil');
    named(ellipsoid(head,0xffffff,[s*.135-.009,.042,.324],[.009,.012,.006],6),'eye-glint');
    const brow=named(box(head,id==='witch'?0x593c42:0x252632,[s*.135,.111,.285],[.14,.034,.035]),'eyebrow');brow.rotation.z=-s*(id==='knight'?.16:.09);
    if(id==='witch')named(box(head,0x473546,[s*.17,.071,.304],[.075,.013,.024]),'upper-eyelash');
  }
  // A short planar bridge and nostrils read as a human nose from profile.
  const nose = new T.BufferGeometry();
  nose.setAttribute('position',new T.Float32BufferAttribute([-.045,.06,.267,.045,.06,.267,0,-.075,.385,-.045,.06,.267,0,-.075,.385,-.055,-.1,.285,.045,.06,.267,.055,-.1,.285,0,-.075,.385,-.055,-.1,.285,0,-.075,.385,.055,-.1,.285],3));nose.computeVertexNormals();
  named(mesh(head,nose,skin),'human-nose');
  named(tube(head,id==='witch'?0xa25563:0x874c46,[[-.073,-.17,.255],[0,-.184,.27],[.073,-.17,.255]],.012,5),'mouth');
  if(id==='chef') {
    for(const s of [-1,1]) { const moustache=named(ellipsoid(head,0x46302b,[s*.068,-.126,.289],[.09,.033,.03],7),'moustache');moustache.rotation.z=s*.22; }
    named(ellipsoid(head,0xce8b6a,[0,-.22,.239],[.17,.055,.048],9),'cheek-and-chin');
  }
}
function hair(head, id) {
  const dark=id==='witch'?0x45313f:id==='chef'?0x4b342c:0x202733,light=id==='witch'?0x775265:id==='chef'?0x775444:0x3b4656;
  const cap=loft(head,dark,[[.18,.322,.29],[.32,.33,.285],[.43,.27,.23],[.48,.13,.11]],10,'sculpted-hair');
  named(ellipsoid(head,dark,[0,.04,-.18],[.30,.29,.16],10),'back-hair');
  if(id==='coral'||id==='knight') {
    panel(head,dark,[[-.31,.17],[-.30,.36],[-.09,.51],[.12,.49],[.27,.34],[.12,.29],[-.11,.20]],.245,.075,'side-parted-fringe');
    panel(head,light,[[-.26,.32],[-.08,.48],[.10,.46],[.17,.39],[-.04,.38]],.325,.016,'hair-sweep-highlight');
    panel(head,dark,[[.13,.45],[.28,.38],[.31,.18],[.23,.12],[.20,.32]],.24,.07,'short-temple-lock');
    panel(head,0x151c26,[[.10,.47],[.13,.47],[.20,.33],[.17,.31]],.343,.01,'hair-part');
    for(const s of [-1,1]) named(box(head,dark,[s*.291,-.035,.04],[.055,.16,.10]),'sideburn');
  } else if(id==='chef') {
    panel(head,light,[[-.27,.24],[-.16,.35],[.21,.33],[.29,.21],[.08,.25]],.265,.04,'cropped-hairline');
  } else {
    for(const s of [-1,1]) {
      const lock=panel(head,dark,[[s*.16,.28],[s*.31,.18],[s*.36,-.43],[s*.25,-.72],[s*.13,-.59],[s*.22,-.25]],.06,.17,'long-hair-lock');
      panel(head,light,[[s*.23,.15],[s*.29,.02],[s*.30,-.42],[s*.25,-.56],[s*.24,-.22]],.232,.012,'hair-lock-highlight');
    }
    panel(head,dark,[[-.28,.22],[-.19,.39],[.16,.4],[.29,.24],[.08,.12],[0,.28],[-.13,.15]],.25,.07,'swept-bangs');
  }
  return cap;
}
function boot(parent, id) {
  const navy=id==='coral',armor=id==='knight',dark=navy?0x344454:armor?0x667b8a:0x282735;
  loft(parent,dark,[[-.13,.15,.23,.10],[-.085,.18,.31,.13],[.06,.17,.30,.12],[.16,.12,.15]],8,'boot-upper');
  named(box(parent,navy?0xe7e6dd:0x18202c,[0,-.115,.13],[.35,.075,.61]),'shoe-sole');
  if(navy){named(box(parent,0xf5f0df,[0,.035,.29],[.30,.065,.20]),'sneaker-toe');for(let k=0;k<3;k++)named(box(parent,0xf3efdf,[0,.135-k*.018,.10+k*.06],[.20,.018,.026]),'sneaker-lace');for(const s of [-1,1])named(box(parent,0x678aa2,[s*.16,.025,.12],[.018,.07,.21]),'sneaker-stripe');}
  if(armor){panel(parent,0xc7d5da,[[-.15,.12],[.15,.12],[.12,-.01],[-.12,-.01]],.36,.035,'armored-toecap');named(box(parent,0xc6a05d,[0,.13,.11],[.29,.04,.17]),'boot-gold-trim');}
  if(id==='witch'){named(box(parent,0x9e7a47,[0,.13,.14],[.24,.065,.035]),'boot-buckle');named(box(parent,0x252334,[0,.13,.165],[.13,.035,.02]),'buckle-inset');}
}
function hand(parent,skin,id,index) {
  const palm=group(parent,[0,-.38,.035]);palm.name='hand';
  const glove=id==='coral'?0x984b43:id==='knight'?0x768c9c:skin;
  named(ellipsoid(palm,glove,[0,-.045,.03],[.125,.15,.11],8),'palm');
  for(let k=0;k<4;k++)named(ellipsoid(palm,glove,[-.076+k*.05,-.13,.075],[.032,.065,.044],6),'finger-knuckle');
  const thumb=named(ellipsoid(palm,glove,[index===0?.115:-.115,-.035,.08],[.053,.083,.055],7),'thumb');thumb.rotation.z=index===0?-.35:.35;
  if(id==='coral'){named(cylinder(parent,0xe7d9bf,[0,-.29,.035],.14,.14,.11,8),'glove-cuff');named(box(palm,0xd9a363,[0,-.015,.134],[.13,.07,.025]),'glove-mark');}
  if(id==='knight')named(cylinder(parent,0xc5a161,[0,-.27,.015],.145,.145,.08,8),'gauntlet-trim');
  return palm;
}
export function createRig(id) {
  const root=new T.Group(),d=getFighter(id);root.name=`human-${d.id}`;
  const skin=id==='chef'?0xdca27b:id==='knight'?0xc99069:id==='witch'?0xdfb0a0:0xe8b28d;
  const stout=id==='chef'?1.36:id==='knight'?1.13:id==='witch'?.86:1;
  const torso=group(root,[0,1.24,0]);torso.name='torso';
  const cloth=id==='coral'?0x273f61:id==='chef'?0xeee7d5:id==='knight'?0x687f8d:0x40334f;
  loft(torso,cloth,[[-.09,.30*stout,.24*stout],[.13,.34*stout,.28*stout],[.48,.41*stout,.29*stout],[.72,.41*stout,.25*stout],[.85,.24*stout,.19]],10,'human-torso');
  // Short human neck, with head directly above the shoulders.
  const neck=group(torso,[0,.88,0]);neck.name='neck';named(cylinder(neck,skin,[0,.075,0],.115,.14,.23,9),'human-neck');
  const head=group(neck,[0,.37,.015]);head.name='head';humanFace(head,skin,id);hair(head,id);
  const wings=[],forearms=[],legs=[],knees=[],feet=[],hands=[],accessories=[];
  for(const s of [-1,1]) {
    const index=s<0?0:1,arm=group(torso,[s*.405*stout,.70,0]);arm.name=index?'right-shoulder':'left-shoulder';wings.push(arm);
    const upper=named(cylinder(arm,cloth,[s*.045,-.19,0],.165*stout,.125,.40,9),'upper-arm');upper.rotation.z=s*.16;
    const fore=group(arm,[s*.08,-.39,0]);fore.name=index?'right-elbow':'left-elbow';forearms.push(fore);
    const foreColor=id==='chef'?0xe9ddc8:id==='witch'?0x695376:cloth;
    named(cylinder(fore,foreColor,[0,-.16,0],.126,.10,.33,9),'forearm');named(cylinder(fore,id==='coral'?0x1b2d45:cloth,[0,-.30,.01],.11,.11,.085,9),'sleeve-cuff');
    hands.push(hand(fore,skin,id,index));
    const leg=group(root,[s*.19*stout,1.24,0]);leg.name=index?'right-hip':'left-hip';legs.push(leg);
    const pants=id==='knight'?0x435364:id==='chef'?0x3b454f:id==='witch'?0x302c40:0x303943;
    named(cylinder(leg,pants,[0,-.255,0],.155*stout,.125,.52,9),'thigh');
    const knee=group(leg,[0,-.54,0]);knee.name=index?'right-knee':'left-knee';knees.push(knee);
    named(ellipsoid(knee,pants,[0,0,0],[.13,.12,.13],8),'knee');named(cylinder(knee,pants,[0,-.235,0],.122,.09,.47,9),'shin');
    const shoe=group(knee,[0,-.54,0]);shoe.name=index?'right-ankle':'left-ankle';feet.push(shoe);boot(shoe,id);
    if(id==='knight') {named(ellipsoid(arm,0xa7bac2,[s*.035,.005,0],[.28,.18,.28],8),'pauldron');named(ellipsoid(knee,0xb8c7cb,[0,-.025,.12],[.155,.15,.095],8),'kneecap-plate');panel(knee,0x8ba1ae,[[-.11,-.08],[.11,-.08],[.08,-.40],[-.08,-.40]],.10,.045,'greave');}
  }
  if(id==='coral') {
    panel(torso,0xede8dc,[[-.17,.73],[.17,.73],[.16,.04],[-.16,.04]],.273,.04,'white-tshirt');
    for(const s of [-1,1]) {panel(torso,0x34557d,[[s*.18,.76],[s*.36,.64],[s*.33,.04],[s*.15,.04],[s*.11,.57]],.26,.055,'navy-jacket-panel');panel(torso,0x527393,[[s*.13,.78],[s*.27,.69],[s*.15,.43],[s*.08,.62]],.317,.018,'jacket-lapel');named(box(torso,0x172d49,[s*.25,.23,.318],[.14,.027,.015]),'jacket-pocket');}
    named(box(torso,0x182d47,[0,-.005,.025],[.64,.11,.48]),'ribbed-jacket-hem');
    named(box(torso,0x948475,[0,-.07,.263],[.11,.075,.035]),'belt-buckle');
  } else if(id==='chef') {
    // Broad apron, a double-breasted coat, folded red scarf and full toque.
    panel(torso,0xfff8e6,[[-.30,.62],[.30,.62],[.39,-.38],[-.39,-.38]],.37,.045,'chef-apron');
    for(const s of [-1,1])for(let k=0;k<3;k++)named(ellipsoid(torso,0x39434a,[s*.15,.53-k*.17,.429],[.035,.035,.018],7),'coat-button');
    panel(torso,0xd0c4ab,[[-.21,.08],[.21,.08],[.20,-.17],[-.20,-.17]],.424,.01,'apron-pocket');
    named(cylinder(neck,0xa5423c,[0,-.035,0],.20,.19,.105,9),'chef-scarf');panel(torso,0xc9634c,[[-.10,.81],[.09,.81],[.04,.54],[-.07,.62]],.36,.035,'scarf-knot');
    named(cylinder(head,0xe1d9c7,[0,.43,0],.315,.315,.16,10),'toque-band');named(cylinder(head,0xfff9e9,[0,.62,0],.30,.31,.26,10),'toque-crown');
    for(let k=0;k<5;k++)named(ellipsoid(head,0xfff9e9,[Math.cos(k*1.256)*.17,.77,Math.sin(k*1.256)*.14],[.19,.16,.18],8),'toque-pleat');
    const pan=group(forearms[1],[0,-.43,.06]);pan.name='frying-pan';named(box(pan,0x8d6747,[0,-.13,0],[.075,.36,.085]),'pan-handle');const rim=named(cylinder(pan,0x283440,[0,-.49,0],.36,.34,.09,12),'pan-rim');rim.rotation.x=Math.PI/2;const inside=named(cylinder(pan,0x596d78,[0,-.49,.052],.29,.29,.015,12),'pan-interior');inside.rotation.x=Math.PI/2;accessories.push(pan);
  } else if(id==='knight') {
    loft(torso,0x8ea5ae,[[.02,.36,.32],[.20,.46,.35],[.52,.49,.34],[.72,.39,.28]],8,'breastplate');
    panel(torso,0xd0b274,[[-.12,.64],[.12,.64],[.18,.37],[0,.13],[-.18,.37]],.34,.035,'breastplate-crest');panel(torso,0x3c7384,[[0,.56],[.09,.37],[0,.24],[-.09,.37]],.381,.025,'crest-enamel');
    named(box(torso,0xbe9c60,[0,-.01,0],[.83,.10,.63]),'armor-belt');for(let k=0;k<5;k++)panel(torso,k%2?0x697f8e:0x8ea5ae,[[k*.16-.40,-.05],[k*.16-.25,-.05],[k*.18-.23,-.33],[k*.18-.41,-.33]],.24,.06,'fauld-plate');
    loft(head,0x8da3af,[[.12,.34,.31],[.30,.35,.31],[.46,.26,.23],[.51,.10,.09]],10,'helmet-crown');
    for(const s of [-1,1]){panel(head,0x77909f,[[s*.24,.25],[s*.35,.21],[s*.33,-.22],[s*.20,-.23],[s*.23,-.04]],.07,.15,'helmet-cheekguard');named(box(head,0xcdb47d,[s*.31,.10,.12],[.045,.31,.09]),'helmet-gold-edge');}
    panel(head,0xd5bd86,[[-.31,.21],[.31,.21],[.29,.13],[-.29,.13]],.295,.035,'helmet-brow');
    const plume=named(mesh(head,new T.ConeGeometry(.13,.55,6),0x91484f,[0,.74,-.045]),'helmet-plume');plume.rotation.x=-.35;
    const spear=group(forearms[1],[0,-.43,.08]);spear.name='spear';named(cylinder(spear,0x8e704a,[0,.25,0],.045,.045,2.02,8),'spear-shaft');named(mesh(spear,new T.ConeGeometry(.16,.48,4),0xc4d4d8,[0,1.48,0]),'spear-point');named(cylinder(spear,0xc2a163,[0,1.23,0],.08,.08,.10,8),'spear-socket');accessories.push(spear);
    const shield=group(forearms[0],[0,-.15,.24]);shield.name='kite-shield';panel(shield,0xc4a46a,[[-.35,.37],[.35,.37],[.30,-.20],[0,-.52],[-.30,-.20]],0,.10,'shield-border');panel(shield,0x354f6b,[[-.28,.30],[.28,.30],[.23,-.17],[0,-.42],[-.23,-.17]],.105,.035,'shield-enamel');panel(shield,0xd3b77c,[[-.035,.27],[.035,.27],[.035,-.28],[0,-.34],[-.035,-.28]],.145,.012,'shield-emblem');accessories.push(shield);
  } else {
    loft(torso,0x3c344d,[[-.66,.55,.38],[-.48,.49,.34],[-.16,.32,.26],[.15,.26,.24]],10,'layered-skirt');
    panel(torso,0x294f57,[[-.24,.58],[.24,.58],[.20,.04],[-.20,.04]],.27,.035,'witch-bodice');
    for(let k=0;k<4;k++)named(box(torso,0xc9a66a,[0,.12+k*.10,.316],[.13,.018,.02]),'bodice-lacing');
    const capeGroup=group(torso,[0,.70,-.29]);capeGroup.name='cape';
    const cape=panel(capeGroup,0x614664,[[-.42,.04],[.42,.04],[.72,-1.31],[.34,-1.46],[0,-1.36],[-.34,-1.46],[-.72,-1.31]],-.07,.045,'cape-cloth');cape.rotation.x=-.12;accessories.push(capeGroup);
    for(const s of [-1,1])panel(capeGroup,0x9d7f77,[[s*.39,.02],[s*.44,-.02],[s*.70,-1.31],[s*.64,-1.32]],-.02,.015,'cape-piping');
    named(ellipsoid(torso,0xd4b672,[0,.73,.28],[.075,.07,.045],8),'cape-clasp');
    named(cylinder(head,0x302b45,[0,.37,0],.64,.64,.07,12),'hat-brim');const hat=named(mesh(head,new T.ConeGeometry(.355,.94,8),0x4b385a,[.06,.85,-.03]),'pointed-hat');hat.rotation.z=-.16;named(cylinder(head,0xb7945b,[.01,.47,0],.32,.35,.12,9),'hat-band');named(box(head,0xd9bb79,[.04,.47,.317],[.17,.105,.035]),'hat-buckle');named(box(head,0x3a3049,[.04,.47,.339],[.095,.065,.015]),'hat-buckle-inset');
    const staff=group(forearms[1],[0,-.40,.09]);staff.name='moon-staff';named(cylinder(staff,0x8e7255,[0,.15,0],.045,.045,1.92,8),'staff-shaft');const moon=named(mesh(staff,new T.TorusGeometry(.24,.047,5,12,Math.PI*1.7),0xd6bb7a,[0,1.25,0]),'staff-crescent');moon.rotation.z=-.8;named(mesh(staff,new T.OctahedronGeometry(.12),0x9acdd2,[0,1.25,0]),'staff-crystal');accessories.push(staff);
  }
  root.scale.setScalar(d.size);
  root.userData={id,torso,neck,head,wings,arms:wings,forearms,hands,legs,knees,feet,accessories,bodyBase:1.24,anatomy:'human'};
  const shield=mesh(root,new T.IcosahedronGeometry(1.7,1),new T.MeshBasicMaterial({color:d.color,transparent:true,opacity:.22,depthWrite:false}),[0,1.4,0]);shield.name='guard-effect';shield.visible=false;root.userData.shield=shield;
  const shadow=mesh(root,new T.CircleGeometry(.63,12),new T.MeshBasicMaterial({color:0x242a35,transparent:true,opacity:.25,depthWrite:false}),[0,.022,0],[1,1,.6]);shadow.name='ground-shadow';shadow.rotation.x=-Math.PI/2;root.userData.shadow=shadow;
  return root;
}
export function poseRig(root, f, time = 0) {
  const r = root.userData;
  root.position.set(f.x || 0, f.y || 0, 0);
  root.rotation.y = ((f.facing ?? 1) * Math.PI) / 2;
  r.torso.position.y = 1.24;
  r.torso.rotation.set(0, 0, 0);
  r.neck.rotation.set(0, 0, 0);
  r.head.rotation.set(0, 0, 0);
  for (const a of [...r.wings, ...r.forearms, ...r.legs, ...r.knees])
    a.rotation.set(0, 0, 0);
  r.wings[0].rotation.z = -0.18;
  r.wings[1].rotation.z = 0.18;
  const p = f.pose || "idle";
  const phase = time * 16,
    attack = f.attack,
    progress = attack ? attack.t / attack.duration : 0;
  r.shield.visible = p === "shield";
  r.shadow.visible = (f.y || 0) < 0.1;
  if (p === "run") {
    r.torso.rotation.x = 0.22;
    r.torso.position.y += Math.abs(Math.sin(phase)) * 0.055;
    r.legs.forEach((a, i) => {
      a.rotation.x = Math.sin(phase + i * Math.PI) * 0.88;
      r.knees[i].rotation.x =
        Math.max(0, -Math.sin(phase + i * Math.PI)) * 0.85;
      r.wings[i].rotation.x = -Math.sin(phase + i * Math.PI) * 0.65;
    });
  } else if (p === "jump" || p === "fall" || p === "recovery") {
    r.legs[0].rotation.x = -0.75;
    r.legs[1].rotation.x = 0.4;
    r.knees[0].rotation.x = 1.2;
    r.knees[1].rotation.x = 0.45;
    r.wings[0].rotation.z = -1.1;
    r.wings[1].rotation.z = 1.1;
    if (p === "recovery") {
      r.torso.rotation.y = time * 24;
      r.wings[0].rotation.z = -1.8;
      r.wings[1].rotation.z = 1.8;
    }
  } else if (p === "hit") {
    r.torso.rotation.x = -0.65;
    r.head.rotation.x = -0.25;
    r.wings[0].rotation.z = -1.4;
    r.wings[1].rotation.z = 1.2;
    r.legs[0].rotation.x = 0.7;
    r.legs[1].rotation.x = -0.5;
  } else if (p === "shield") {
    r.torso.position.y = 1.08;
    r.wings[0].rotation.x = -1.15;
    r.wings[1].rotation.x = -1.15;
    r.wings[0].rotation.z = -0.75;
    r.wings[1].rotation.z = 0.75;
    r.legs[0].rotation.x = -0.22;
    r.legs[1].rotation.x = -0.22;
    r.knees[0].rotation.x = 0.4;
    r.knees[1].rotation.x = 0.4;
  } else if (p === "ledge") {
    r.wings[0].rotation.x = -2.7;
    r.wings[1].rotation.x = -2.7;
    r.legs[0].rotation.x = 0.3;
    r.legs[1].rotation.x = -0.2;
  } else if (attack) {
    const swing = Math.sin(Math.min(1, progress / 0.65) * Math.PI);
    r.torso.rotation.y = -0.55 + 1.5 * swing;
    if (p.includes("up")) {
      r.wings[1].rotation.x = -2.8 * swing;
      r.wings[0].rotation.z = -1.2 * swing;
      r.torso.rotation.x = -0.3 * swing;
    } else if (p.includes("down")) {
      r.torso.rotation.x = 0.7 * swing;
      r.legs[1].rotation.x = -1.45 * swing;
      r.wings[0].rotation.z = -0.8;
    } else if (r.id === "coral") {
      r.legs[1].rotation.x = -1.7 * swing;
      r.knees[1].rotation.x = 0.1;
      r.torso.rotation.x = -0.28 * swing;
      r.wings[0].rotation.x = -1.2;
    } else if (r.id === "chef") {
      r.wings[1].rotation.x = -2.4 * swing;
      r.forearms[1].rotation.x = 0.7 * swing;
      r.torso.rotation.z = -0.3 * swing;
    } else if (r.id === "knight") {
      r.wings[1].rotation.x = -1.65 * swing;
      r.forearms[1].rotation.x = -0.7 * swing;
    } else {
      r.wings[1].rotation.x = -1.2 * swing;
      r.wings[0].rotation.z = -1.45 * swing;
      r.torso.rotation.y = time * 8;
    }
  } else {
    r.torso.position.y += Math.sin(time * 3) * 0.025;
    r.neck.rotation.x = Math.sin(time * 2) * 0.03;
    r.wings[0].rotation.x = -0.2;
    r.wings[1].rotation.x = -0.18;
    r.legs[1].rotation.x = 0.08;
  }
  root.visible = f.respawn === undefined || f.respawn <= 0;
  if (f.invincible > 0) root.visible = Math.floor(time * 12) % 3 !== 0;
  return root;
}
