import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const game = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
const renderer = await readFile(new URL("../src/arena3d.js", import.meta.url), "utf8");

test("roster uses ten distinct fighter identities", () => {
  const names = [...game.matchAll(/name:"([A-Z ]+)"/g)].map(match => match[1]);
  const models = [...game.matchAll(/model:"([a-z]+)"/g)].map(match => match[1]);
  assert.equal(names.length, 10);
  assert.equal(new Set(names).size, 10);
  assert.equal(models.length, 10);
  assert.equal(new Set(models).size, 10);
  for (const name of ["NARENDRA MODI","RAHUL GANDHI","EMBER RONIN","MIRAGE","IRON COIL","ORACLE ZERO","TIDEBOUND","NIGHT VOW","SIGIL FORGE","COMET SAINT"]) {
    assert.ok(names.includes(name), `missing original fighter: ${name}`);
  }
});

test("3D renderer builds detailed procedural characters and three arena variants", () => {
  for (const model of ["modi","rahul","ember","mirage","coil","astral","tide","dusk","glyph","meteor"]) {
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
