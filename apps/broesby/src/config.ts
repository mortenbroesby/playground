export function getSharedPassword() {
  return import.meta.env.VITE_BROESBY_SHARED_PASSWORD ?? '';
}
