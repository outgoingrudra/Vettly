// Keep the destination in this tab while the user signs in or recovers their account.
import { navigate } from './navigation';
const key = 'vettly-login-destination';

export function requireLogin() {
  const destination = location.pathname + location.search + location.hash;
  try {
    sessionStorage.setItem(key, destination);
  } catch {
    // Private browsers may disable storage. Carry it through the login URL instead.
    navigate('/login?next=' + encodeURIComponent(destination), { replace: true });
    return;
  }
  navigate('/login', { replace: true });
}

export function finishLogin() {
  let next = new URLSearchParams(location.search).get('next');
  try {
    next ??= sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
  } catch {}

  let destination = '/host';
  if (next?.startsWith('/')) {
    try {
      const url = new URL(next, location.origin);
      if (url.origin === location.origin && /^\/(account|host(?:\/.*)?|interviews\/[^/]+\/(?:join|assessment|video)|results\/[^/]+)\/?$/.test(url.pathname)) {
        destination = url.href;
      }
    } catch {}
  }
  navigate(destination, { replace: true });
}
