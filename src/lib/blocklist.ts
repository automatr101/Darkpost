/**
 * Blocklist of terms that violate community guidelines.
 * Case-insensitive, whole-word match only (regex word boundaries).
 * This is NOT a replacement for human moderation (post-MVP).
 * It is a minimum safety net.
 */
export const BLOCKED_TERMS: string[] = [
  // Slurs and hate speech (redacted for safety, representative list)
  'nigger', 'nigga', 'faggot', 'fag', 'dyke', 'tranny', 'retard',
  'spic', 'wetback', 'chink', 'gook', 'kike', 'towelhead', 'raghead',
  'coon', 'darkie', 'beaner', 'cracker',
  // Threats and violence
  'kill yourself', 'kys', 'go die', 'i will kill', 'gonna kill',
  'shoot up', 'bomb threat', 'murder you', 'slit your throat',
  'hang yourself', 'drink bleach', 'neck yourself',
  // Self-harm encouragement
  'cut yourself', 'end it all', 'you should die',
  // Doxxing
  'dox', 'doxx', 'swat',
  // CSAM
  'child porn', 'cp links', 'underage nudes',
  // Extreme content
  'rape', 'molest', 'pedophile', 'pedo',
  // Additional harmful terms
  'school shooter', 'pipe bomb', 'mass shooting',
];
