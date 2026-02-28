export function isVideoAsset(src: string) {
  const trimmed = src.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("data:video/")) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return /\.(mp4|mov|m4v|webm|ogv)($|\?)/i.test(url.pathname + url.search);
  } catch {
    return /\.(mp4|mov|m4v|webm|ogv)($|\?)/i.test(trimmed);
  }
}
