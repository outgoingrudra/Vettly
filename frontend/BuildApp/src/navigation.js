export function navigate(destination, { replace = false } = {}) {
  const url = new URL(destination, location.origin);
  if (url.origin !== location.origin) {
    location.assign(url.href);
    return;
  }
  history[replace ? 'replaceState' : 'pushState'](null, '', url.href);
  window.dispatchEvent(new Event('vettly:navigate'));
  window.scrollTo(0, 0);
}

export function handleInternalLink(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
  event.preventDefault();
  navigate(url.href);
}
