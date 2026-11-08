import test from "node:test";
import assert from "node:assert/strict";
import { SUPER_PROFILES, getSuperProfile } from "../src/super.js";

test("all ten fighters have distinct cinematic super profiles and original sound signatures", () => {
  const ids=["son","ninja","captain","sorcerer","blade","reaper","homunculus","hero","yatra","deedee"];
  const styles=new Set(), signatures=new Set();
  for(const id of ids){
    const profile=getSuperProfile(id);
    assert.ok(profile.label.length>5,id+" label");
    assert.ok(profile.meme.length>10,id+" punchline");
    assert.ok(profile.notes.length>=4,id+" sound notes");
    assert.ok(profile.notes.every(n=>Number.isFinite(n)&&n>=35&&n<=1200),id+" sound frequencies");
    styles.add(profile.style);signatures.add(profile.notes.join(","));
  }
  assert.equal(styles.size,ids.length,"each fighter needs a unique animation style");
  assert.equal(signatures.size,ids.length,"each fighter needs a unique sound signature");
});
test("unknown fighter receives a safe fallback profile",()=>assert.equal(getSuperProfile("missing").style,"solar"));
