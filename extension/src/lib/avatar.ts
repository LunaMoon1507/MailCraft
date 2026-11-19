import steve from '@graphics/8-steve.png';
import alex from '@graphics/25-alex.png';
import wolf from '@graphics/23-wolf.png';
import sheep from '@graphics/7-sheep.png';
import chicken from '@graphics/4-chicken.png';
import chick from '@graphics/18-chick.png';
import calf from '@graphics/13-calf.png';
import zombie from '@graphics/24-zombie.png';
import enderman from '@graphics/27-enderman.png';

// Character/mob images used as player avatars. Order matters: changing it
// changes everyone's avatar, so only ever add to the end.
const AVATARS = [steve, alex, wolf, sheep, chicken, chick, calf, zombie, enderman];

// Picks the same avatar for a username every time, on every device
// (a small string hash; no server or storage needed).
export function avatarFor(username: string) {
  let hash = 0;
  for (const char of username.toLowerCase()) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  }
  return AVATARS[hash % AVATARS.length]!;
}
