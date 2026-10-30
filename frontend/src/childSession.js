const CHILD_SESSION_KEY = 'kinderlens_child_session';

export function hasChildSession() {
  return Boolean(sessionStorage.getItem(CHILD_SESSION_KEY));
}

export function childSessionHeaders(headers = {}) {
  const token = sessionStorage.getItem(CHILD_SESSION_KEY);
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
