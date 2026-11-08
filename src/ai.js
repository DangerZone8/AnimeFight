const DIFFICULTY = Object.freeze({
  easy:     { reaction: 0.76, thinkRate: 1.8, moveSpeed: 2.25, cooldownScale: 1.12, damageScale: 0.9 },
  normal:   { reaction: 0.56, thinkRate: 2.8, moveSpeed: 2.8,  cooldownScale: 1.0,  damageScale: 1.0 },
  hard:     { reaction: 0.36, thinkRate: 3.8, moveSpeed: 3.25, cooldownScale: 0.9,  damageScale: 1.06 },
  expert:   { reaction: 0.22, thinkRate: 4.8, moveSpeed: 3.7,  cooldownScale: 0.82, damageScale: 1.12 },
  nightmare:{ reaction: 0.12, thinkRate: 5.8, moveSpeed: 4.05, cooldownScale: 0.74, damageScale: 1.18 }
});

export class AdaptiveCPU {
  constructor({ difficulty = "normal", personality = "tactician" } = {}) {
    this.difficulty = DIFFICULTY[difficulty] ? difficulty : "normal";
    this.personality = personality;
    this.history = [];
    this.lastAction = "approach";
    this.cooldown = 0;
    Object.assign(this, DIFFICULTY[this.difficulty]);
  }

  observe(playerAction) {
    if (!playerAction) return;
    this.history.push(playerAction);
    if (this.history.length > 18) this.history.shift();
  }

  get tendencies() {
    const counts = { attack: 0, heavy: 0, special: 0, guard: 0, jump: 0, approach: 0 };
    for (const action of this.history) if (action in counts) counts[action]++;
    return counts;
  }

  choose(s) {
    const { distance, selfHealth, enemyHealth, selfEnergy, enemyAction, selfCooldown = 0 } = s;
    const t = this.tendencies;
    const total = Object.values(t).reduce((a, b) => a + b, 0);
    const aggressive = this.personality === "berserker";
    const defensive = this.personality === "guardian";
    const attackRate = total ? (t.attack + t.heavy + t.special) / total : 0;
    const guardRate = total ? t.guard / total : 0;
    const repeatedAttacks = total > 3 && (t.attack + t.heavy) / total > 0.58;
    const specialHabit = total > 3 && t.special / total > 0.34;
    const close = distance < 124;
    const danger = enemyAction === "attack" || enemyAction === "heavy" || enemyAction === "special";

    // High-value defensive reads take priority over random aggression.
    if (danger && Math.random() > this.reaction) {
      if (defensive || specialHabit) return "guard";
      if (repeatedAttacks) return "counter";
      return "evade";
    }
    if (close && guardRate > 0.42 && Math.random() > this.reaction) return "grab";
    if (specialHabit && close && Math.random() > this.reaction) return "evade";
    if (repeatedAttacks && close && Math.random() > this.reaction) return "counter";

    // Spend meter intelligently instead of wasting specials at long range.
    if (selfHealth < 30 && selfEnergy >= 35 && close && !selfCooldown) return "special";
    if (selfEnergy >= (aggressive ? 42 : 52) && close && !selfCooldown &&
        (aggressive || enemyHealth < 48 || this.difficulty === "expert" || this.difficulty === "nightmare")) return "special";

    if (!close) return Math.random() < (aggressive ? 0.9 : 0.82) ? "approach" : "guard";
    if (defensive && Math.random() < 0.24) return "guard";
    if (attackRate < 0.16 && total >= 6) return "heavy";
    if (aggressive) return Math.random() < 0.82 ? "heavy" : "attack";
    if (this.difficulty === "nightmare" || this.difficulty === "expert") {
      return Math.random() < 0.58 ? "heavy" : "attack";
    }
    return Math.random() < 0.38 ? "heavy" : "attack";
  }
}
