export const assetBase = `${import.meta.env.BASE_URL}assets`;

export const promo = {
  boxHero: `${assetBase}/promo/box-hero.jpg`,
  boxThumb: `${assetBase}/promo/box-thumb.jpg`,
  logo: `${assetBase}/promo/logo.png`,
  title: `${assetBase}/promo/title.png`,
  setup: `${assetBase}/promo/setup.jpg`,
  banner: `${assetBase}/promo/bga-banner.jpg`,
  rulesPdf: `${assetBase}/promo/rules.pdf`,
};

export const gems = {
  emerald: `${assetBase}/gems/emerald.svg`,
  sapphire: `${assetBase}/gems/sapphire.svg`,
  ruby: `${assetBase}/gems/ruby.svg`,
  diamond: `${assetBase}/gems/diamond.svg`,
  onyx: `${assetBase}/gems/onyx.svg`,
  gold: `${assetBase}/gems/gold.svg`,
  pearl: `${assetBase}/gems/pearl.svg`,
} as const;

export const nobleSample = `${assetBase}/nobles/sample.jpg`;

/** Portraits for the 10 base-game nobles (ids 1–10). */
export const noblePortraits: Record<number, string> = {
  1: `${assetBase}/nobles/noble-01.jpg`,
  2: `${assetBase}/nobles/noble-02.jpg`,
  3: `${assetBase}/nobles/noble-03.jpg`,
  4: `${assetBase}/nobles/noble-04.jpg`,
  5: `${assetBase}/nobles/noble-05.jpg`,
  6: `${assetBase}/nobles/noble-06.jpg`,
  7: `${assetBase}/nobles/noble-07.jpg`,
  8: `${assetBase}/nobles/noble-08.jpg`,
  9: `${assetBase}/nobles/noble-09.jpg`,
  10: `${assetBase}/nobles/noble-10.jpg`,
};

export function noblePortraitUrl(id: number): string | undefined {
  return noblePortraits[id];
}

/** Seat avatars for standard practice (keyed by SeatNameKey). */
export const playerPortraits = {
  you: `${assetBase}/players/player-you.jpg`,
  marco: `${assetBase}/players/player-marco.jpg`,
  lucrezia: `${assetBase}/players/player-lucrezia.jpg`,
  cosimo: `${assetBase}/players/player-cosimo.jpg`,
  isabella: `${assetBase}/players/player-isabella.jpg`,
} as const;

export function playerPortraitUrl(
  nameKey: keyof typeof playerPortraits,
): string {
  return playerPortraits[nameKey];
}

export const solo3 = {
  aiCards19: `${assetBase}/solo3/ai-cards-1-9.jpg`,
  aiCards1012: `${assetBase}/solo3/ai-cards-10-12.jpg`,
  tokenBoard: `${assetBase}/solo3/page5.jpg`,
  cardBacks: `${assetBase}/solo3/page2.jpg`,
};
