// filters.js — 客户端筛选 UI

import { renderArticleList } from './render.js';
import { getHashParams, setHashParams, debounce, $, $$ } from './utils.js';

let currentArticles = [];
let onFilterCallback = null;

export function initFilters(articles, onFilterChange) {
  currentArticles = articles;
  onFilterCallback = onFilterChange;

  const params = getHashParams();
  if (Object.keys(params).length > 0) {
    const result = applyFilterFn(articles, params);
    onFilterChange(result);
  }

  const sourceSelect = $('#filter-source');
  if (sourceSelect) {
    sourceSelect.addEventListener('change', () => {
      const val = sourceSelect.value;
      setHashParams({ source: val });
      const result = applyFilterFn(currentArticles, getHashParams());
      onFilterCallback(result);
    });
  }

  $$('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const active = $$('.filter-chip.active').map(c => c.dataset.sub).join(',');
      setHashParams({ sub: active || null });
      const result = applyFilterFn(currentArticles, getHashParams());
      onFilterCallback(result);
    });
  });

  const searchInput = $('#filter-search');
  if (searchInput) {
    const debouncedSearch = debounce(() => {
      setHashParams({ search: searchInput.value || null });
      const result = applyFilterFn(currentArticles, getHashParams());
      onFilterCallback(result);
    }, 300);
    searchInput.addEventListener('input', debouncedSearch);
  }

  const clearBtn = $('#filter-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (sourceSelect) sourceSelect.value = '';
      if (searchInput) searchInput.value = '';
      $$('.filter-chip').forEach(c => c.classList.remove('active'));
      const hash = window.location.hash.replace(/^#\/?/, '');
      const path = hash.split('?')[0] || '';
      window.location.hash = `#/${path}`;
      onFilterCallback([...currentArticles]);
    });
  }

  const filterToggle = $('#filter-toggle');
  const filterBar = $('#filter-bar');
  if (filterToggle && filterBar) {
    filterToggle.addEventListener('click', () => filterBar.classList.toggle('collapsed'));
  }

  updateFilterCount(params);
}

function applyFilterFn(articles, params) {
  let filtered = [...articles];

  if (params.source) {
    filtered = filtered.filter(a => a.sourceId === params.source);
  }
  if (params.sub) {
    const activeSubs = params.sub.split(',').filter(Boolean);
    if (activeSubs.length > 0) {
      filtered = filtered.filter(a => activeSubs.includes(a.subCategory));
    }
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q) ||
      (a.source || '').toLowerCase().includes(q)
    );
  }

  updateFilterCount(params);
  return filtered;
}

function updateFilterCount(params) {
  const countEl = $('#filter-active-count');
  if (countEl) {
    const activeCount = Object.values(params || {}).filter(v => v).length;
    countEl.textContent = activeCount > 0 ? `${activeCount} 个筛选条件生效` : '';
  }
}

export function updateArticles(articles) {
  currentArticles = articles;
}
