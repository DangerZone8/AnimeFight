const FRAME_W = 192;
const FRAME_H = 192;
const COLUMNS = 8;

export const FIGHTER_ANIMATIONS = Object.freeze({
  idle: { row: 0, frames: 8, fps: 9, loop: true },
  attack: { row: 1, frames: 8, fps: 16, loop: false },
  heavy: { row: 1, frames: 8, fps: 18, loop: false },
  kick: { row: 2, frames: 8, fps: 16, loop: false },
  jump: { row: 3, frames: 8, fps: 12, loop: false },
  jumpPunch: { row: 1, frames: 8, fps: 18, loop: false },
  jumpKick: { row: 2, frames: 8, fps: 18, loop: false },
  hit: { row: 4, frames: 8, fps: 14, loop: false },
  knockdown: { row: 4, frames: 8, fps: 12, loop: false },
  guard: { row: 5, frames: 8, fps: 8, loop: true }
});

const ACTION_ALIAS = Object.freeze({
  combo: "attack", triple: "heavy", double: "attack", cross: "attack",
  launcher: "heavy", finisher: "heavy", "double-heavy": "heavy",
  uppercut: "heavy", sweep: "kick", grab: "attack", special: "heavy",
  run: "idle", block: "guard", defend: "guard", blocking: "guard"
});

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const ATTACK_POSES = Object.freeze({
  attack: { lunge: 20, lean: -.12, stretchX: 1.13, squashY: .94 },
  heavy: { lunge: 27, lean: -.2, stretchX: 1.17, squashY: .91 },
  kick: { lunge: 24, lean: -.16, stretchX: 1.15, squashY: .93 },
  jumpPunch: { lunge: 18, lean: -.15, stretchX: 1.16, squashY: .92 },
  jumpKick: { lunge: 25, lean: -.2, stretchX: 1.18, squashY: .9 },
  uppercut: { lunge: 15, lean: -.32, stretchX: .94, squashY: 1.12 },
  sweep: { lunge: 22, lean: .28, stretchX: 1.2, squashY: .82 },
  grab: { lunge: 17, lean: -.1, stretchX: 1.08, squashY: .96 },
  special: { lunge: 34, lean: -.24, stretchX: 1.22, squashY: .88 },
  triple: { lunge: 29, lean: -.17, stretchX: 1.19, squashY: .91 },
  double: { lunge: 23, lean: -.13, stretchX: 1.15, squashY: .94 },
  cross: { lunge: 25, lean: -.18, stretchX: 1.17, squashY: .92 },
  launcher: { lunge: 23, lean: -.3, stretchX: 1.04, squashY: 1.1 },
  finisher: { lunge: 31, lean: -.22, stretchX: 1.2, squashY: .89 },
  "double-heavy": { lunge: 28, lean: -.2, stretchX: 1.18, squashY: .9 }
});

export class SpriteAtlasRenderer {
  constructor(manifest, ImageCtor = globalThis.Image) {
    this.manifest = manifest;
    this.ImageCtor = ImageCtor;
    this.images = new Map();
    this.failures = new Set();
  }

  async load() {
    const entries = Object.entries(this.manifest);
    await Promise.all(entries.map(([id, path]) => new Promise(resolve => {
      const image = new this.ImageCtor();
      image.onload = () => { this.images.set(id, image); resolve(); };
      image.onerror = () => { this.failures.add(id); resolve(); };
      image.src = path;
    })));
    return { loaded: this.images.size, failed: this.failures.size };
  }

  drawPortrait(ctx, id, x = 0, y = 0, width = 160, height = 130) {
    const image = this.images.get(id);
    if (!image || !image.complete || !image.naturalWidth) return false;
    ctx.save();
    ctx.shadowColor = "#8bdcff";
    ctx.shadowBlur = 12;
    ctx.drawImage(image, 0, 0, FRAME_W, FRAME_H, x, y, width, height);
    ctx.restore();
    return true;
  }

  draw(ctx, fighter, elapsed) {
    const image = this.images.get(fighter.data.id);
    if (!image || !image.complete || !image.naturalWidth) return false;

    const action = fighter.action || "idle";
    const requested = action === "hit" || action === "knockdown"
      ? action : (ACTION_ALIAS[action] || action);
    const animation = FIGHTER_ANIMATIONS[requested] || FIGHTER_ANIMATIONS.idle;
    const progress = fighter.actionDuration > 0
      ? 1 - clamp(fighter.actionTime / fighter.actionDuration) : 0;
    const frame = animation.loop
      ? Math.floor(elapsed * animation.fps) % animation.frames
      : Math.min(animation.frames - 1, Math.floor(progress * animation.frames));
    const sx = frame * FRAME_W;
    const sy = animation.row * FRAME_H;
    if (sx + FRAME_W > image.naturalWidth || sy + FRAME_H > image.naturalHeight) return false;

    const pose = ATTACK_POSES[action];
    let xOffset = 0, yOffset = 0, rotation = 0, scaleX = 1, scaleY = 1;
    if (pose) {
      // Anticipation -> extension -> follow-through -> recovery.
      const anticipation = 1 - smooth(progress / .28);
      const strike = smooth((progress - .2) / .28) * (1 - smooth((progress - .58) / .2));
      const recovery = smooth((progress - .62) / .38);
      xOffset = -pose.lunge * anticipation * .28 + pose.lunge * strike - pose.lunge * .22 * recovery;
      rotation = pose.lean * anticipation + pose.lean * .35 * strike * (action === "uppercut" ? -1 : 1);
      scaleX = 1 + (pose.stretchX - 1) * strike - .035 * anticipation;
      scaleY = 1 + (pose.squashY - 1) * strike + .025 * anticipation;
      yOffset = action === "uppercut" ? -12 * strike : action === "sweep" ? 15 * strike : -4 * strike;
    } else if (action === "hit") {
      const recoil = Math.sin(progress * Math.PI);
      xOffset = -fighter.facing * 9 * recoil;
      rotation = .16 * recoil;
      scaleX = 1 - .07 * recoil;
      scaleY = 1 + .06 * recoil;
    } else if (action === "knockdown") {
      const fall = smooth(progress);
      rotation = .95 * fall;
      yOffset = 17 * fall;
      scaleY = 1 - .12 * fall;
    } else if (action === "guard") {
      const brace = .5 + .5 * Math.sin(elapsed * 15);
      xOffset = -3 * brace;
      scaleX = 1 - .035 * brace;
      scaleY = 1 + .025 * brace;
    } else if (action === "jump") {
      yOffset = -5 * Math.sin(progress * Math.PI);
      scaleX = 1 + .04 * Math.sin(progress * Math.PI);
    } else if (action === "run") {
      yOffset = -3 * Math.abs(Math.sin(elapsed * 19));
      scaleX = 1 + .025 * Math.sin(elapsed * 19);
    }

    const ground = 414 - fighter.y;
    const width = action === "knockdown" ? 172 : 164;
    const height = action === "knockdown" ? 172 : 164;
    ctx.save();
    ctx.translate(fighter.x + xOffset * fighter.facing, ground + yOffset);
    ctx.scale(fighter.facing * scaleX, scaleY);
    ctx.rotate(rotation);
    if (fighter.hitFlash > 0) ctx.globalAlpha = .72 + Math.sin(elapsed * 48) * .2;
    ctx.drawImage(image, sx, sy, FRAME_W, FRAME_H, -width / 2, -height, width, height);
    ctx.restore();
    return true;
  }
}

export const FIGHTER_ATLAS_FRAME = Object.freeze({ width: FRAME_W, height: FRAME_H, columns: COLUMNS });
export const FIGHTER_ATLAS_PATHS = Object.freeze({
  ember: "/assets/fighters/ember.svg", mirage: "/assets/fighters/mirage.svg",
  coil: "/assets/fighters/coil.svg", astral: "/assets/fighters/astral.svg",
  tide: "/assets/fighters/tide.svg", dusk: "/assets/fighters/dusk.svg",
  glyph: "/assets/fighters/glyph.svg", meteor: "/assets/fighters/meteor.svg"
});
