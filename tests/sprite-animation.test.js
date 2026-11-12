import test from "node:test";
import assert from "node:assert/strict";
import { FIGHTER_ANIMATIONS, FIGHTER_ATLAS_FRAME, FIGHTER_ATLAS_PATHS, SpriteAtlasRenderer } from "../src/sprite-animation.js";

test("sprite atlas contract defines distinct timed combat animation rows", () => {
  assert.deepEqual(FIGHTER_ATLAS_FRAME, { width: 192, height: 192, columns: 8 });
  for (const name of ["idle", "attack", "heavy", "kick", "jump", "hit", "knockdown", "guard"]) {
    assert.ok(FIGHTER_ANIMATIONS[name], "missing " + name);
    assert.ok(FIGHTER_ANIMATIONS[name].frames > 1);
    assert.ok(FIGHTER_ANIMATIONS[name].fps > 0);
  }
  assert.equal(FIGHTER_ANIMATIONS.idle.loop, true);
  assert.equal(FIGHTER_ANIMATIONS.victory.row, 0);
  assert.equal(FIGHTER_ANIMATIONS.victory.loop, true);
  assert.equal(FIGHTER_ANIMATIONS.attack.loop, false);
  assert.equal(Object.keys(FIGHTER_ATLAS_PATHS).length, 8);
  for (const [id, path] of Object.entries(FIGHTER_ATLAS_PATHS)) {
    assert.equal(path, "/assets/fighters/" + id + ".svg");
  }
});

test("sprite renderer safely falls back when a fighter atlas is not available", () => {
  const renderer = new SpriteAtlasRenderer({ ember: "/missing.png" }, class {});
  const calls = [];
  const ctx = { save(){}, restore(){}, translate(){}, scale(){}, drawImage(...args){calls.push(args);} };
  assert.equal(renderer.draw(ctx, { data:{id:"ember"}, action:"idle", actionTime:0, actionDuration:0, x:10, y:0, facing:1, hitFlash:0 }, 0), false);
  assert.equal(calls.length, 0);
});

test("sprite renderer crops a valid frame and mirrors the opponent", () => {
  class FakeImage { constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1152;} }
  const renderer = new SpriteAtlasRenderer({ ember:"atlas.png" }, FakeImage);
  renderer.images.set("ember", new FakeImage());
  const calls = [], ctx = { save(){}, restore(){}, translate(...x){calls.push(["translate",...x]);}, scale(...x){calls.push(["scale",...x]);}, rotate(...x){calls.push(["rotate",...x]);}, drawImage(...x){calls.push(["drawImage",...x]);} };
  const fighter = { data:{id:"ember"}, action:"attack", actionTime:.2, actionDuration:.4, x:300, y:0, facing:-1, hitFlash:0 };
  assert.equal(renderer.draw(ctx, fighter, 0), true);
  assert.ok(calls.some(call=>call[0]==="scale"&&call[1]<0));
  const draw = calls.find(call=>call[0]==="drawImage");
  assert.equal(draw[2], 768);
  assert.equal(draw[3], 192);
  assert.equal(draw[4], 192);
  assert.equal(draw[5], 192);
});


test("sprite renderer exposes matching atlas artwork for roster portraits", () => {
  class FakeImage { constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1152;} }
  const renderer = new SpriteAtlasRenderer({ ember:"atlas.svg" }, FakeImage);
  renderer.images.set("ember", new FakeImage());
  const calls=[];
  const ctx={save(){},restore(){},drawImage(...args){calls.push(args);}};
  assert.equal(renderer.drawPortrait(ctx,"ember",12,0,136,130),true);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].slice(1,9),[0,0,192,192,12,0,136,130]);
  assert.equal(renderer.drawPortrait(ctx,"missing"),false);
});

test("victory state uses the existing idle atlas without changing gameplay frames", () => {
  class FakeImage { constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1152;} }
  const renderer=new SpriteAtlasRenderer({ember:"atlas.svg"},FakeImage);
  renderer.images.set("ember",new FakeImage());
  const calls=[];
  const ctx={save(){},restore(){},translate(...v){calls.push(["translate",...v]);},scale(...v){calls.push(["scale",...v]);},rotate(){},drawImage(...v){calls.push(["drawImage",...v]);}};
  const fighter={data:{id:"ember"},action:"victory",actionTime:0,actionDuration:0,x:100,y:0,facing:1,hitFlash:0};
  assert.equal(renderer.draw(ctx,fighter,1),true);
  const frame=calls.find(call=>call[0]==="drawImage");
  assert.equal(frame[3],0);
});
