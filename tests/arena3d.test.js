import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const game = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
const renderer = await readFile(new URL("../src/arena3d.js", import.meta.url), "utf8");

test("roster uses eight distinct original anime fighter identities", () => {
  const names = [...game.matchAll(/name:"([A-Z ]+)"/g)].map(match => match[1]);
  const models = [...game.matchAll(/model:"([a-z]+)"/g)].map(match => match[1]);
  assert.equal(names.length, 8);
  assert.equal(new Set(names).size, 8);
  assert.equal(models.length, 8);
  assert.equal(new Set(models).size, 8);
  for (const name of ["EMBER RONIN","MIRAGE","IRON COIL","ORACLE ZERO","TIDEBOUND","NIGHT VOW","SIGIL FORGE","COMET SAINT"]) {
    assert.ok(names.includes(name), `missing original fighter: ${name}`);
  }
});

test("3D renderer builds detailed procedural characters and three arena variants", () => {
  for (const model of ["ember","mirage","coil","astral","tide","dusk","glyph","meteor"]) {
    assert.ok(renderer.includes(`${model}:`), `missing 3D model profile: ${model}`);
  }
  for (const stage of ['"neon"','"temple"','"dojo"']) assert.ok(renderer.includes(stage));
  assert.ok(renderer.includes("WebGLRenderer"));
  assert.ok(renderer.includes("CapsuleGeometry"));
  assert.ok(renderer.includes("PerspectiveCamera"));
});

test("3D renderer is connected to the live combat state", () => {
  assert.ok(game.includes('import("./arena3d.js")'));
  assert.ok(game.includes("view.setFighters(hero.model,rival.model)"));
  assert.ok(game.includes("arena3d.render({player,cpu,elapsed})"));
});

test("anime fighters have expressive facial rigs and layered costume details", () => {
  for (const token of ["const eyes=[],brows=[]","const mouth=mesh","d.brows[0].rotation.z","d.mouth.scale.y","pauldron","split coat panels"]) assert.ok(renderer.includes(token), `missing visual detail: ${token}`);
});

test("arenas have stage-specific landmarks and enhanced floor detailing", () => {
  for (const token of ["centerSigil","if(type===\"temple\")","else if(type===\"dojo\")","billboard","banner","rune"]) assert.ok(renderer.includes(token), `missing arena feature: ${token}`);
});

test("combat animation has anticipation, active strike, recovery and impact feedback", () => {
  for (const token of ["const windup=1-smooth","const extension=smooth","const recoil=smooth","impactBurst","cameraShake","d.forearms[0].rotation.x"]) assert.ok(renderer.includes(token), `missing combat animation feature: ${token}`);
  assert.ok(renderer.includes('actionName==="kick"||actionName==="jumpKick"'));
  assert.ok(renderer.includes('actionName==="sweep"?1.45*extension'));
});
