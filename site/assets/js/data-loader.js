// data-loader.js — 从打包的 data.js 加载数据 (window.__NEWS_DATA__)
// 统一字段名，兼容构建管道输出的字段

import { todayBeijingDate, yesterdayBeijingDate, formatDate } from './utils.js';

// 从全局变量获取打包数据
function getRawData() {
  return window.__NEWS_DATA__ || { sections: {}, archive: {}, sources: [], latest: null };
}

// 标准化文章字段，使前端渲染统一
function normalizeArticle(a) {
  return {
    ...a,
    id: a.id || a.url || a.title || '',
    source: a.sourceName || a.source || a.sourceId || '',
    sourceId: a.sourceId || '',
    sourceName: a.sourceName || a.source || '',
    sourceGroup: a.sourceGroup || '',
    publishedAt: a.isoDate || a.pubDate || a.publishedAt || '',
    summary: a.description || a.summary || '',
    title: a.title || '',
    url: a.url || a.link || '#',
    subCategory: a.subCategory || '',
    subLabel: a.subLabel || '',
    section: a.section || '',
    competitors: a.crossTags
      ? a.crossTags.filter(t => t.type === 'competitor').map(t => t.id)
      : (a.competitors || []),
  };
}

let _latestCache = null;

export async function loadLatest() {
  if (_latestCache) return _latestCache;

  const raw = getRawData();
  const today = todayBeijingDate();
  const sections = {};
  const sectionIds = ['core-businesses', 'competitors', 'growth-areas', 'ip-legal', 'macro-environment', 'stakeholders'];

  for (const id of sectionIds) {
    const data = raw.sections[id];
    if (!data) continue;

    const articles = (data.articles || []).map(normalizeArticle);
    sections[id] = {
      title: data.sectionTitle || id,
      articleCount: articles.length,
      todayCount: articles.length,
      topHeadline: articles.length > 0 ? articles[0].title : '暂无文章',
    };
  }

  const totalArticles = Object.values(sections).reduce((sum, s) => sum + s.articleCount, 0);

  _latestCache = {
    date: raw.latest?.date || today,
    generatedAt: raw.latest?.generatedAt || '',
    sections,
    totalArticles,
  };
  return _latestCache;
}

export async function loadSection(sectionId) {
  const raw = getRawData();
  const data = raw.sections[sectionId];
  if (!data) return null;

  return {
    ...data,
    articles: (data.articles || []).map(normalizeArticle),
  };
}

export async function loadSources() {
  const raw = getRawData();
  if (raw.sources && raw.sources.length > 0) {
    return raw.sources;
  }

  // Fallback: build from articles
  const sources = {};
  const sectionIds = ['core-businesses', 'competitors', 'growth-areas', 'ip-legal', 'macro-environment', 'stakeholders'];

  for (const id of sectionIds) {
    const data = raw.sections[id];
    if (!data || !data.articles) continue;
    for (const a of data.articles) {
      if (!sources[a.sourceId]) {
        sources[a.sourceId] = {
          id: a.sourceId,
          name: a.sourceName || a.sourceId,
          group: a.sourceGroup || 'other',
          groupLabel: a.sourceGroup || '其他',
        };
      }
    }
  }

  return Object.values(sources);
}

export async function loadArchive(dateStr) {
  const raw = getRawData();
  return raw.archive?.[dateStr] || null;
}

export async function loadSectionHistory(sectionId, days = 14) {
  const result = [];
  const today = todayBeijingDate();

  for (let i = 1; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    const dateStr = bj.toISOString().slice(0, 10);

    if (dateStr === today) continue;

    const archive = await loadArchive(dateStr);
    if (!archive || !archive.articles) continue;

    // Filter articles for this section
    const sectionArticles = archive.articles
      .map(normalizeArticle)
      .filter(a => a.section === sectionId);

    if (sectionArticles.length === 0) continue;

    result.push({ date: dateStr, articles: sectionArticles });
  }

  return result;
}

export function getDateOptions() {
  const options = [
    { value: todayBeijingDate(), label: '今天' },
    { value: yesterdayBeijingDate(), label: '昨天' },
  ];
  for (let i = 2; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    const dateStr = bj.toISOString().slice(0, 10);
    options.push({ value: dateStr, label: formatDate(dateStr) });
  }
  return options;
}

let sourcesMap = null;
export async function getSourceName(sourceId) {
  if (!sourcesMap) {
    const sources = await loadSources();
    sourcesMap = {};
    for (const s of sources) {
      sourcesMap[s.id] = s;
    }
  }
  return sourcesMap[sourceId]?.name || sourceId;
}
