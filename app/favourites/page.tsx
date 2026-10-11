"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/states";
import { useRequireUser } from "@/components/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api-client";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
  Music: "🎵",
  Workshop: "🛠️",
  Food: "🍜",
  Sports: "⚽",
  Kids: "🧸",
};

export default function FavouritesPage() {
  const user = useRequireUser();
  const saved = useApi<{ categories: string[] }>(user ? "/me/favourites" : null);

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold sm:text-3xl">What do you love?</h1>
      <p className="mt-1 text-muted-foreground">
        Pick your favourite categories and we&apos;ll show matching events in My Feed.
      </p>

      <div className="mt-8">
        {saved.error ? (
          <ErrorState message={saved.error} onRetry={saved.reload} />
        ) : !saved.data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Skeleton key={c} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          // Rendered only once the saved list has loaded, so it can start from it
          <FavouritesPicker initial={saved.data.categories} />
        )}
      </div>
    </section>
  );
}

function FavouritesPicker({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(initial));
  const [saving, setSaving] = useState(false);

  function toggle(category: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await api("/me/favourites", { method: "PUT", json: { categories: [...selected] } });
      toast.success("Favourites saved");
      router.push("/feed");
    } catch (err) {
      toast.error((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => {
          const on = selected.has(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c)}
              className={cn(
                "relative flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card font-semibold transition-all active:scale-95",
                on ? "border-primary bg-secondary text-secondary-foreground" : "hover:border-primary/40",
              )}
            >
              <span className="text-2xl" aria-hidden>
                {CATEGORY_EMOJI[c]}
              </span>
              {c}
              {on && <Check className="absolute top-2 right-2 size-4 text-primary animate-in zoom-in-50" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.size === 0 ? "Pick at least one to fill your feed." : `${selected.size} selected`}
        </p>
        <Button size="lg" className="h-10" onClick={save} disabled={saving || selected.size === 0}>
          {saving && <Spinner />}
          Save and see my feed
        </Button>
      </div>
    </>
  );
}
