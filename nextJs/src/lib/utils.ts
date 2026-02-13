import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Transform an IMDB poster URL to use specific dimensions.
 * Replaces the UX/CR sizing parameters in the URL.
 */
export function transformPosterUrl(
  url: string | null | undefined,
  width = 300,
  height = 444
): string | null {
  if (!url) return null
  return url.replace(/UX\d+_CR[\d,]+_AL_/, `UX${width}_CR0,0,${width},${height}_AL_`)
}
