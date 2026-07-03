"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PinPreviewProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  destinationLink?: string;
  generating?: boolean;
  className?: string;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export function PinPreview({
  imageUrl,
  title,
  description,
  destinationLink,
  generating,
  className,
}: PinPreviewProps) {
  return (
    <div className={cn("sticky top-24", className)}>
      <p className="mb-3 text-sm font-medium text-muted-foreground">Pin preview</p>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative aspect-[2/3] bg-muted">
          {imageUrl ? (
            <Image src={imageUrl} alt={title || "Pin preview"} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Upload an image
            </div>
          )}
          {generating && (
            <div className="absolute inset-0 flex items-end bg-black/20 p-4">
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/40" />
                <Skeleton className="h-3 w-full bg-white/30" />
                <Skeleton className="h-3 w-5/6 bg-white/30" />
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          {generating ? (
            <>
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </>
          ) : (
            <>
              <p className="font-bold leading-snug">{title || "Your title will appear here"}</p>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {description || "AI-generated description will show here after you generate copy."}
              </p>
              {destinationLink && (
                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px]">↗</span>
                  {getDomain(destinationLink)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
