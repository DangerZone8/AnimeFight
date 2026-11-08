export const ATTACKS = Object.freeze({
  punch: Object.freeze({ damage: 6, reach: 88, push: 3, cost: 0, cooldown: 0.2 }),
  kick: Object.freeze({ damage: 11, reach: 112, push: 7, cost: 0, cooldown: 0.34 }),
  grab: Object.freeze({ damage: 15, reach: 62, push: 10, cost: 0, cooldown: 0.55, ignoresGuard: true }),
  super: Object.freeze({ damage: 28, reach: 270, push: 13, cost: 35, cooldown: 0.9 }),
  bossSuper: Object.freeze({ damage: 48, reach: 310, push: 18, cost: 35, cooldown: 1.25 })
});

export function isInHitRange(attacker, defender, reach) {
  const dx = defender.x - attacker.x;
  return Math.abs(dx) <= reach && (dx === 0 || Math.sign(dx) === attacker.facing);
}

export function comboDamage(baseDamage, comboCount) {
  const step = Math.max(0, Math.min(3, comboCount - 1));
  return Math.round(baseDamage * (1 + step * 0.1) * 10) / 10;
}

export function nextCombo(previousCount, elapsedSinceHit) {
  return elapsedSinceHit <= 1.15 ? Math.min(4, previousCount + 1) : 1;
}

export function damageForMove(move, { power = 1, isBoss = false } = {}) {
  const key = move === "super" && isBoss ? "bossSuper" : move;
  return ATTACKS[key].damage * power;
}
