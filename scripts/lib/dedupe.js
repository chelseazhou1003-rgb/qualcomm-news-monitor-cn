// Deduplication — remove duplicate articles by URL and by title similarity

/**
 * Normalize a URL for comparison (strip tracking params, normalize trailing slash)
 */
function normalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  // Remove query params that are tracking-related
  u = u.replace(/[?&](utm_[^&]*|fbclid|gclid|source|medium|campaign|ref|from)[^&]*/gi, '');
  // Normalize trailing slash
  u = u.replace(/\/+$/, '');
  // Remove fragment
  u = u.replace(/#.*$/, '');
  return u.toLowerCase();
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title.trim()
    .replace(/\s+/g, ' ')
    .replace(/[""'']/g, '')
    .toLowerCase();
}

/**
 * Check if two titles are similar enough to be duplicates
 * Uses simple character overlap ratio for Chinese text
 */
function titlesSimilar(title1, title2) {
  const t1 = normalizeTitle(title1);
  const t2 = normalizeTitle(title2);
  if (t1 === t2) return true;
  if (t1.length < 5 || t2.length < 5) return false;

  // Check if one contains the other (for truncated titles)
  if (t1.includes(t2) || t2.includes(t1)) return true;

  // Character-level Jaccard similarity for Chinese
  const chars1 = new Set([...t1]);
  const chars2 = new Set([...t2]);
  const intersection = [...chars1].filter(c => chars2.has(c)).length;
  const union = new Set([...chars1, ...chars2]).size;
  return intersection / union > 0.85;
}

/**
 * Deduplicate articles by URL and title similarity
 * @param {Array} articles
 * @returns {Array} deduplicated articles
 */
export function dedupeArticles(articles) {
  const seen = new Set();
  const result = [];

  for (const article of articles) {
    const url = normalizeUrl(article.url || article.link);
    const title = normalizeTitle(article.title);

    // Check URL dedup
    if (url && seen.has(`url:${url}`)) continue;

    // Check title dedup
    let isDup = false;
    for (const existing of result) {
      if (titlesSimilar(title, normalizeTitle(existing.title))) {
        isDup = true;
        break;
      }
    }
    if (isDup) continue;

    if (url) seen.add(`url:${url}`);
    result.push(article);
  }

  return result;
}
