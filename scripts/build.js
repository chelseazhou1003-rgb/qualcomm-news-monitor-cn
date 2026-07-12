// Main build pipeline for Chinese Qualcomm news monitor
// Flow: fetch RSS → filter (Qualcomm keywords + geopolitical bypass) → dedupe → tag sections → write JSON → bundle

import { fetchAllFeeds } from './lib/fetch-feeds.js';
import { filterQualcommRelevant, isWithinDateWindow } from './lib/filter.js';
import { tagAndGroup } from './lib/tag.js';
import { dedupeArticles } from './lib/dedupe.js';
import { writeJSON, readJSON, ensureDir, todayDate, beijingNow, daysAgoDate, listArchiveDates } from './lib/io.js';
import { SECTIONS } from './config/sections.js';
import { FEEDS, buildSourcesRegistry } from './config/feeds.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_DATA = path.join(ROOT, 'site', 'data');
const ARCHIVE_DIR = path.join(SITE_DATA, 'archive');

async function main() {
  console.log('========================================');
  console.log('  Qualcomm News Monitor CN — Build');
  console.log('  Time:', beijingNow());
  console.log('  Today:', todayDate());
  console.log('========================================\n');

  // Step 1: Fetch all feeds
  const rawArticles = await fetchAllFeeds(5);
  console.log(`Step 1: Fetched ${rawArticles.length} raw articles\n`);

  // Step 2: Filter for Qualcomm relevance
  const { passed, keywordRejected } = filterQualcommRelevant(rawArticles);
  console.log(`Step 2: Filter passed ${passed.length} / rejected ${keywordRejected.length} articles`);

  // Log geopolitical bypass count
  const geoBypassCount = passed.filter(a => a.geopoliticalBypass).length;
  if (geoBypassCount > 0) {
    console.log(`  (${geoBypassCount} via geopolitical bypass — restricted to Macro section)`);
  }
  console.log('');

  // Step 3: Deduplicate
  const deduped = dedupeArticles(passed);
  console.log(`Step 3: After dedup: ${deduped.length} articles (removed ${passed.length - deduped.length} duplicates)\n`);

  // Step 4: Filter by date (last 14 days)
  const recent = deduped.filter(a => isWithinDateWindow(a, 14));
  console.log(`Step 4: After date filter (14 days): ${recent.length} articles\n`);

  // Step 5: Tag sections
  const { bySection, all } = tagAndGroup(recent);
  console.log(`Step 5: Tagged ${all.length} articles into sections:`);
  for (const [sectionId, articles] of Object.entries(bySection)) {
    console.log(`  ${sectionId}: ${articles.length} articles`);
  }
  console.log('');

  // Step 6: Write section JSON files
  ensureDir(SITE_DATA);
  const generatedAt = beijingNow();
  const today = todayDate();

  for (const section of SECTIONS) {
    const articles = bySection[section.id] || [];
    // Sort by date descending
    articles.sort((a, b) => {
      const da = new Date(a.isoDate || a.pubDate || 0).getTime();
      const db = new Date(b.isoDate || b.pubDate || 0).getTime();
      return db - da;
    });

    const data = {
      date: today,
      generatedAt,
      section: section.id,
      sectionTitle: section.title,
      count: articles.length,
      articles,
    };

    writeJSON(path.join(SITE_DATA, `${section.id}.json`), data);
    console.log(`  Wrote ${section.id}.json (${articles.length} articles)`);
  }

  // Step 7: Write today's archive
  ensureDir(ARCHIVE_DIR);
  const archiveData = {
    date: today,
    generatedAt,
    count: all.length,
    articles: all,
  };
  writeJSON(path.join(ARCHIVE_DIR, `${today}.json`), archiveData);
  console.log(`\n  Wrote archive/${today}.json (${all.length} articles)`);

  // Step 8: Write sources registry
  const sources = buildSourcesRegistry();
  writeJSON(path.join(SITE_DATA, 'sources.json'), sources);
  console.log(`  Wrote sources.json (${sources.length} sources)`);

  // Step 9: Write latest.json (metadata)
  writeJSON(path.join(SITE_DATA, 'latest.json'), {
    date: today,
    generatedAt,
    totalArticles: all.length,
    sections: SECTIONS.map(s => ({
      id: s.id,
      title: s.title,
      count: (bySection[s.id] || []).length,
    })),
  });
  console.log(`  Wrote latest.json`);

  console.log('\n========================================');
  console.log('  Build complete!');
  console.log('========================================\n');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
