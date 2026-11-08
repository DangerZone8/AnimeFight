import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const game = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
test("roster remains eight distinct original anime fighter identities", () => {
  const names = [...game.matchAll(/name:"([A-Z ]+)"/g)].map(match => match[1]);
  const models = [...game.matchAll(/model:"([a-z]+)"/g)].map(match => match[1]);
  assert.equal(names.length, 8); assert.equal(new Set(names).size, 8);
  assert.equal(models.length, 8); assert.equal(new Set(models).size, 8);
  for (const name of ["EMBER RONIN","MIRAGE","IRON COIL","ORACLE ZERO","TIDEBOUND","NIGHT VOW","SIGIL FORGE","COMET SAINT"]) assert.ok(names.includes(name));
});
test("2D canvas renderer is active and does not load WebGL", () => {
  assert.ok(game.includes('const canvas = $("game-canvas"), ctx = canvas.getContext("2d")'));
  assert.ok(game.includes("function drawFighter(f){")); assert.ok(game.includes("function drawArena(){"));
  assert.ok(game.includes("ctx.clearRect(0,0,1100,520);drawArena();drawFighter(player);drawFighter(cpu);"));
  assert.ok(!game.includes('import("./arena3d.js")')); assert.ok(html.includes("2D anime-inspired arena fighter"));
});
test("2D fighter animation includes articulated limbs and move-specific poses", () => {
  for (const token of ["const arm=(angle,side)=>","const leg=(angle,offset)=>","phase===","actionName===","c.arc(32,-104,48","actionName==="]) assert.ok(game.includes(token), "missing 2D animation feature: "+token);
  for (const move of ["attack","heavy","kick","uppercut","sweep","jumpPunch","jumpKick","grab","special","hit","knockdown"]) assert.ok(game.includes('actionName==="' + move + '"') || game.includes('"'+move+'"'), "missing move pose: "+move);
});
test("combat retains stages, controls, combos and active-frame hit resolution", () => {
  for (const stage of ['value="neon"','value="temple"','value="dojo"']) assert.ok(html.includes(stage));
  for (const key of ['"arrowup"','"arrowdown"','"j"','"k"','"g"','"l"']) assert.ok(game.includes(key));
  for (const combo of ['"triple"','"launcher"','"finisher"','"double-heavy"','"double"','"cross"']) assert.ok(game.includes(combo));
  assert.ok(game.includes("attacker.pendingHit={defender,kind,delay:startup[kind]??.14}"));
  assert.ok(game.includes("resolveHit(f,pending.defender,pending.kind)"));
});