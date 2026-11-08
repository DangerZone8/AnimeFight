import test from "node:test";
import assert from "node:assert/strict";
import { AdaptiveCPU } from "../src/ai.js";

test("CPU records a bounded history of player actions", () => {
  const ai = new AdaptiveCPU();
  for (let i=0;i<25;i++) ai.observe("attack");
  assert.equal(ai.history.length,18);
  assert.equal(ai.tendencies.attack,18);
});

test("CPU spends special energy when critically low on health and in range", () => {
  const ai = new AdaptiveCPU();
  assert.equal(ai.choose({ distance:60,selfHealth:10,enemyHealth:80,selfEnergy:50 }),"special");
});

test("CPU approaches when the opponent is outside attack range", () => {
  const ai = new AdaptiveCPU({ personality:"berserker" });
  const old = Math.random;
  Math.random = () => 0;
  try { assert.equal(ai.choose({ distance:400,selfHealth:100,enemyHealth:100,selfEnergy:0 }),"approach"); }
  finally { Math.random = old; }
});

test("CPU detects repeated player attacks", () => {
  const ai = new AdaptiveCPU();
  for (let i=0;i<8;i++) ai.observe("attack");
  assert.equal(ai.tendencies.attack,8);
});
test("CPU chooses a counter against repeated close-range attacks", () => {
  const ai = new AdaptiveCPU({ difficulty:"normal" });
  for (let i=0;i<8;i++) ai.observe("attack");
  const old = Math.random;
  Math.random = () => 0.99;
  try { assert.equal(ai.choose({ distance:60,selfHealth:90,enemyHealth:90,selfEnergy:0 }),"counter"); }
  finally { Math.random = old; }
});

test("CPU recognises a repeated special-move habit", () => {
  const ai = new AdaptiveCPU({difficulty:"normal"});
  for (let i=0;i<8;i++) ai.observe("special");
  const old = Math.random; Math.random = () => 0.99;
  try { assert.equal(ai.choose({distance:60,selfHealth:90,enemyHealth:90,selfEnergy:0,enemyAction:"special"}),"guard"); }
  finally { Math.random = old; }
});
