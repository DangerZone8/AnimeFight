import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const game = await readFile(new URL("../src/game.js", import.meta.url), "utf8");

test("match setup supports player and rival selection, random pick, stages and three difficulties", () => {
  for (const id of ["select-player","select-cpu","random-button","player-pick-name","cpu-pick-name","arena","difficulty","match-mode","start-button"]) {
    assert.ok(html.includes(`id="${id}"`), `missing match setup control: ${id}`);
  }
  for (const stage of ["neon","temple","dojo"]) assert.ok(html.includes(`value="${stage}"`));
  for (const difficulty of ["easy","normal","hard"]) assert.ok(html.includes(`value="${difficulty}"`));
});

test("round flow uses 60-second rounds and first-to-two scoring with draws", () => {
  assert.ok(game.includes("timer=60"));
  assert.ok(game.includes("roundWins[0]++;roundWins[1]++"));
  assert.ok(game.includes("Math.max(...roundWins)>=2&&roundWins[0]!==roundWins[1]"));
  assert.ok(html.includes('id="round-score"'));
  assert.ok(html.includes('id="result-panel"'));
});

test("controls include movement, jump, crouch, block, punch, kick, grab and full-meter super", () => {
  for (const key of ['"arrowleft"','"arrowright"','"arrowup"','"arrowdown"','"guard"','"numpad1"','"numpad2"','"numpad3"','"numpad0"']) assert.ok(game.includes(key));
  assert.ok(game.includes('f.energy>=100'));
  assert.ok(game.includes('keys.has(" ")'));
  assert.ok(html.includes('data-key="guard"'));
  assert.ok(html.includes('data-key="i"'));
});

test("combo strings, local two-player mode and pause/audio controls are wired", () => {
  for (const combo of ['"triple"','"launcher"','"finisher"','"double-heavy"','"double"','"cross"']) assert.ok(game.includes(combo));
  assert.ok(game.includes('localMode=$("match-mode").value==="local"'));
  assert.ok(game.includes('controlFighter(cpu,player,"p2")'));
  for (const id of ["pause-overlay","resume-button","sound-toggle","quit-button","result-rematch","result-select"]) assert.ok(html.includes(`id="${id}"`));
});
