export function getSharedPassword() {
  const password = import.meta.env.VITE_BROESBY_SHARED_PASSWORD;

  if (!password) {
    throw new Error('Missing required environment variable: VITE_BROESBY_SHARED_PASSWORD');
  }

  return password;
}
