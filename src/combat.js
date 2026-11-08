export const ATTACKS = Object.freeze({
  attack: Object.freeze({ damage: 7, reach: 92, startup: 0.07, active: 0.12, recovery: 0.18, push: 4 }),
  heavy: Object.freeze({ damage: 13, reach: 120, startup: 0.15, active: 0.12, recovery: 0.3, push: 8 }),
  special: Object.freeze({ damage: 23, reach: 265, startup: 0.22, active: 0.16, recovery: 0.42, push: 11 })
});

export function isInHitRange(attacker, defender, reach) {
  const dx = defender.x - attacker.x;
  return Math.abs(dx) <= reach && (dx === 0 || Math.sign(dx) === attacker.facing);
}

export function comboDamage(baseDamage, comboCount) {
  const step = Math.max(0, Math.min(3, comboCount - 1));
  return Math.round(baseDamage * (1 + step * 0.12) * 10) / 10;
}

export function nextCombo(previousCount, elapsedSinceHit) {
  return elapsedSinceHit <= 1.15 ? Math.min(4, previousCount + 1) : 1;
}
