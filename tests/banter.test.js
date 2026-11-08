import test from "node:test";
import assert from "node:assert/strict";
import { BANTER, getBanter } from "../src/banter.js";

test("every roster fighter has original intro, super and win dialogue", () => {
  for (const id of ["son","ninja","captain","sorcerer","blade","reaper","homunculus","hero","yatra","deedee"]) {
    assert.equal(typeof getBanter(id,"intro"),"string",id+" intro");
    assert.equal(typeof getBanter(id,"super"),"string",id+" super");
    assert.equal(typeof getBanter(id,"win"),"string",id+" win");
    assert.ok(getBanter(id,"super").length > 10,id+" super line should be substantial");
    assert.ok(getBanter(id,"introJa").length > 0,id+" Japanese intro");
    assert.ok(getBanter(id,"superJa").length > 0,id+" Japanese super");
    assert.ok(getBanter(id,"meme").length > 0,id+" English meme line");
    assert.ok(getBanter(id,"superMeme").length > 0,id+" super punchline");
  }
});

test("voice delivery settings are broad synthesis parameters, not voice identities", () => {
  for (const [id, data] of Object.entries(BANTER)) {
    assert.ok(data.voice.pitch >= 0.5 && data.voice.pitch <= 2,id+" pitch");
    assert.ok(data.voice.rate >= 0.5 && data.voice.rate <= 2,id+" rate");
  }
});

test("unknown characters safely return no dialogue", () => {
  assert.equal(getBanter("unknown","super"),"");
});
