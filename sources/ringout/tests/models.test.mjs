import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRig, poseRig} from '../src/models.js';
import {FIGHTERS} from '../src/data.js';
const poses=['idle','run','jump','fall','hit','shield','ledge','side','special-side','up','special-up','down','recovery'];
const namedMeshes=(rig,name)=>{const out=[];rig.traverse(o=>{if(o.isMesh&&o.name===name)out.push(o)});return out;};
const worldBounds=meshes=>{const bounds=new T.Box3();for(const m of meshes){m.geometry.computeBoundingBox();bounds.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld))}return bounds;};

test('four humanoid rigs have real facial features and articulated human proportions',()=>{
 for(const fighter of FIGHTERS){
  const rig=createRig(fighter.id),r=rig.userData;
  assert.equal(r.anatomy,'human');
  assert.equal(r.arms,r.wings,'legacy animation shoulder alias remains compatible');
  for(const key of ['arms','forearms','hands','legs','knees','feet'])assert.equal(r[key].length,2,key);
  assert.equal(namedMeshes(rig,'human-face').length,1);
  assert.equal(namedMeshes(rig,'human-nose').length,1);
  for(const feature of ['eye-white','pupil','ear'])assert.equal(namedMeshes(rig,feature).length,2,`${fighter.id}: ${feature}`);
  assert.equal(namedMeshes(rig,'finger-knuckle').length,8);
  assert.equal(namedMeshes(rig,'thumb').length,2);
  assert(r.head.position.y<=.4,'head sits just above a short neck');
  assert.equal(namedMeshes(rig,'human-neck')[0].geometry.parameters.height,.23);
  rig.traverse(o=>{assert(!/beak|feather|bird-tail/i.test(o.name));if(o.geometry)for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n));});
 }
});

test('classes have different geometry and equipment, beyond material colors',()=>{
 const signatures=new Set();
 const landmarks={coral:['side-parted-fringe','navy-jacket-panel','white-tshirt','sneaker-lace','glove-cuff'],chef:['chef-apron','toque-crown','toque-pleat','pan-rim','moustache'],knight:['breastplate','helmet-cheekguard','spear-point','shield-border','greave'],witch:['long-hair-lock','pointed-hat','layered-skirt','cape-cloth','staff-crescent']};
 for(const f of FIGHTERS){const rig=createRig(f.id);let count=0;rig.traverse(o=>{if(o.geometry)count+=o.geometry.attributes.position.count});assert(count>2000);signatures.add(count);for(const feature of landmarks[f.id])assert(namedMeshes(rig,feature).length>0,`${f.id}: missing ${feature}`);}
 assert.equal(signatures.size,4);
});

test('idle shoe soles remain at the gameplay ground and every pose has finite bounded geometry',()=>{
 for(const f of FIGHTERS){const rig=createRig(f.id);poseRig(rig,{x:0,y:0,pose:'idle',facing:1},0);rig.updateMatrixWorld(true);const soles=worldBounds(namedMeshes(rig,'shoe-sole'));assert(soles.min.y>-.06&&soles.min.y<.06,`${f.id}: feet should meet the floor`);
  for(const facing of [-1,1])for(const pose of poses){const state={x:2,y:3,pose,facing,attack:/side|up|down/.test(pose)?{t:.2,duration:.6}:null};const before=JSON.stringify(state);poseRig(rig,state,1.2);rig.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(rig);assert([bounds.min.x,bounds.min.y,bounds.min.z,bounds.max.x,bounds.max.y,bounds.max.z].every(Number.isFinite));assert(bounds.max.y-bounds.min.y<6,`${f.id}/${pose}: animation exceeded stage scale`);assert.equal(JSON.stringify(state),before);assert.equal(rig.position.x,2);assert.equal(rig.position.y,3);assert.equal(rig.rotation.y,facing*Math.PI/2);}
 }
});

test('class attacks articulate limbs, guard is transient, and pose reset restores the rig',()=>{
 for(const f of FIGHTERS){const rig=createRig(f.id),r=rig.userData;poseRig(rig,{pose:'idle',facing:1},0);const idle=[...r.arms,...r.forearms,...r.legs].map(j=>j.rotation.toArray().slice(0,3));poseRig(rig,{pose:'side',facing:1,attack:{t:.2,duration:.6}},0);const attack=[...r.arms,...r.forearms,...r.legs].map(j=>j.rotation.toArray().slice(0,3));assert.notDeepEqual(attack,idle,f.id);poseRig(rig,{pose:'shield'},0);assert.equal(r.shield.visible,true);poseRig(rig,{pose:'idle',facing:1},0);assert.equal(r.shield.visible,false);assert.deepEqual([...r.arms,...r.forearms,...r.legs].map(j=>j.rotation.toArray().slice(0,3)),idle);}
});
