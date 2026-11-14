import { useState } from 'react';

/**
 * A round profile picture with a lettered fallback. Email/password accounts
 * have no picture, and a Google photo URL can expire, so a failed load falls
 * back to the initial instead of a broken image. The name is always shown
 * beside it, so the image itself is decorative (empty alt).
 */
export default function Avatar({ name, src, size = 24 }: { name: string; src?: string; size?: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const style = { width: size, height: size };

  if (src && failedSrc !== src) {
    return (
      <img
        className="af-avatar"
        src={src}
        alt=""
        style={style}
        // Google's avatar CDN refuses some requests that carry a Referer.
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  const label = (name || '?').trim();
  // A stable hue per name, so different people's letters are told apart.
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return (
    <span
      className="af-avatar af-avatar-fallback"
      aria-hidden="true"
      style={{ ...style, fontSize: Math.round(size * 0.45), background: `hsl(${hash % 360} 45% 32%)` }}
    >
      {(label[0] || '?').toUpperCase()}
    </span>
  );
}
