import test from "node:test";
import assert from "node:assert/strict";
import { isInHitRange, comboDamage, nextCombo, ATTACKS, damageForMove } from "../src/combat.js";

test("hitboxes only connect in front of the attacking fighter", () => {
  const a={x:100,facing:1}, target={x:180};
  assert.equal(isInHitRange(a,target,ATTACKS.punch.reach),true);
  assert.equal(isInHitRange(a,{x:20},ATTACKS.punch.reach),false);
  assert.equal(isInHitRange(a,{x:300},ATTACKS.punch.reach),false);
});

test("combo scaling is capped and deterministic", () => {
  assert.equal(comboDamage(10,1),10);
  assert.equal(comboDamage(10,3),12);
  assert.equal(comboDamage(10,99),13);
});

test("combo chain resets after its timing window", () => {
  assert.equal(nextCombo(2,0.8),3);
  assert.equal(nextCombo(4,1.4),1);
});

test("move hierarchy gives punch, kick, grab and super distinct damage", () => {
  assert.ok(ATTACKS.punch.damage < ATTACKS.kick.damage);
  assert.ok(ATTACKS.kick.damage < ATTACKS.grab.damage);
  assert.ok(ATTACKS.grab.damage < ATTACKS.super.damage);
  assert.ok(ATTACKS.grab.ignoresGuard);
});

test("boss super is substantially stronger than a normal super", () => {
  assert.equal(damageForMove("super"),28);
  assert.equal(damageForMove("super",{isBoss:true}),48);
  assert.ok(damageForMove("super",{isBoss:true}) > damageForMove("super") * 1.6);
});
