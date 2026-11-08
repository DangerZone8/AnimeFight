export class AdaptiveCPU {
  constructor({ difficulty = "normal", personality = "tactician" } = {}) {
    this.difficulty = difficulty;
    this.personality = personality;
    this.history = [];
    this.lastAction = "approach";
    this.cooldown = 0;
    this.reaction = { easy: 0.62, normal: 0.42, hard: 0.27, expert: 0.18, nightmare: 0.12 }[difficulty] ?? 0.42;
  }

  observe(playerAction) {
    if (!playerAction) return;
    this.history.push(playerAction);
    if (this.history.length > 18) this.history.shift();
  }

  get tendencies() {
    const counts = { attack: 0, heavy: 0, special: 0, guard: 0, jump: 0 };
    for (const action of this.history) if (action in counts) counts[action]++;
    return counts;
  }

  choose(s) {
    const { distance, selfHealth, enemyHealth, selfEnergy, enemyAction, selfCooldown = 0 } = s;
    const t = this.tendencies;
    const total = Object.values(t).reduce((a,b)=>a+b,0);
    const aggressive = this.personality === "berserker";
    const defensive = this.personality === "guardian";
    const repeatedAttacks = total > 3 && (t.attack + t.heavy) / total > 0.58;
    const close = distance < 112;
    const danger = enemyAction === "attack" || enemyAction === "heavy" || enemyAction === "special";

    if (selfHealth < 24 && selfEnergy >= 35 && close && !selfCooldown) return "special";
    if (danger && Math.random() > this.reaction) return defensive || repeatedAttacks ? "guard" : "evade";
    if (repeatedAttacks && close && Math.random() > this.reaction) return "counter";
    if (selfEnergy >= 55 && close && !selfCooldown && (aggressive || enemyHealth < 35)) return "special";
    if (!close) return Math.random() < (aggressive ? 0.78 : 0.62) ? "approach" : "guard";
    if (defensive && Math.random() < 0.35) return "guard";
    if (aggressive) return Math.random() < 0.7 ? "heavy" : "attack";
    return Math.random() < 0.24 ? "heavy" : "attack";
  }
}