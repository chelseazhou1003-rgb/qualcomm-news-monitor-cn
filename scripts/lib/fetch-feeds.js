// RSS feed fetcher — fetches articles from native RSS and RSSHub sources
// Uses rss-parser for RSS/Atom parsing

import Parser from 'rss-parser';
import { FEEDS, FEED_MAP } from '../config/feeds.js';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'QualcommNewsMonitor-CN/1.0 (RSS Reader)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

/**
 * Fetch a single feed and normalize articles
 */
async function fetchOne(feed) {
  const url = typeof feed.url === 'function' ? feed.url() : feed.url;
  if (!url) {
    console.warn(`  [${feed.id}] No URL, skipping`);
    return [];
  }

  try {
    const parsed = await parser.parseURL(url);
    if (!parsed.items || parsed.items.length === 0) {
      console.warn(`  [${feed.id}] No items returned from ${url}`);
      return [];
    }

    const articles = parsed.items.map(item => ({
      title: item.title || '',
      description: item.contentSnippet || item.content || item.summary || '',
      content: item.content || item['content:encoded'] || item.contentSnippet || '',
      url: item.link || item.guid || '',
      link: item.link || item.guid || '',
      pubDate: item.pubDate || item.isoDate || '',
      isoDate: item.isoDate || '',
      author: item.creator || item.author || '',
      sourceId: feed.id,
      sourceName: feed.name,
      sourceGroup: feed.group,
      fetchStrategy: feed.strategy,
    }));

    console.log(`  [${feed.id}] ${feed.name}: ${articles.length} articles`);
    return articles;
  } catch (err) {
    console.warn(`  [${feed.id}] ${feed.name} fetch failed: ${err.message}`);
    return [];
  }
}

/**
 * Fetch all feeds concurrently with a concurrency limit
 * @param {number} concurrency — max parallel fetches (default 5)
 * @returns {Array} all raw articles
 */
export async function fetchAllFeeds(concurrency = 5) {
  console.log(`\n=== Fetching ${FEEDS.length} feeds (concurrency: ${concurrency}) ===\n`);

  const allArticles = [];
  const batches = [];

  for (let i = 0; i < FEEDS.length; i += concurrency) {
    batches.push(FEEDS.slice(i, i + concurrency));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const results = await Promise.allSettled(batch.map(feed => fetchOne(feed)));

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    }
  }

  console.log(`\n=== Total raw articles fetched: ${allArticles.length} ===\n`);
  return allArticles;
}
