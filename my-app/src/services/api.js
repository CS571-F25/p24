import { mockRoutes } from '../data/mockRoutes';

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

const buildQueryString = (params) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const withMockFallback = async (callback, fallbackValue) => {
  try {
    const result = await callback();
    return { ...result, source: 'api' };
  } catch (error) {
    console.warn('Falling back to mock data:', error);
    return { ...fallbackValue, source: 'mock' };
  }
};

export const fetchRoutes = async ({ start, end, preference }) => {
  if (!BASE_URL) {
    console.warn('Missing REACT_APP_BACKEND_BASE_URL; using mock routes.');
    return { routes: mockRoutes, source: 'mock' };
  }

  const query = buildQueryString({ start, end, preference });
  const url = `${BASE_URL.replace(/\/$/, '')}/routes?${query}`;
  return withMockFallback(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Routes request failed with status ${response.status}`);
      }
      const routes = await response.json();
      if (!Array.isArray(routes)) {
        throw new Error('Routes response must be an array');
      }
      return { routes };
    },
    { routes: mockRoutes }
  );
};

export const submitFeedback = async (payload) => {
  if (!BASE_URL) {
    console.info('Feedback submission mocked (no backend configured).', payload);
    return { ok: true, source: 'mock' };
  }

  const url = `${BASE_URL.replace(/\/$/, '')}/feedback`;
  return withMockFallback(
    async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Feedback request failed with status ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      return { ok: true, data };
    },
    { ok: true }
  );
};
