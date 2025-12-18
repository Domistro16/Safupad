export interface CardData {
  id: string;
  type: "project" | "instant";
  status: "live" | "upcoming" | "ended";
  icon: string;
  title: string;
  sub: string;
  pills: [string, string][];
  desc: string;
  creator: string;
  raised: string;
  progress: number;
  substats: [string, string];
}

export const cards: CardData[] = [
  {
    id: "safu-ai",
    type: "project",
    status: "live",
    icon: "🤖",
    title: "SafuAI",
    sub: "$SAFUAI",
    pills: [
      ["Project Raise", "safu-pill-project"],
      ["Live", "safu-pill-live"],
    ],
    desc: "AI-powered security scanner for smart contracts on BNB Chain.",
    creator: "0x1234...abcd",
    raised: "12.5 BNB",
    progress: 62,
    substats: ["Target: 20 BNB", "2d 14h left"],
  },
  {
    id: "defi-guard",
    type: "project",
    status: "live",
    icon: "🛡️",
    title: "DeFi Guard",
    sub: "$GUARD",
    pills: [
      ["Project Raise", "safu-pill-project"],
      ["Live", "safu-pill-live"],
    ],
    desc: "Decentralized insurance protocol protecting DeFi users from exploits.",
    creator: "0x5678...efgh",
    raised: "8.2 BNB",
    progress: 41,
    substats: ["Target: 20 BNB", "3d 8h left"],
  },
  {
    id: "meme-rocket",
    type: "instant",
    status: "live",
    icon: "🚀",
    title: "MemeRocket",
    sub: "$ROCKET",
    pills: [
      ["Instant", "safu-pill-instant"],
      ["Live", "safu-pill-live"],
    ],
    desc: "Community-driven meme token with automatic buyback mechanism.",
    creator: "0x9abc...ijkl",
    raised: "45.8 BNB",
    progress: 92,
    substats: ["Cap: 50 BNB", "Graduating soon"],
  },
  {
    id: "yield-farm",
    type: "project",
    status: "upcoming",
    icon: "🌾",
    title: "YieldFarm Pro",
    sub: "$YIELD",
    pills: [
      ["Project Raise", "safu-pill-project"],
      ["Upcoming", "safu-pill-upcoming"],
    ],
    desc: "Next-gen yield aggregator with cross-chain farming strategies.",
    creator: "0xdef0...mnop",
    raised: "0 BNB",
    progress: 0,
    substats: ["Target: 15 BNB", "Starts in 12h"],
  },
  {
    id: "nft-verse",
    type: "instant",
    status: "live",
    icon: "🎨",
    title: "NFTverse",
    sub: "$NFTV",
    pills: [
      ["Instant", "safu-pill-instant"],
      ["Live", "safu-pill-live"],
    ],
    desc: "NFT marketplace with integrated social features and creator tools.",
    creator: "0x1357...qrst",
    raised: "28.3 BNB",
    progress: 57,
    substats: ["Cap: 50 BNB", "Active trading"],
  },
  {
    id: "game-fi",
    type: "project",
    status: "ended",
    icon: "🎮",
    title: "GameFi Hub",
    sub: "$GFHUB",
    pills: [
      ["Project Raise", "safu-pill-project"],
      ["Ended", "safu-pill-ended"],
    ],
    desc: "Play-to-earn gaming platform connecting multiple blockchain games.",
    creator: "0x2468...uvwx",
    raised: "20 BNB",
    progress: 100,
    substats: ["Target: 20 BNB", "Graduated ✓"],
  },
];

export const heroStack = [
  { id: "hero-back", wrapClass: "hero-card-back", cardId: "defi-guard" },
  { id: "hero-mid", wrapClass: "hero-card-mid", cardId: "meme-rocket" },
  { id: "hero-front", wrapClass: "hero-card-front", cardId: "safu-ai" },
];
