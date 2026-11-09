const FRAME_W = 192;
const FRAME_H = 192;
const COLUMNS = 8;

export const FIGHTER_ANIMATIONS = Object.freeze({
  idle: { row: 0, frames: 8, fps: 9, loop: true },
  attack: { row: 1, frames: 8, fps: 16, loop: false },
  heavy: { row: 1, frames: 8, fps: 18, loop: false },
  kick: { row: 2, frames: 8, fps: 16, loop: false },
  jump: { row: 3, frames: 8, fps: 12, loop: false },
  jumpPunch: { row: 1, frames: 8, fps: 16, loop: false },
  jumpKick: { row: 2, frames: 8, fps: 16, loop: false },
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

  draw(ctx, fighter, elapsed) {
    const image = this.images.get(fighter.data.id);
    if (!image || !image.complete || !image.naturalWidth) return false;
    const requested = fighter.action === "hit" || fighter.action === "knockdown"
      ? fighter.action : (ACTION_ALIAS[fighter.action] || fighter.action);
    const animation = FIGHTER_ANIMATIONS[requested] || FIGHTER_ANIMATIONS.idle;
    const progress = fighter.actionDuration > 0
      ? 1 - Math.max(0, Math.min(1, fighter.actionTime / fighter.actionDuration)) : 0;
    const frame = animation.loop
      ? Math.floor(elapsed * animation.fps) % animation.frames
      : Math.min(animation.frames - 1, Math.floor(progress * animation.frames));
    const sx = frame * FRAME_W;
    const sy = animation.row * FRAME_H;
    if (sx + FRAME_W > image.naturalWidth || sy + FRAME_H > image.naturalHeight) return false;
    const ground = 414 - fighter.y;
    const scale = fighter.action === "knockdown" ? 1.05 : 1;
    const width = 164 * scale, height = 164 * scale;
    ctx.save();
    ctx.translate(fighter.x, ground);
    ctx.scale(fighter.facing, 1);
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
