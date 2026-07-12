// router.js — 基于哈希的 SPA 路由

const ROUTES = {
  '/':                  { type: 'dashboard', title: '今日简报' },
  '/core-businesses':   { type: 'section', id: 'core-businesses',   title: '核心业务' },
  '/ip-legal':          { type: 'section', id: 'ip-legal',          title: '知识产权与法律' },
  '/growth-areas':      { type: 'section', id: 'growth-areas',      title: '增长领域' },
  '/macro-environment': { type: 'section', id: 'macro-environment', title: '宏观环境' },
  '/competitors':       { type: 'section', id: 'competitors',       title: '竞争对手' },
  '/stakeholders':      { type: 'section', id: 'stakeholders',      title: '关键利益相关方' },
  '/about':             { type: 'about', title: '关于与方法论' },
};

let currentRoute = null;
let routeChangeHandler = null;

export function initRouter(onRouteChange) {
  routeChangeHandler = onRouteChange;
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const route = parseHash();
  if (!route) return;

  if (currentRoute && currentRoute.path === route.path &&
      JSON.stringify(currentRoute.params) === JSON.stringify(route.params)) {
    return;
  }

  const paramsOnly = currentRoute && currentRoute.path === route.path;
  currentRoute = route;
  updateActiveNav(route.path);
  updatePageTitle(route.path);

  if (routeChangeHandler) {
    routeChangeHandler(route, { paramsOnly });
  }
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const path = '/' + (pathPart || '');

  let routeDef = ROUTES[path];
  if (!routeDef) {
    const cleanPath = path.replace(/\/$/, '');
    routeDef = ROUTES[cleanPath];
  }
  if (!routeDef) {
    routeDef = ROUTES['/'];
  }

  const params = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }

  return { ...routeDef, path, params };
}

function updateActiveNav(activePath) {
  document.querySelectorAll('.primary-nav .nav-link, [data-route]').forEach(link => {
    const route = link.getAttribute('data-route') || link.getAttribute('href')?.replace('#', '');
    link.classList.toggle('active', route === activePath || (activePath === '/' && route === '/'));
  });
}

function updatePageTitle(path) {
  const route = ROUTES[path] || ROUTES['/'];
  document.title = route.type === 'dashboard'
    ? '高通新闻监控 — 今日简报'
    : `${route.title} — 高通新闻监控`;
}

export function navigate(path, params = {}) {
  const queryStr = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  window.location.hash = queryStr ? `#${path}?${queryStr}` : `#${path}`;
}

export function updateParams(params) {
  if (!currentRoute) return;
  navigate(currentRoute.path, params);
}

export function getCurrentRoute() {
  return currentRoute || { type: 'dashboard', path: '/', params: {} };
}

export { ROUTES };
