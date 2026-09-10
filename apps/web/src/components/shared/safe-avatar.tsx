"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const DEFAULT_AVATAR_SRC = "/default-avatar.svg";

type SafeAvatarProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

/**
 * Renders an avatar image and falls back to a local default when the URL is
 * missing or fails to load (broken path / network / 404).
 */
export function SafeAvatar({
  src,
  alt = "",
  className,
}: SafeAvatarProps) {
  const resolved = src?.trim() || DEFAULT_AVATAR_SRC;
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(resolved);
  }, [resolved]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={cn("object-cover", className)}
      src={currentSrc}
      onError={() => {
        if (currentSrc !== DEFAULT_AVATAR_SRC) {
          setCurrentSrc(DEFAULT_AVATAR_SRC);
        }
      }}
    />
  );
}
