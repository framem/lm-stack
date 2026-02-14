import type { Experimental_GeneratedImage } from "ai";

import { cn } from "@/src/lib/utils";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Image = ({
  base64,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured to exclude from img props
  uint8Array,
  mediaType,
  ...props
}: ImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element -- rendering base64 data URLs
  <img
    {...props}
    alt={props.alt}
    className={cn(
      "h-auto max-w-full overflow-hidden rounded-md",
      props.className
    )}
    src={`data:${mediaType};base64,${base64}`}
  />
);
