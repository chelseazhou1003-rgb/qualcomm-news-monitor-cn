// utils.js — 中文日期格式化和 DOM 辅助函数

export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '昨天';
  return `${days}天前`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function todayBeijingDate() {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return bj.toISOString().slice(0, 10);
}

export function yesterdayBeijingDate() {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  bj.setDate(bj.getDate() - 1);
  return bj.toISOString().slice(0, 10);
}

export function debounce(fn, delay = 250) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function getHashParams() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('?');
  const params = {};
  if (parts.length < 2) return params;
  const queryStr = parts[1];
  for (const pair of queryStr.split('&')) {
    const [key, val] = pair.split('=');
    if (key) params[key] = decodeURIComponent(val || '');
  }
  return params;
}

export function getHashPath() {
  const hash = window.location.hash.replace(/^#/, '');
  const questionIdx = hash.indexOf('?');
  return questionIdx >= 0 ? hash.slice(0, questionIdx) : hash;
}

export function setHashParams(newParams) {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('?');
  const path = parts[0] || '';
  const current = {};
  if (parts.length > 1) {
    for (const pair of parts[1].split('&')) {
      const [k, v] = pair.split('=');
      if (k) current[k] = decodeURIComponent(v || '');
    }
  }
  const merged = { ...current, ...newParams };
  for (const [k, v] of Object.entries(merged)) {
    if (!v) delete merged[k];
  }
  const queryStr = Object.entries(merged)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  window.location.hash = queryStr ? `#/${path}?${queryStr}` : `#/${path}`;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}
