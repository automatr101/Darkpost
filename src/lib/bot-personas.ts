/**
 * Bot Persona Generator
 * Creates realistic, randomized identities for artificial users.
 */

const ADJECTIVES = ['Silent', 'Dark', 'Ghost', 'Hidden', 'Midnight', 'Secret', 'Shadow', 'Lonely', 'Drifting', 'Vague', 'Broken', 'Healed', 'Waiting'];
const NOUNS = ['Speaker', 'Echo', 'Drifter', 'Soul', 'Spirit', 'Observer', 'Shadow', 'Phantom', 'Dreamer', 'Rebel', 'Truth', 'Mask'];

const BIOS = [
  'Just here to share what I cannot say aloud.',
  'Finding light in the shadows of the enclave.',
  'Sharing secrets one post at a time.',
  'A shadow with a story to tell.',
  'Waiting for the truth to be enough.',
  'Sometimes the silence is too loud.',
  'Just a ghost in the machine.',
];

/**
 * Generate a random, unique-ish username for a bot.
 */
export function generateBotUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)].toLowerCase();
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)].toLowerCase();
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `${adj}_${noun}_${num}`;
}

/**
 * Generate a randomized persona object.
 */
export function generateBotPersona() {
  const username = generateBotUsername();
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const displayName = `${adjective} ${noun}`;
  const bio = BIOS[Math.floor(Math.random() * BIOS.length)];
  
  return {
    username,
    displayName,
    bio,
  };
}
