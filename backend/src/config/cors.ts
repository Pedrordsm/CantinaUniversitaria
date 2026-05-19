const defaultOrigins = ['http://localhost:5173', 'https://pedrordsm.github.io'];

export function getAllowedOrigins() {
  const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;
}
