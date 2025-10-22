// ✅ util.js
import crypto from 'crypto';

export function analyzeString(value) {
  const length = value.length;
  const is_palindrome = value.toLowerCase() === value.split('').reverse().join('').toLowerCase();
  const unique_characters = new Set(value).size;
  const word_count = value.trim().split(/\s+/).length;
  const sha256_hash = crypto.createHash('sha256').update(value).digest('hex');

  const character_frequency_map = {};
  for (let char of value) {
    character_frequency_map[char] = (character_frequency_map[char] || 0) + 1;
  }

  return {
    id: sha256_hash,
    value,
    properties: {
      length,
      is_palindrome,
      unique_characters,
      word_count,
      sha256_hash,
      character_frequency_map
    },
    created_at: new Date().toISOString()
  };
}
