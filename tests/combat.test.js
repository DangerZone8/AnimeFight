import test from "node:test";
import assert from "node:assert/strict";
import { isInHitRange, comboDamage, nextCombo, ATTACKS } from "../src/combat.js";

test("hitboxes only connect in front of the attacking fighter", () => {
  const a={x:100,facing:1}, target={x:180};
  assert.equal(isInHitRange(a,target,ATTACKS.attack.reach),true);
  assert.equal(isInHitRange(a,{x:20},ATTACKS.attack.reach),false);
  assert.equal(isInHitRange(a,{x:300},ATTACKS.attack.reach),false);
});

test("combo scaling is capped and deterministic", () => {
  assert.equal(comboDamage(10,1),10);
  assert.equal(comboDamage(10,3),12.4);
  assert.equal(comboDamage(10,99),13.6);
});

test("combo chain resets after its timing window", () => {
  assert.equal(nextCombo(2,0.8),3);
  assert.equal(nextCombo(4,1.4),1);
});
