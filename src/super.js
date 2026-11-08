// Original, procedural super-move direction and sound signatures.
// No recorded anime audio, voice cloning, or external assets are used.
export const SUPER_PROFILES = Object.freeze({
  son: { style:"solar", label:"SOLAR SYSTEM TAX AUDIT", wave:"sawtooth", notes:[110,220,330,660], meme:"Your power level has been forwarded to the department of financial consequences." },
  ninja: { style:"clones", label:"SHADOW CLONE GROUP PROJECT", wave:"triangle", notes:[392,523,784,1046], meme:"You got jumped by the entire class. Nobody did the homework." },
  captain: { style:"rubber", label:"GUM-GUM: INFINITE INVOICE", wave:"square", notes:[180,270,360,540], meme:"Your warranty does not cover being folded like laundry." },
  sorcerer: { style:"void", label:"DOMAIN EXPANSION: BAD VIBES ONLY", wave:"sine", notes:[70,140,280,560], meme:"Your personal space has been repossessed by the universe." },
  blade: { style:"water", label:"WATER BREATHING: FLOOD THE TIMELINE", wave:"sine", notes:[330,440,587,880], meme:"Even the ocean has muted your excuses." },
  reaper: { style:"crescent", label:"BANKAI: TERMS OF DEPARTURE", wave:"sawtooth", notes:[95,190,380,760], meme:"Your subscription to having a health bar has expired." },
  homunculus: { style:"alchemy", label:"TRANSMUTATION: WIFI DOWNGRADE", wave:"triangle", notes:[246,311,415,622], meme:"Equivalent exchange: one ego for one embarrassing replay." },
  hero: { style:"impact", label:"SERIOUS SERIES: PATCH NOTES", wave:"square", notes:[55,110,220,440], meme:"One punch. Zero lore. Maximum paperwork." },
  yatra: { style:"potato", label:"ALOO SE SONA: PREMIUM PRODUCE", wave:"triangle", notes:[196,247,392,784], meme:"One potato enters. The opponent's market value leaves." },
  deedee: { style:"hex", label:"JADU HOBE: ADMINISTRATOR MODE", wave:"sawtooth", notes:[207,311,466,932], meme:"Your shadow has resigned and joined the opposition." }
});

export function getSuperProfile(id) {
  return SUPER_PROFILES[id] ?? SUPER_PROFILES.son;
}
