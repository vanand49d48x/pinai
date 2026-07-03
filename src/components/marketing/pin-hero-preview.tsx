export function PinHeroPreview() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Pinterest pin mock */}
      <div className="rounded-2xl border bg-card p-4 shadow-lg">
        <div className="aspect-[2/3] overflow-hidden rounded-xl bg-gradient-to-br from-rose-100 to-orange-100">
          <div className="flex h-full items-end bg-gradient-to-t from-black/40 to-transparent p-4">
            <div className="text-white">
              <p className="text-xs opacity-80">Generated title</p>
              <p className="font-bold leading-tight">
                15 Minimalist Summer Home Decor Ideas You&apos;ll Love
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          Transform your space with these easy summer decor tips ✨ #homedecor #minimalist #summer
        </p>
      </div>

      {/* Input → output flow */}
      <div className="flex flex-col justify-center gap-4 rounded-2xl border bg-muted/40 p-6">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground">Topic + keywords in</p>
          <p className="mt-1 text-sm">Summer home decor · minimalist, cozy, living room</p>
        </div>
        <div className="flex justify-center text-2xl text-primary">↓ ✨</div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary">SEO copy out</p>
          <p className="mt-1 text-sm font-medium">Title · Description · Alt text</p>
          <p className="mt-2 text-xs text-muted-foreground">Ready to schedule & publish</p>
        </div>
      </div>
    </div>
  );
}
