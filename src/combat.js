export const MAX_STAMINA = 100;
export const SUPER_STAMINA_COST = MAX_STAMINA;

export function addStamina(current, amount) {
  return Math.min(MAX_STAMINA, Math.max(0, current) + Math.max(0, amount));
}

export function canUseSuper(stamina) {
  return stamina >= SUPER_STAMINA_COST;
}

export function spendSuper(stamina) {
  return canUseSuper(stamina) ? stamina - SUPER_STAMINA_COST : stamina;
}

export const ATTACKS = Object.freeze({
  punch: Object.freeze({ damage: 6, reach: 88, push: 3, staminaGain: 12, cooldown: 0.2 }),
  kick: Object.freeze({ damage: 11, reach: 112, push: 7, staminaGain: 16, cooldown: 0.34 }),
  grab: Object.freeze({ damage: 15, reach: 62, push: 10, staminaGain: 20, cooldown: 0.55, ignoresGuard: true }),
  super: Object.freeze({ damage: 28, reach: 270, push: 13, staminaGain: 0, cooldown: 0.9 }),
  bossSuper: Object.freeze({ damage: 48, reach: 310, push: 18, staminaGain: 0, cooldown: 1.25 })
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
