export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '').trim().replace(/\/+$/, '');

/**
 * 为相对路径补齐 BASE_PATH 前缀（支持部署在 /xtv 等子路径下）
 */
export function withBasePath(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!BASE_PATH) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith(BASE_PATH + '/') || cleanPath === BASE_PATH) return cleanPath;
  return `${BASE_PATH}${cleanPath}`;
}
