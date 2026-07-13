// render.js — 渲染文章卡片、仪表盘、简报

import { formatTimeAgo, formatShortDate, escapeHtml } from './utils.js';
import { loadSection, loadSources } from './data-loader.js';

// 子分类中文标签映射
const SUB_LABELS_CN = {
  semiconductors: '半导体',
  wireless: '无线通信',
  'mobile-chips': '移动芯片',
  'pc-chips-computing': 'PC芯片与计算',
  automotive: '汽车',
  'iot-xr': 'IoT与XR',
  sep: '标准必要专利',
  ip: '知识产权',
  'patent-litigation': '专利诉讼',
  'frand-licensing': 'FRAND与授权',
  'regulatory-antitrust': '监管与反垄断',
  'on-device-ai': '端侧AI/边缘AI',
  'ai-pc': 'AI PC',
  'embodied-ai-robotics': '具身智能与机器人',
  'in-vehicle-infotainment-adas': '车载信息娱乐与ADAS',
  'xr-spatial-computing': 'XR/空间计算',
  'data-center': '数据中心',
  'customers-partners': '客户与合作伙伴',
  'supply-chain': '供应链',
  'geopolitics-export-controls': '地缘政治与出口管制',
  'market-performance': '市场表现',
  apple: '苹果',
  huawei: '华为',
  '3gpp': '3GPP',
  etsi: 'ETSI',
  ieee: 'IEEE',
  'wi-fi-alliance': 'Wi-Fi联盟',
  'bluetooth-sig': '蓝牙SIG',
  'usb-if': 'USB-IF',
  'o-ran': 'O-RAN联盟',
  regulators: '监管机构',
  'industry-assoc': '行业协会',
  oem: 'OEM客户',
  foundry: '代工厂',
  'platform-partner': '平台与生态合作伙伴',
};

// 源分组中文标签
const GROUP_LABELS_CN = {
  tech: '科技媒体',
  finance: '财经媒体',
  semiconductor: '半导体行业',
  telecom: '通信行业',
  official: '官方媒体',
  platform: '内容平台',
};

// 截断过长摘要，避免显示全文
function truncateSummary(text, maxLen = 300) {
  if (!text || text.length <= maxLen) return text;
  // 尝试在句号、问号、感叹号或换行处截断
  const truncated = text.substring(0, maxLen);
  const breakPoint = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('\n'),
  );
  if (breakPoint > maxLen * 0.5) {
    return truncated.substring(0, breakPoint + 1) + '...';
  }
  return truncated + '...';
}
export function renderArticleCard(article) {
  const timeDisplay = article.publishedAt ? formatTimeAgo(article.publishedAt) : '';
  const groupLabel = GROUP_LABELS_CN[article.sourceGroup] || article.sourceGroup || '';
  const groupBadge = article.sourceGroup
    ? `<span class="source-group-badge badge-${article.sourceGroup}">${escapeHtml(groupLabel)}</span>`
    : '';

  const tags = [];
  if (article.subCategory) {
    const subLabel = article.subLabel || SUB_LABELS_CN[article.subCategory] || article.subCategory;
    tags.push(`<span class="tag-chip">${escapeHtml(subLabel)}</span>`);
  }
  if (article.competitors && article.competitors.length > 0) {
    for (const comp of article.competitors) {
      const label = SUB_LABELS_CN[comp] || comp;
      tags.push(`<span class="tag-chip competitor">${escapeHtml(label)}</span>`);
    }
  }

  const tagsHtml = tags.length > 0 ? `<div class="tag-row">${tags.join('')}</div>` : '';

  return `
    <article class="article-card" data-id="${escapeHtml(article.id || '')}">
      <div class="article-meta">
        <span class="article-source">${escapeHtml(article.source || '')}</span>
        ${groupBadge}
        <span class="article-dot"></span>
        <span class="article-time meta-text">${timeDisplay}</span>
      </div>
      <a href="${escapeHtml(article.url || '#')}" target="_blank" rel="noopener" class="article-headline-link">
        <h3 class="article-headline">${escapeHtml(article.title || '')}</h3>
      </a>
      ${article.summary ? `<p class="article-summary">${escapeHtml(truncateSummary(article.summary))}</p>` : ''}
      ${tagsHtml}
      <a href="${escapeHtml(article.url || '#')}" target="_blank" rel="noopener" class="read-original">阅读原文 — ${escapeHtml(article.source || '')}</a>
    </article>
  `;
}

// 渲染文章列表
export function renderArticleList(articles) {
  if (!articles || articles.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📰</div>
        <div class="empty-state-title">暂无匹配文章</div>
        <div class="empty-state-desc">请调整筛选条件，或稍后再来查看更新。</div>
      </div>
    `;
  }
  return articles.map(renderArticleCard).join('');
}

// 渲染简报块
export function renderBriefing(data) {
  const articles = data.articles || [];
  if (articles.length === 0) return '';

  const today = new Date();
  today.setHours(today.getHours() + 8);
  const todayStr = today.toISOString().slice(0, 10);

  const todayArticles = articles.filter(a => (a.publishedAt || '').split('T')[0] === todayStr);

  if (todayArticles.length === 0) {
    // Show all articles if none from today
    const sourceNames = [...new Set(articles.map(a => a.source))].slice(0, 5);
    const dateDisplay = formatShortDate(data.date || todayStr);
    return `
      <div class="briefing-block">
        <div class="briefing-label">板块简报</div>
        <p class="briefing-summary briefing-body">${dateDisplay} — 共 ${articles.length} 篇文章，来源：${sourceNames.join('、')}。</p>
      </div>
    `;
  }

  const sourceNames = [...new Set(todayArticles.map(a => a.source))].slice(0, 5);
  const dateDisplay = formatShortDate(todayStr);

  const takeawaysHtml = todayArticles.slice(0, 5).map(a => {
    const desc = (a.summary || '').length > 150
      ? a.summary.substring(0, 147) + '...'
      : (a.summary || a.title);
    return `
      <div class="takeaway-item">
        <span class="takeaway-bullet">&bull;</span>
        <span class="takeaway-text briefing-takeaway">
          ${escapeHtml(desc)}
          <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener" class="takeaway-source-link">${escapeHtml(a.source)}</a>
        </span>
      </div>
    `;
  }).join('');

  return `
    <div class="briefing-block">
      <div class="briefing-label">今日简报 <span class="briefing-date-badge">${todayArticles.length} 篇文章</span></div>
      <p class="briefing-summary briefing-body">${dateDisplay} — ${todayArticles.length} 篇文章，来源：${sourceNames.join('、')}。</p>
      ${takeawaysHtml ? `<div class="takeaways-list">${takeawaysHtml}</div>` : ''}
    </div>
  `;
}

// 渲染仪表盘卡片
export function renderDashboard(latest) {
  if (!latest || !latest.sections) return '';

  return Object.entries(latest.sections).map(([id, info]) => {
    const topHeadline = info.topHeadline || '暂无文章';
    const todayCount = info.todayCount || 0;

    return `
      <a href="#/${id}" class="dashboard-card">
        <h3 class="dashboard-card-title">${escapeHtml(info.title || id)}</h3>
        <div class="dashboard-card-count">
          ${todayCount} 篇文章
        </div>
        <p class="dashboard-card-headline">${escapeHtml(topHeadline)}</p>
        <span class="dashboard-card-link">查看板块 →</span>
      </a>
    `;
  }).join('');
}

// 构建来源筛选选项
export async function buildSourceOptions() {
  const sources = await loadSources();
  const groups = {};

  for (const s of sources) {
    const group = GROUP_LABELS_CN[s.group] || s.group || '其他';
    if (!groups[group]) groups[group] = [];
    groups[group].push(s);
  }

  let html = '<option value="">全部来源</option>';
  for (const [group, srcs] of Object.entries(groups)) {
    html += `<optgroup label="${escapeHtml(group)}">`;
    for (const s of srcs) {
      html += `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`;
    }
    html += '</optgroup>';
  }
  return html;
}

// 更新页头日期信息
export function updateMasthead(data) {
  const dateEl = document.getElementById('masthead-date');
  const updatedEl = document.getElementById('masthead-updated');

  if (dateEl && data) {
    const dateStr = data.date || '';
    dateEl.textContent = dateStr ? formatShortDate(data.date) : '';
  }
  if (updatedEl) {
    updatedEl.textContent = '每小时自动更新 (北京时间)';
  }
}
