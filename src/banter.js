// Original meme-style dialogue written for AnimeFight.
// Speech synthesis uses the browser's available voices and broad delivery settings;
// no actor, anime character, or real person's voice is cloned or impersonated.
export const BANTER = Object.freeze({
  son: {
    voice: { pitch: 1.12, rate: 1.02 },
    intro: "You brought a challenge? Excellent. I was getting bored.",
    introJa: "勝負だ！今日は修行より君のプライドを鍛えよう！",
    super: "KAIOKEN? No. This is the tax audit of destiny!",
    superMeme: "Your power level has been forwarded to the department of financial consequences.",
    superJa: "逃げ道はないぞ！運命の請求書、受け取れ！",
    meme: "Bro really thought the tutorial was optional.",
    win: "That was a warm-up. The actual warm-up starts now."
  },
  ninja: {
    voice: { pitch: 1.2, rate: 1.08 },
    intro: "I never run from a fight. I run toward the snacks after.",
    introJa: "影分身！宿題もダメージも全部倍返しだ！",
    super: "BELIEVE IT! Your health bar just got shadow-cloned!",
    superMeme: "You got jumped by the entire class. Nobody did the homework.",
    superJa: "螺旋丸！その自信、今ここで吹き飛ばす！",
    meme: "The audacity. The confidence. The absolutely zero damage.",
    win: "Another victory for the village. Somebody order ramen!"
  },
  captain: {
    voice: { pitch: 1.18, rate: 1.04 },
    intro: "I'm going to be king of the arena. Also, where's the meat?",
    introJa: "海賊王になる！まずは君の体力バーからいただく！",
    super: "GUM-GUM: UNPAID INVOICE!",
    superMeme: "Your warranty does not cover being folded like laundry.",
    superJa: "ゴムゴムの一撃！請求書ごと吹き飛べ！",
    meme: "This is not a fight. This is a hostile takeover.",
    win: "Was that the boss? I thought it was the tutorial."
  },
  sorcerer: {
    voice: { pitch: 0.82, rate: 0.9 },
    intro: "Relax. I have already seen seventeen ways this goes wrong for you.",
    introJa: "大丈夫。君が負ける未来はもう見えている。",
    super: "DOMAIN EXPANSION: UNLIMITED PERSONAL SPACE VIOLATION! Turn around. Your aura is facing the wrong way!",
    superMeme: "Your personal space has been repossessed by the universe.",
    superJa: "領域展開！そのオーラ、向きが間違っているぞ！",
    meme: "You have mistaken my kindness for a functioning health bar.",
    win: "You couldn't even reach the loading screen."
  },
  blade: {
    voice: { pitch: 1.02, rate: 0.96 },
    intro: "I can smell your strategy. It smells like panic.",
    introJa: "全集中！その作戦、穴だらけだ！",
    super: "WATER BREATHING: FLOOD THE GROUP CHAT!",
    superMeme: "Even the ocean has muted your excuses.",
    superJa: "水の呼吸！言い訳まで洗い流す！",
    meme: "Respectfully, what was the plan here?",
    win: "Your spirit is strong. Your blocking needs work."
  },
  reaper: {
    voice: { pitch: 0.9, rate: 0.96 },
    intro: "I was promised a difficult opponent. Was that a shipping error?",
    introJa: "卍解の前に、まず君の自信を終わらせよう。",
    super: "BANKAI: FINAL WARNING FROM CUSTOMER SUPPORT!",
    superMeme: "Your subscription to having a health bar has expired.",
    superJa: "卍解！これは最後の警告だ！",
    meme: "Your subscription to having a health bar has expired.",
    win: "Tell the next challenger to bring a receipt."
  },
  homunculus: {
    voice: { pitch: 1.04, rate: 1.0 },
    intro: "Equivalent exchange: you bring confidence, I take it away.",
    introJa: "等価交換だ。君の自信と引き換えに勝利をもらう！",
    super: "TRANSMUTATION CIRCLE: YOUR WIFI IS NOW 2G!",
    superMeme: "Equivalent exchange: one ego for one embarrassing replay.",
    superJa: "錬成開始！そのラグごと吹き飛ばす！",
    meme: "I have calculated your odds. The calculator felt bad.",
    win: "Alchemy says your comeback is mathematically impossible."
  },
  hero: {
    voice: { pitch: 0.78, rate: 0.88 },
    intro: "I had a coupon for a sale. Is this going to take long?",
    introJa: "今日は特売日だ。君の体力も大幅値下げだな。",
    super: "SERIOUS SERIES: ONE-PUNCH PERFORMANCE REVIEW!",
    superMeme: "One punch. Zero lore. Maximum paperwork.",
    superJa: "本気シリーズ！一撃で反省会だ！",
    meme: "I came. I saw. I forgot why I came.",
    win: "Nice. Now, does this arena have a supermarket?"
  },
  yatra: {
    voice: { pitch: 1.02, rate: 0.95 },
    intro: "A new journey begins. Please keep your potatoes inside the vehicle.",
    introJa: "旅の始まりだ！じゃがいもはシートベルトを締めて！",
    super: "ALOO SE SONA! One side potato, other side GOLD! The opponent is now premium produce!",
    superMeme: "One potato enters. The opponent's market value leaves.",
    superJa: "ポテト投入！ゴールド完成！相手は高級野菜になった！",
    meme: "One potato enters. One opponent's confidence leaves.",
    win: "Journey complete. Your health insurance claim is pending."
  },
  deedee: {
    voice: { pitch: 0.92, rate: 0.94 },
    intro: "Dharna shuru. Nobody leaves until the dramatic music arrives.",
    introJa: "呪文の時間だ！君の影も降参したぞ！",
    super: "JADU HOBE! The spell is cast. Even your shadow has switched sides!",
    superMeme: "Your shadow has resigned and joined the opposition.",
    superJa: "黒い魔法よ、目覚めよ！影までこちらの味方だ！",
    meme: "The vibes are cursed. The paperwork is worse.",
    win: "Meeting adjourned. Your defeat has been recorded in triplicate."
  }
});

export function getBanter(characterId, moment) {
  return BANTER[characterId]?.[moment] ?? "";
}
