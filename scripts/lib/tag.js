// Chinese section tagger — assigns articles to sections based on keyword frequency scoring
// Uses jieba-based precise Chinese keyword matching
//
// Key rules:
// - Articles with geopoliticalBypass=true are restricted to macro-environment section ONLY
// - Competitor section requires AND condition: competitor keyword + IP/patent/SEP co-occurrence
// - Best section wins by total keyword frequency score

import { SECTION_KEYWORDS, COMPETITOR_KEYWORDS, COMPETITOR_CONDITIONS, STAKEHOLDER_KEYWORDS } from '../config/keywords.js';
import { containsKeyword, countKeyword } from './jieba-helper.js';

/**
 * Check if competitor AND condition is met (competitor keyword + IP/patent/SEP)
 */
function checkCompetitorCondition(text, competitorId) {
  const keywords = COMPETITOR_KEYWORDS[competitorId] || [];
  const hasCompetitor = keywords.some(kw => containsKeyword(text, kw));
  if (!hasCompetitor) return false;

  const conditions = COMPETITOR_CONDITIONS[competitorId] || [];
  return conditions.some(kw => containsKeyword(text, kw));
}

/**
 * Tag an article with section, subCategory, subLabel, and cross-tags
 * @param {Object} article
 * @returns {Object} the tagged article
 */
export function tagArticle(article) {
  const title = article.title || '';
  const description = article.description || '';
  const content = article.content || article.contentSnippet || article.summary || '';
  const text = `${title} ${description} ${content}`;

  const isGeopoliticalBypass = article.geopoliticalBypass === true;

  // Score each section
  const sectionScores = {};
  const subCategoryScores = {};

  for (const [sectionId, sectionData] of Object.entries(SECTION_KEYWORDS)) {
    // Geopolitical bypass restriction: only macro-environment allowed
    if (isGeopoliticalBypass && sectionId !== 'macro-environment') {
      continue;
    }

    let sectionTotal = 0;

    for (const [subId, keywords] of Object.entries(sectionData.subs)) {
      // Competitor section: check AND condition before scoring
      if (sectionId === 'competitors') {
        if (!checkCompetitorCondition(text, subId)) {
          continue;
        }
      }

      let subScore = 0;
      for (const kw of keywords) {
        const count = countKeyword(text, kw);
        subScore += count;
      }

      if (subScore > 0) {
        const key = `${sectionId}.${subId}`;
        subCategoryScores[key] = subScore;
        sectionTotal += subScore;
      }
    }

    if (sectionTotal > 0) {
      sectionScores[sectionId] = sectionTotal;
    }
  }

  // Find best section
  let bestSection = null;
  let bestScore = 0;
  for (const [sectionId, score] of Object.entries(sectionScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestSection = sectionId;
    }
  }

  // Geopolitical bypass fallback: if no Macro subcategory matched, default to geopolitics-export-controls
  if (isGeopoliticalBypass && (!bestSection || bestSection !== 'macro-environment')) {
    bestSection = 'macro-environment';
    subCategoryScores['macro-environment.geopolitics-export-controls'] = 1;
  }

  // Default fallback
  if (!bestSection) {
    bestSection = 'core-businesses';
  }

  // Find best subcategory within the winning section
  let bestSub = null;
  let bestSubScore = 0;
  for (const [key, score] of Object.entries(subCategoryScores)) {
    if (key.startsWith(`${bestSection}.`)) {
      if (score > bestSubScore) {
        bestSubScore = score;
        bestSub = key.split('.')[1];
      }
    }
  }

  article.section = bestSection;
  article.subCategory = bestSub || '';
  article.tagScore = bestScore;

  // Cross-tagging: check if article also matches competitor or stakeholder keywords
  // (for display in those sections even if primary section is different)
  article.crossTags = [];

  // Competitor cross-tag (requires AND condition)
  if (bestSection !== 'competitors') {
    for (const competitorId of Object.keys(COMPETITOR_KEYWORDS)) {
      if (checkCompetitorCondition(text, competitorId)) {
        article.crossTags.push({ type: 'competitor', id: competitorId });
      }
    }
  }

  // Stakeholder cross-tag
  if (bestSection !== 'stakeholders') {
    for (const [stakeholderId, keywords] of Object.entries(STAKEHOLDER_KEYWORDS)) {
      const hasMatch = keywords.some(kw => containsKeyword(text, kw));
      if (hasMatch) {
        article.crossTags.push({ type: 'stakeholder', id: stakeholderId });
      }
    }
  }

  return article;
}

/**
 * Tag all articles and group by section
 * @param {Array} articles
 * @returns {Object} { bySection: { sectionId: [articles] }, all: [articles] }
 */
export function tagAndGroup(articles) {
  const tagged = articles.map(a => tagArticle(a));

  const bySection = {};
  for (const article of tagged) {
    const section = article.section;
    if (!bySection[section]) bySection[section] = [];

    // Add to primary section
    bySection[section].push(article);

    // Add to cross-tagged sections
    if (article.crossTags) {
      for (const crossTag of article.crossTags) {
        const targetSection = crossTag.type === 'competitor' ? 'competitors' : 'stakeholders';
        if (section !== targetSection) {
          if (!bySection[targetSection]) bySection[targetSection] = [];
          // Create a shallow copy with cross-tag info
          bySection[targetSection].push({
            ...article,
            isCrossTag: true,
            crossTagId: crossTag.id,
          });
        }
      }
    }
  }

  return { bySection, all: tagged };
}
