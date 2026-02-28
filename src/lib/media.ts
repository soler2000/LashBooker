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
    return /\.mp4($|\?)/i.test(url.pathname + url.search);
  } catch {
    return /\.mp4($|\?)/i.test(trimmed);
  }
}

export function shouldUseUnoptimizedImage(src: string) {
  const trimmed = src.trim();

  if (!trimmed || trimmed.startsWith("data:")) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
