// Original, meme-style dialogue written for AnimeFight.
// Voices use the browser's available speech synthesis voices with broad delivery settings;
// no actor, anime character, or real person's voice is cloned or impersonated.
export const BANTER = Object.freeze({
  son: {
    voice: { pitch: 1.12, rate: 1.02 },
    intro: "You brought a challenge? Excellent. I was getting bored.",
    super: "KAIOKEN? No. This is the tax audit of destiny!",
    win: "That was a warm-up. The actual warm-up starts now."
  },
  ninja: {
    voice: { pitch: 1.2, rate: 1.08 },
    intro: "I never run from a fight. I run toward the snacks after.",
    super: "BELIEVE IT! Your health bar just got shadow-cloned!",
    win: "Another victory for the village. Somebody order ramen!"
  },
  captain: {
    voice: { pitch: 1.18, rate: 1.04 },
    intro: "I'm going to be king of the arena. Also, where's the meat?",
    super: "GUM-GUM: UNPAID INVOICE!",
    win: "Was that the boss? I thought it was the tutorial."
  },
  sorcerer: {
    voice: { pitch: 0.82, rate: 0.9 },
    intro: "Relax. I have already seen seventeen ways this goes wrong for you.",
    super: "DOMAIN EXPANSION: TERMS AND CONDITIONS!",
    win: "You couldn't even reach the loading screen."
  },
  blade: {
    voice: { pitch: 1.02, rate: 0.96 },
    intro: "I can smell your strategy. It smells like panic.",
    super: "WATER BREATHING: FLOOD THE GROUP CHAT!",
    win: "Your spirit is strong. Your blocking needs work."
  },
  reaper: {
    voice: { pitch: 0.9, rate: 0.96 },
    intro: "I was promised a difficult opponent. Was that a shipping error?",
    super: "BANKAI: FINAL WARNING FROM CUSTOMER SUPPORT!",
    win: "Tell the next challenger to bring a receipt."
  },
  homunculus: {
    voice: { pitch: 1.04, rate: 1.0 },
    intro: "Equivalent exchange: you bring confidence, I take it away.",
    super: "TRANSMUTATION CIRCLE: YOUR WIFI IS NOW 2G!",
    win: "Alchemy says your comeback is mathematically impossible."
  },
  hero: {
    voice: { pitch: 0.78, rate: 0.88 },
    intro: "I had a coupon for a sale. Is this going to take long?",
    super: "SERIOUS SERIES: ONE-PUNCH PERFORMANCE REVIEW!",
    win: "Nice. Now, does this arena have a supermarket?"
  },
  yatra: {
    voice: { pitch: 1.02, rate: 0.95 },
    intro: "A new journey begins. Please keep your potatoes inside the vehicle.",
    super: "ALOO SE SONA! One side potato, other side GOLD! The opponent is now premium produce!",
    win: "Journey complete. Your health insurance claim is pending."
  },
  deedee: {
    voice: { pitch: 0.92, rate: 0.94 },
    intro: "Dharna shuru. Nobody leaves until the dramatic music arrives.",
    super: "JADU HOBE! The spell is cast. Even your shadow has switched sides!",
    win: "Meeting adjourned. Your defeat has been recorded in triplicate."
  }
});

export function getBanter(characterId, moment) {
  return BANTER[characterId]?.[moment] ?? "";
}
