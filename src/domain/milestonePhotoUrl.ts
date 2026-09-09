const CONVEX_STORAGE_PATH = /^\/api\/storage\/([A-Za-z0-9_-]{1,200})$/;
const CONVEX_CLOUD_HOST = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.convex\.cloud$/;
const BLOB_OBJECT_KEY = /^[A-Za-z0-9._~-]{1,200}$/;

function parsedUrl(value: string): URL | null {
  const containsControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
  if (!value || value.trim() !== value || containsControlCharacter) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizedDocumentOrigin(value: string): string | null {
  if (value === 'capacitor://localhost' || value === 'null') return value;

  const parsed = parsedUrl(value);
  if (!parsed || value !== parsed.origin || parsed.username || parsed.password) return null;
  if (parsed.protocol === 'https:') return parsed.origin;
  if (
    parsed.protocol === 'http:'
    && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
  ) {
    return parsed.origin;
  }
  return null;
}

function normalizedConvexStorageOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = parsedUrl(value);
  if (
    !parsed
    || parsed.protocol !== 'https:'
    || parsed.username
    || parsed.password
    || parsed.port
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
    || !CONVEX_CLOUD_HOST.test(parsed.hostname)
  ) {
    return null;
  }
  return `https://${parsed.hostname}`;
}

/**
 * Accept only URLs returned by the configured Convex deployment's
 * `ctx.storage.getUrl`. Rebuilding the value from its validated `*.convex.cloud`
 * origin and a validated opaque ID keeps unexpected schemes, hosts, credentials
 * and URL suffixes out of DOM sinks without coupling dev builds to Production.
 */
export function normalizeMilestoneStorageUrl(
  value: string | null | undefined,
  configuredConvexUrl: string | null | undefined,
): string | null {
  if (!value) return null;
  const parsed = parsedUrl(value);
  const storageOrigin = normalizedConvexStorageOrigin(configuredConvexUrl);
  if (
    !parsed
    || !storageOrigin
    || parsed.protocol !== 'https:'
    || parsed.origin !== storageOrigin
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
  ) {
    return null;
  }
  const match = CONVEX_STORAGE_PATH.exec(parsed.pathname);
  if (!match) return null;
  return `${storageOrigin}/api/storage/${encodeURIComponent(match[1])}`;
}

/**
 * Preview URLs never come from Convex: they are object URLs made by this page.
 * Keep that lane separate and require the blob to belong to the current app
 * origin before reconstructing it from a validated opaque object key.
 */
export function normalizeMilestoneBlobPreviewUrl(
  value: string | null | undefined,
  appOrigin: string,
): string | null {
  if (!value) return null;
  const parsed = parsedUrl(value);
  const origin = normalizedDocumentOrigin(appOrigin);
  if (
    !parsed
    || !origin
    || parsed.protocol !== 'blob:'
    || parsed.search
    || parsed.hash
  ) {
    return null;
  }
  const prefix = `${origin}/`;
  if (!parsed.pathname.startsWith(prefix)) return null;
  const objectKey = parsed.pathname.slice(prefix.length);
  if (!BLOB_OBJECT_KEY.test(objectKey)) return null;
  return `blob:${origin}/${encodeURIComponent(objectKey)}`;
}
