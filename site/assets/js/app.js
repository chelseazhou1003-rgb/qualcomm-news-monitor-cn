// app.js — SPA 主程序，中文界面

import { initRouter } from './router.js';
import { loadSection, loadLatest, loadSources, loadSectionHistory } from './data-loader.js';
import { renderArticleList, renderDashboard, buildSourceOptions, updateMasthead, renderBriefing } from './render.js';
import { initFilters } from './filters.js';
import { escapeHtml, formatShortDate, $ } from './utils.js';

// ===== 板块元数据 =====
const SECTION_META = {
  'core-businesses': {
    title: '核心业务',
    desc: '半导体芯片、无线通信、移动芯片、PC芯片与计算平台、汽车芯片与平台、IoT与XR。',
    subs: [
      { id: 'semiconductors', label: '半导体' },
      { id: 'wireless', label: '无线通信' },
      { id: 'mobile-chips', label: '移动芯片' },
      { id: 'pc-chips-computing', label: 'PC芯片' },
      { id: 'automotive', label: '汽车' },
      { id: 'iot-xr', label: 'IoT与XR' },
    ],
  },
  'ip-legal': {
    title: '知识产权与法律',
    desc: '标准必要专利、知识产权、专利诉讼、FRAND与授权争议、监管与反垄断。',
    subs: [
      { id: 'sep', label: '标准必要专利' },
      { id: 'ip', label: '知识产权' },
      { id: 'patent-litigation', label: '专利诉讼' },
      { id: 'frand-licensing', label: 'FRAND与授权' },
      { id: 'regulatory-antitrust', label: '监管与反垄断' },
    ],
  },
  'growth-areas': {
    title: '增长领域',
    desc: '端侧AI与边缘AI、AI PC、具身智能与机器人、车载信息娱乐与ADAS、XR与空间计算、数据中心。',
    subs: [
      { id: 'on-device-ai', label: '端侧AI/边缘AI' },
      { id: 'ai-pc', label: 'AI PC' },
      { id: 'embodied-ai-robotics', label: '具身智能与机器人' },
      { id: 'in-vehicle-infotainment-adas', label: '车载信息娱乐与ADAS' },
      { id: 'xr-spatial-computing', label: 'XR/空间计算' },
      { id: 'data-center', label: '数据中心' },
    ],
  },
  'macro-environment': {
    title: '宏观环境',
    desc: '客户与合作伙伴、供应链、地缘政治与出口管制、市场表现。',
    subs: [
      { id: 'customers-partners', label: '客户与合作伙伴' },
      { id: 'supply-chain', label: '供应链' },
      { id: 'market-performance', label: '市场表现' },
      { id: 'geopolitics-export-controls', label: '地缘政治与出口管制' },
    ],
  },
  'competitors': {
    title: '竞争对手',
    desc: '苹果与华为的竞争性知识产权、专利及标准必要专利动态。',
    subs: [
      { id: 'apple', label: '苹果' },
      { id: 'huawei', label: '华为' },
    ],
  },
  'stakeholders': {
    title: '关键利益相关方',
    desc: '3GPP、ETSI、IEEE、Wi-Fi联盟、蓝牙SIG、USB-IF、O-RAN联盟、监管机构、行业协会、OEM客户、代工厂、平台合作伙伴。',
    subs: [
      { id: '3gpp', label: '3GPP' },
      { id: 'etsi', label: 'ETSI' },
      { id: 'ieee', label: 'IEEE' },
      { id: 'wi-fi-alliance', label: 'Wi-Fi联盟' },
      { id: 'bluetooth-sig', label: '蓝牙SIG' },
      { id: 'usb-if', label: 'USB-IF' },
      { id: 'o-ran', label: 'O-RAN联盟' },
      { id: 'regulators', label: '监管机构' },
      { id: 'industry-assoc', label: '行业协会' },
      { id: 'oem', label: 'OEM客户' },
      { id: 'foundry', label: '代工厂' },
      { id: 'platform-partner', label: '平台合作伙伴' },
    ],
  },
};

// ===== 启动 =====
async function boot() {
  initHamburger();

  const latest = await loadLatest();
  if (latest) updateMasthead(latest);

  let currentSectionId = null;
  let currentSectionArticles = [];

  initRouter(async (route, opts = {}) => {
    const main = document.getElementById('app-content');
    if (!main) return;

    if (opts.paramsOnly && route.type === 'section' && route.id === currentSectionId) {
      applyFilteredView(currentSectionArticles, route.params);
      return;
    }

    if (route.type === 'dashboard') {
      currentSectionId = null;
      await renderDashboardView(main, latest);
    } else if (route.type === 'section') {
      currentSectionId = route.id;
      const data = await renderSectionView(main, route.id, route.params);
      currentSectionArticles = data?.articles || [];
    } else if (route.type === 'about') {
      currentSectionId = null;
      await renderAboutView(main, latest);
    }
  });
}

function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('primary-nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

// ===== 仪表盘视图 =====
async function renderDashboardView(main, latest) {
  if (!latest) latest = await loadLatest();

  main.innerHTML = `
    <div class="section-header" style="border-bottom:2px solid var(--ink);">
      <h1 class="section-title">今日简报</h1>
      <p class="body-text section-desc" id="total-articles">${latest ? `共 ${latest.totalArticles || 0} 篇文章，覆盖 6 个板块` : '加载中...'}</p>
    </div>
    <div class="mt-8">
      <div class="dashboard-grid" id="dashboard-grid">
        ${renderDashboard(latest)}
      </div>
    </div>
  `;

  if (!latest) {
    document.getElementById('dashboard-grid').innerHTML =
      '<div class="empty-state"><div class="empty-state-title">无法加载数据</div><div class="empty-state-desc">请稍后再试。</div></div>';
  }
}

// ===== 板块视图 =====
async function renderSectionView(main, sectionId, params) {
  const meta = SECTION_META[sectionId] || { title: sectionId, desc: '', subs: [] };
  const data = await loadSection(sectionId);

  // Sort by date descending
  if (data && data.articles) {
    data.articles.sort((a, b) => {
      const da = new Date(a.publishedAt || a.isoDate || 0).getTime();
      const db = new Date(b.publishedAt || b.isoDate || 0).getTime();
      return db - da;
    });
  }

  const briefingHtml = data ? renderBriefing(data) : '';

  main.innerHTML = `
    <div class="section-header">
      <h1 class="section-title" id="section-title">${escapeHtml(meta.title)}</h1>
      <p class="body-text section-desc">${escapeHtml(meta.desc)}</p>
      <p class="body-xs mt-2" id="section-count">${data ? `${data.articles?.length || 0} 篇文章` : '加载中...'}</p>
    </div>
    <div class="section-layout mt-6">
      <div>
        ${briefingHtml ? `<div id="briefing-container">${briefingHtml}</div>` : ''}
        <div id="articles-container">${data ? renderArticleList(data.articles || []) : '<div class="skeleton-card"><div class="skeleton skeleton-line-lg" style="width:80%;"></div><div class="skeleton skeleton-line" style="width:100%;"></div></div>'}</div>
        <div id="history-container"></div>
      </div>
      <aside class="sticky-sidebar" id="filter-sidebar">
        ${renderFilterSidebar(meta, params)}
      </aside>
    </div>
  `;

  if (!data) {
    document.getElementById('articles-container').innerHTML =
      '<div class="empty-state"><div class="empty-state-title">无法加载数据</div></div>';
    return null;
  }

  const sourceSelect = document.getElementById('filter-source');
  if (sourceSelect) {
    sourceSelect.innerHTML = await buildSourceOptions();
    if (params.source) sourceSelect.value = params.source;
  }

  const searchInput = document.getElementById('filter-search');
  if (searchInput && params.search) {
    searchInput.value = params.search;
  }

  if (params.sub) {
    const activeSubs = params.sub.split(',').filter(Boolean);
    document.querySelectorAll('.filter-chip').forEach(chip => {
      if (activeSubs.includes(chip.dataset.sub)) chip.classList.add('active');
    });
  }

  initFilters(data.articles || [], (filtered) => {
    document.getElementById('articles-container').innerHTML = renderArticleList(filtered);
  });

  loadAndRenderHistory(sectionId);

  const filterToggle = document.getElementById('filter-toggle');
  const filterBar = document.getElementById('filter-bar');
  if (filterToggle && filterBar) {
    filterToggle.addEventListener('click', () => filterBar.classList.toggle('collapsed'));
  }

  return data;
}

function applyFilteredView(articles, params) {
  const sourceSelect = document.getElementById('filter-source');
  if (sourceSelect) sourceSelect.value = params.source || '';

  const searchInput = document.getElementById('filter-search');
  if (searchInput) searchInput.value = params.search || '';

  const chips = document.querySelectorAll('.filter-chip');
  const activeSubs = (params.sub || '').split(',').filter(Boolean);
  chips.forEach(chip => {
    chip.classList.toggle('active', activeSubs.includes(chip.dataset.sub));
  });

  let filtered = [...articles];
  if (params.source) filtered = filtered.filter(a => a.sourceId === params.source);
  if (params.sub) {
    const subs = params.sub.split(',').filter(Boolean);
    if (subs.length > 0) filtered = filtered.filter(a => subs.includes(a.subCategory));
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q) ||
      (a.source || '').toLowerCase().includes(q)
    );
  }

  document.getElementById('articles-container').innerHTML = renderArticleList(filtered);
}

// ===== 筛选侧边栏 =====
function renderFilterSidebar(meta, params) {
  const subChips = meta.subs.map(s =>
    `<button class="filter-chip" data-sub="${s.id}">${escapeHtml(s.label)}</button>`
  ).join('');

  return `
    <button class="filter-toggle" id="filter-toggle">筛选 ▾</button>
    <div class="filter-bar" id="filter-bar">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3);">
        <span class="filter-heading" style="margin-bottom:0;">筛选</span>
        <a href="#" class="filter-clear" id="filter-clear">清除全部</a>
      </div>
      <p class="body-xs" id="filter-active-count" style="margin-bottom:var(--space-3);"></p>

      <div class="filter-group">
        <label class="filter-label">来源</label>
        <select class="filter-select" id="filter-source"><option value="">全部来源</option></select>
      </div>

      <div class="filter-group">
        <label class="filter-label">子分类</label>
        <div class="filter-chips">${subChips}</div>
      </div>

      <div class="filter-group">
        <label class="filter-label">搜索</label>
        <input type="text" class="search-input" id="filter-search" placeholder="搜索文章..." value="${escapeHtml(params.search || '')}">
      </div>
    </div>
  `;
}

// ===== 近14天历史 =====
async function loadAndRenderHistory(sectionId) {
  const container = document.getElementById('history-container');
  if (!container) return;

  container.innerHTML = `
    <div class="history-divider"></div>
    <div class="date-section">
      <h3 class="date-section-heading">近14天</h3>
      <div class="skeleton skeleton-line" style="width:60%;margin-bottom:var(--space-3);"></div>
      <div class="skeleton skeleton-line" style="width:80%;"></div>
    </div>
  `;

  try {
    const history = await loadSectionHistory(sectionId, 14);
    renderHistorySection(container, history);
  } catch (err) {
    console.warn('加载历史失败:', err);
    container.innerHTML = '';
  }
}

function renderHistorySection(container, history) {
  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="history-divider"></div>
      <div class="date-section">
        <h3 class="date-section-heading">近14天</h3>
        <p class="body-xs" style="color:var(--ink-faint);">该板块近14天暂无文章。</p>
      </div>
    `;
    return;
  }

  const today = new Date();
  today.setHours(today.getHours() + 8);
  const todayStr = today.toISOString().slice(0, 10);

  const seenUrls = new Set();
  const allArticles = [];
  for (const day of history) {
    for (const article of (day.articles || [])) {
      const pubDate = (article.publishedAt || '').split('T')[0];
      if (pubDate === todayStr) continue;

      const key = article.url || article.title;
      if (seenUrls.has(key)) continue;
      seenUrls.add(key);

      allArticles.push({ ...article, archiveDate: day.date });
    }
  }

  if (allArticles.length === 0) {
    container.innerHTML = `
      <div class="history-divider"></div>
      <div class="date-section">
        <h3 class="date-section-heading">近14天</h3>
        <p class="body-xs" style="color:var(--ink-faint);">该板块近14天暂无文章。</p>
      </div>
    `;
    return;
  }

  const byDate = {};
  for (const a of allArticles) {
    const d = a.archiveDate;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(a);
  }

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  let html = '<div class="history-divider"></div>';
  html += '<h3 class="history-section-title">近14天</h3>';

  for (const dateStr of dates) {
    const arts = byDate[dateStr];
    html += `<div class="date-section">`;
    html += `<h4 class="date-section-heading">${formatShortDate(dateStr)} <span class="date-section-count">${arts.length} 篇文章</span></h4>`;
    html += renderArticleList(arts);
    html += `</div>`;
  }

  container.innerHTML = html;
}

// ===== 关于页面 =====
async function renderAboutView(main, latest) {
  const sources = await loadSources();

  const sourcesTableHtml = sources.length > 0
    ? sources.map(s => `
        <tr>
          <td>${escapeHtml(s.name)}</td>
          <td><span class="source-group-badge badge-${s.group}">${escapeHtml(s.groupLabel || s.group)}</span></td>
          <td>${s.feedType || (s.hasRss ? '原生RSS' : 'RSSHub')}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3">加载中...</td></tr>';

  main.innerHTML = `
    <div class="section-header" style="border-bottom:2px solid var(--ink);">
      <h1 class="section-title">关于与方法论</h1>
      <p class="body-text section-desc">本监控站的工作原理及注意事项。</p>
    </div>

    <div class="mt-8">
      <div class="about-section">
        <h3>项目简介</h3>
        <p>高通新闻监控（中文版）从国内主流媒体聚合与高通公司相关的每日新闻报道。系统每小时自动更新，涵盖六大板块：核心业务、知识产权与法律、增长领域、宏观环境、竞争对手及关键利益相关方。</p>
        <p>数据来源包括科技媒体、财经媒体、半导体行业媒体、通信行业媒体、官方媒体及内容平台，通过 RSSHub 和原生 RSS 采集。</p>
      </div>

      <div class="about-section">
        <h3>数据来源（${sources.length} 个源）</h3>
        <div style="overflow-x:auto;">
          <table class="source-table">
            <thead><tr><th>来源</th><th>分组</th><th>采集方式</th></tr></thead>
            <tbody id="sources-tbody">${sourcesTableHtml}</tbody>
          </table>
        </div>
      </div>

      <div class="about-section">
        <h3>方法论</h3>
        <p>文章通过 RSSHub 和原生 RSS 每小时抓取一次。每篇文章经过 jieba 中文分词精确匹配关键词筛选，去重后按板块和子分类自动打标签。</p>
        <p>地缘政治相关文章无需包含"高通"关键词即可收录，但仅限于"宏观环境"板块。知识产权与法律板块严格要求文章包含高通相关关键词。</p>
        <p>竞争对手板块仅监测苹果和华为，且要求文章同时包含竞品关键词与专利/IP/SEP相关词汇（AND 条件匹配）。</p>
      </div>

      <div class="about-section">
        <h3>注意事项</h3>
        <p>这是一个自动化新闻聚合工具，与高通公司无任何隶属关系。所有内容版权归原发布媒体所有，本站仅提供链接索引。</p>
        <p>由于 RSSHub 部分路由依赖目标网站结构，个别来源可能偶尔无法抓取。系统已内置容错机制，单次抓取失败不影响其他来源。</p>
      </div>
    </div>
  `;
}

// ===== 启动 =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
