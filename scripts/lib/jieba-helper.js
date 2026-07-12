// jieba Chinese segmentation helper with graceful fallback
// Provides precise Chinese keyword matching to avoid false positives
// e.g., "高通量" (high throughput) should NOT match "高通" (Qualcomm)

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let jiebaInstance = null;
let useFallback = false;

// Track which 2-3 char keywords jieba recognizes as single words
// If jieba doesn't know a keyword, we fall back to substring matching
const jiebaKnownWords = new Set();

try {
  const { Jieba } = await import('@node-rs/jieba');
  const { dict } = await import('@node-rs/jieba/dict.js');
  jiebaInstance = Jieba.withDict(dict);

  // Load custom dictionary for Qualcomm-specific terms
  const customDictPath = path.join(__dirname, '..', 'config', 'custom-dict.txt');
  if (fs.existsSync(customDictPath)) {
    // Read custom dict and add words manually via loadDict
    // loadDict may fail with file path on some platforms, so we handle gracefully
    try {
      jiebaInstance.loadDict(customDictPath);
      console.log('[jieba] Custom dictionary loaded');
    } catch (e) {
      console.warn('[jieba] Custom dict load via path failed, trying content:', e.message);
      // Alternative: read file content and pass as string
      const content = fs.readFileSync(customDictPath, 'utf-8');
      try {
        jiebaInstance.loadDict(Buffer.from(content));
        console.log('[jieba] Custom dictionary loaded via buffer');
      } catch (e2) {
        console.warn('[jieba] Custom dict load failed entirely, using default only:', e2.message);
      }
    }
  }

  console.log('[jieba] Initialized successfully');
} catch (e) {
  console.warn('[jieba] @node-rs/jieba not available, using substring fallback:', e.message);
  useFallback = true;
}

/**
 * Check if jieba recognizes a keyword as a single word.
 * If not, we must use substring matching for that keyword.
 * Caches results for performance.
 */
function isJiebaKnown(keyword) {
  if (jiebaKnownWords.has(keyword)) return true;
  if (jiebaKnownWords.has(`!${keyword}`)) return false;
  if (!jiebaInstance) return false;

  // Segment the keyword itself — if jieba returns it as a single word, it's known
  const seg = jiebaInstance.cut(keyword, false);
  const known = seg.length === 1 && seg[0] === keyword;

  if (known) {
    jiebaKnownWords.add(keyword);
  } else {
    jiebaKnownWords.add(`!${keyword}`);
  }
  return known;
}

// Known false positive pairs: when the keyword is found as a substring of
// a longer jieba word, these longer words should NOT count as a match.
// e.g., "高通" should not match inside "高通量" (high throughput)
const FALSE_POSITIVE_WORDS = new Set([
  '高通量', '高通路', '高通度', '高通滤波',
]);

/**
 * Check if a jieba-segmented word contains the keyword as a meaningful subword.
 * Returns true unless the word is a known false positive.
 */
function wordContainsKeyword(word, keyword) {
  if (!word.includes(keyword)) return false;
  if (FALSE_POSITIVE_WORDS.has(word)) return false;
  return true;
}

/**
 * Segment Chinese text into words using jieba
 * @param {string} text
 * @returns {string[]} array of words
 */
export function segment(text) {
  if (useFallback || !jiebaInstance) {
    return [text];
  }
  return jiebaInstance.cut(text, false);
}

/**
 * Check if text contains a keyword.
 * - English/ASCII keywords: word-boundary regex match (\b)
 * - Chinese keywords 4+ chars: substring match (false positive rate negligible)
 * - Chinese keywords 2-3 chars recognized by jieba: jieba exact word match (precise)
 * - Chinese keywords 2-3 chars NOT recognized by jieba: substring match (fallback)
 *
 * @param {string} text - the text to search
 * @param {string} keyword - the keyword to find
 * @returns {boolean}
 */
export function containsKeyword(text, keyword) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const lowerKw = keyword.toLowerCase();

  // English/ASCII keywords: word boundary match
  if (/^[a-zA-Z0-9\s\-.+_/]+$/.test(keyword)) {
    const escaped = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText);
  }

  // Chinese keywords 4+ chars: substring match is safe
  if ([...keyword].length >= 4) {
    return text.includes(keyword);
  }

  // Chinese keywords 2-3 chars
  if (useFallback || !jiebaInstance) {
    return text.includes(keyword);
  }

  // If jieba knows this keyword, use precise word matching
  if (isJiebaKnown(keyword)) {
    const words = jiebaInstance.cut(text, false);
    // Match if keyword appears as exact word OR as substring of a longer word
    // (e.g., "苹果" in "苹果公司"), but exclude known false positives
    return words.some(w => w === keyword || wordContainsKeyword(w, keyword));
  }

  // If jieba doesn't know this keyword (e.g., 骁龙, 安蒙),
  // fall back to substring matching — false positive risk is negligible
  // for domain-specific proper nouns
  return text.includes(keyword);
}

/**
 * Count occurrences of a keyword in text.
 * Same matching rules as containsKeyword but returns count.
 *
 * @param {string} text
 * @param {string} keyword
 * @returns {number}
 */
export function countKeyword(text, keyword) {
  if (!text) return 0;
  const lowerText = text.toLowerCase();
  const lowerKw = keyword.toLowerCase();

  // English: word boundary regex
  if (/^[a-zA-Z0-9\s\-.+_/]+$/.test(keyword)) {
    const escaped = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = lowerText.match(new RegExp(`\\b${escaped}\\b`, 'gi'));
    return matches ? matches.length : 0;
  }

  // Chinese 4+ chars: count substring occurrences
  if ([...keyword].length >= 4) {
    let count = 0;
    let idx = text.indexOf(keyword);
    while (idx !== -1) {
      count++;
      idx = text.indexOf(keyword, idx + keyword.length);
    }
    return count;
  }

  // Chinese 2-3 chars
  if (useFallback || !jiebaInstance) {
    let count = 0;
    let idx = text.indexOf(keyword);
    while (idx !== -1) {
      count++;
      idx = text.indexOf(keyword, idx + keyword.length);
    }
    return count;
  }

  // If jieba knows this keyword, use word frequency
  if (isJiebaKnown(keyword)) {
    const words = jiebaInstance.cut(text, false);
    return words.filter(w => w === keyword || wordContainsKeyword(w, keyword)).length;
  }

  // Fallback: substring count for unknown words
  let count = 0;
  let idx = text.indexOf(keyword);
  while (idx !== -1) {
    count++;
    idx = text.indexOf(keyword, idx + keyword.length);
  }
  return count;
}
