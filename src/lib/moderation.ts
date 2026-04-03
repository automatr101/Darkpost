import { BLOCKED_TERMS } from './blocklist';

/**
 * Checks if the given text contains any blocked content.
 * Case-insensitive, whole-word match only (regex word boundaries)
 * to avoid false positives on substrings.
 */
export function containsBlockedContent(text: string): boolean {
  const lowerText = text.toLowerCase();

  for (const term of BLOCKED_TERMS) {
    // Use word boundary regex for single words, simple includes for phrases
    if (term.includes(' ')) {
      // Multi-word phrases: simple case-insensitive check
      if (lowerText.includes(term.toLowerCase())) {
        return true;
      }
    } else {
      // Single words: use word boundaries to avoid substring matches
      const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
      if (regex.test(text)) {
        return true;
      }
    }
  }

  return false;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
