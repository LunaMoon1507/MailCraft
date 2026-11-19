// Level formula from README §8: level = floor(sqrt(xp / 10)) + 1,
// so level L starts at 10 * (L - 1)^2 XP.
export function levelProgress(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 10)) + 1;
  const start = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return {
    level,
    /** XP earned since this level started. */
    into: xp - start,
    /** XP this level takes in total. */
    needed: next - start,
    /** XP still missing to reach the next level. */
    toNext: next - xp,
    /** 0 to 1, for a ProgressBar. */
    fraction: (xp - start) / (next - start),
  };
}
