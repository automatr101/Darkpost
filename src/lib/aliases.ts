import { createHash } from 'crypto';

const ADJECTIVES = [
  'Silent', 'Electric', 'Midnight', 'Shadow', 'Frozen', 'Velvet', 'Broken',
  'Golden', 'Hidden', 'Hollow', 'Neon', 'Phantom', 'Scarlet', 'Twisted',
  'Crimson', 'Silver', 'Ancient', 'Fading', 'Burning', 'Shattered',
  'Drifting', 'Ghostly', 'Iron', 'Wandering', 'Savage', 'Lonely',
  'Stolen', 'Wicked', 'Pale', 'Rusted', 'Cruel', 'Gentle', 'Bitter',
  'Sacred', 'Restless', 'Vivid', 'Sunken', 'Fierce', 'Quiet', 'Blazing',
  'Haunted', 'Wild', 'Dim', 'Lost', 'Reckless', 'Tender', 'Stark',
  'Veiled', 'Muted', 'Radiant',
];

const NOUNS = [
  'Fox', 'Storm', 'Falcon', 'Wolf', 'Raven', 'Echo', 'Ghost', 'Ember',
  'Specter', 'Cipher', 'Drift', 'Void', 'Signal', 'Ash', 'Tide', 'Flare',
  'Comet', 'Dusk', 'Veil', 'Pulse', 'Wraith', 'Shade', 'Frost', 'Spark',
  'Thorn', 'Blade', 'Crow', 'Moth', 'Hawk', 'Lynx', 'Sage', 'Wisp',
  'Flame', 'Reed', 'Stone', 'Fang', 'Mist', 'Gale', 'Bolt', 'Shard',
  'Orbit', 'Cinder', 'Hymn', 'Knell', 'Oracle', 'Wren', 'Owl', 'Bear',
  'Pike', 'Haze',
];

/**
 * Generates a deterministic, un-traceable alias from a post ID.
 * The alias is the SAME every time the same post is loaded.
 * It is NOT stored in the database — derived from the post ID only.
 */
export function getAlias(postId: string): string {
  const salt = process.env.ALIAS_SALT || '0d46816ab9e5c9a0937a85eb7bc1b6a2';
  const hash = createHash('sha256').update(postId + salt).digest();

  const bigInt = hash.readBigUInt64BE(0);
  const adjIndex = Number(bigInt % BigInt(ADJECTIVES.length));
  const nounIndex = Number((bigInt >> 16n) % BigInt(NOUNS.length));

  return `Anonymous ${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`;
}
