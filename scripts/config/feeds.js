// Chinese media feed configuration
// Sources: native RSS + RSSHub (runs as Docker container in GitHub Actions)
// RSSHub base URL is configurable via env var, defaults to localhost:1200

const RSSHUB_BASE = process.env.RSSHUB_BASE || 'http://localhost:1200';

export const FEED_GROUPS = {
  tech: { label: '科技媒体', color: 'teal' },
  finance: { label: '财经媒体', color: 'navy' },
  semiconductor: { label: '半导体行业', color: 'slate' },
  telecom: { label: '通信行业', color: 'olive' },
  official: { label: '官方媒体', color: 'crimson' },
  platform: { label: '内容平台', color: 'plum' },
};

function rsshub(route) {
  return `${RSSHUB_BASE}${route}`;
}

export const FEEDS = [
  // === 科技媒体 ===
  {
    id: '36kr',
    name: '36氪',
    group: 'tech',
    strategy: 'rss',
    url: 'https://36kr.com/feed',
  },
  {
    id: 'huxiu',
    name: '虎嗅',
    group: 'tech',
    strategy: 'rss',
    url: 'https://www.huxiu.com/rss/0.xml',
  },
  {
    id: 'ifanr',
    name: '爱范儿',
    group: 'tech',
    strategy: 'rss',
    url: 'https://www.ifanr.com/feed',
  },
  {
    id: 'ithome',
    name: 'IT之家',
    group: 'tech',
    strategy: 'rss',
    url: 'https://www.ithome.com/rss/',
  },
  {
    id: 'tmtpost',
    name: '钛媒体',
    group: 'tech',
    strategy: 'rsshub',
    rsshubRoute: '/tmtpost/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'qbitai',
    name: '量子位',
    group: 'tech',
    strategy: 'rsshub',
    rsshubRoute: '/qbitai/articles',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'zhidx',
    name: '智东西',
    group: 'tech',
    strategy: 'rsshub',
    rsshubRoute: '/zhidx/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'sina-tech',
    name: '新浪科技',
    group: 'tech',
    strategy: 'rsshub',
    rsshubRoute: '/sina/tech',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'tencent-tech',
    name: '腾讯科技',
    group: 'tech',
    strategy: 'rsshub',
    rsshubRoute: '/tencent/news',
    get url() { return rsshub(this.rsshubRoute); },
  },

  // === 财经媒体 ===
  {
    id: 'yicai',
    name: '第一财经',
    group: 'finance',
    strategy: 'rsshub',
    rsshubRoute: '/yicai/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'caixin',
    name: '财新网',
    group: 'finance',
    strategy: 'rsshub',
    rsshubRoute: '/caixin/latest',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'jiemian',
    name: '界面新闻',
    group: 'finance',
    strategy: 'rsshub',
    rsshubRoute: '/jiemian/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: '21caijing',
    name: '21世纪经济报道',
    group: 'finance',
    strategy: 'rsshub',
    rsshubRoute: '/21caijing/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'stcn',
    name: '证券时报',
    group: 'finance',
    strategy: 'rsshub',
    rsshubRoute: '/stcn/news',
    get url() { return rsshub(this.rsshubRoute); },
  },

  // === 半导体行业 ===
  {
    id: 'ijiwei',
    name: '爱集微',
    group: 'semiconductor',
    strategy: 'rsshub',
    rsshubRoute: '/ijiwei/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'semiinsights',
    name: '半导体行业观察',
    group: 'semiconductor',
    strategy: 'rsshub',
    rsshubRoute: '/semiinsights/news',
    get url() { return rsshub(this.rsshubRoute); },
  },

  // === 通信行业 ===
  {
    id: 'c114',
    name: 'C114通信网',
    group: 'telecom',
    strategy: 'rsshub',
    rsshubRoute: '/c114/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'txworld',
    name: '通信世界',
    group: 'telecom',
    strategy: 'rsshub',
    rsshubRoute: '/txworld/news',
    get url() { return rsshub(this.rsshubRoute); },
  },

  // === 官方媒体 ===
  {
    id: 'xinhuanet',
    name: '新华网',
    group: 'official',
    strategy: 'rsshub',
    rsshubRoute: '/xinhuanet/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'people',
    name: '人民网',
    group: 'official',
    strategy: 'rsshub',
    rsshubRoute: '/people/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
  {
    id: 'huanqiu',
    name: '环球网',
    group: 'official',
    strategy: 'rsshub',
    rsshubRoute: '/huanqiu/article',
    get url() { return rsshub(this.rsshubRoute); },
  },

  // === 内容平台 ===
  {
    id: 'baijiahao',
    name: '百家号',
    group: 'platform',
    strategy: 'rsshub',
    rsshubRoute: '/baijiahao/news',
    get url() { return rsshub(this.rsshubRoute); },
  },
];

// Build a lookup map by source id
export const FEED_MAP = Object.fromEntries(FEEDS.map(f => [f.id, f]));

// Build sources.json data
export function buildSourcesRegistry() {
  return FEEDS.map(f => ({
    id: f.id,
    name: f.name,
    group: f.group,
    groupLabel: FEED_GROUPS[f.group].label,
    feedType: f.strategy === 'rss' ? '原生RSS' : 'RSSHub',
  }));
}
