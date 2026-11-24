export function getFrontendUrl(path: string): string {
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const configuredUrl = isLocal
    ? import.meta.env.VITE_APP_FRONTEND_URL_LOCAL
    : import.meta.env.VITE_APP_FRONTEND_URL_PRODUCTION;
  const baseUrl = String(configuredUrl || import.meta.env.VITE_APP_FRONTEND_URL || window.location.origin).replace(/\/+$/, "");
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}
