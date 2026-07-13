// Chinese keyword filter — gates articles before section tagging
// Three pass-through paths:
// 1. Contains QUALCOMM_KEYWORDS (高通/QCOM/安蒙/骁龙) → pass
// 2. Contains CONDITIONAL_KEYWORDS + Qualcomm brand → pass
// 3. Contains GEOPOLITICAL_KEYWORDS → pass with geopoliticalBypass flag (restricted to Macro in tag.js)

import { QUALCOMM_KEYWORDS, CONDITIONAL_KEYWORDS, GEOPOLITICAL_KEYWORDS, GEOPOLITICAL_CONTEXT_KEYWORDS } from '../config/keywords.js';
import { containsKeyword } from './jieba-helper.js';

/**
 * Filter articles for Qualcomm relevance.
 * @param {Array} articles
 * @returns {{ passed: Array, rejected: Array, keywordRejected: Array }}
 */
export function filterQualcommRelevant(articles) {
  const passed = [];
  const rejected = [];
  const keywordRejected = [];

  for (const article of articles) {
    const title = article.title || '';
    const content = article.content || article.contentSnippet || article.summary || '';
    const description = article.description || '';
    const text = `${title} ${description} ${content}`.toLowerCase();

    // Path 1: Check QUALCOMM_KEYWORDS
    const hasQualcomm = QUALCOMM_KEYWORDS.some(kw => containsKeyword(text, kw));

    if (hasQualcomm) {
      passed.push(article);
      continue;
    }

    // Path 2: Conditional keywords (3GPP/FRAND/SEP/标准必要专利) + Qualcomm brand
    if (CONDITIONAL_KEYWORDS.length > 0) {
      const hasConditional = CONDITIONAL_KEYWORDS.some(kw => containsKeyword(text, kw));
      const hasQualcommBrand = QUALCOMM_KEYWORDS.some(kw => containsKeyword(text, kw));

      if (hasConditional && hasQualcommBrand) {
        passed.push(article);
        continue;
      }
    }

    // Path 3: Geopolitical bypass — no Qualcomm needed, but restricted to Macro section
    // Requires BOTH a geopolitical keyword AND a secondary context keyword (semiconductor/tech policy)
    const hasGeopolitical = GEOPOLITICAL_KEYWORDS.some(kw => containsKeyword(text, kw));
    const hasGeoContext = GEOPOLITICAL_CONTEXT_KEYWORDS.some(kw => containsKeyword(text, kw));

    if (hasGeopolitical && hasGeoContext) {
      // Mark for Macro-only restriction in tag.js
      article.geopoliticalBypass = true;
      passed.push(article);
      continue;
    }

    // No match — reject
    keywordRejected.push(article);
  }

  return { passed, rejected, keywordRejected };
}

/**
 * Check if an article is within the date window (last N days)
 * @param {Object} article
 * @param {number} maxDays — max days old (default 14)
 * @returns {boolean}
 */
export function isWithinDateWindow(article, maxDays = 14) {
  const pubDate = article.isoDate || article.pubDate;
  if (!pubDate) return true; // keep if no date

  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return true;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= maxDays;
}
