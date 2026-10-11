"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CloudAlert, Palette, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/states";
import { useAuth } from "@/components/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api-client";
import { CARD_THEMES, MAX_STICKERS, STICKERS, type CardTheme, type Sticker } from "@/lib/constants";
import { formatEventDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CardDesign, EventItem } from "@/lib/types";

// How each theme and sticker id (stored by the API) is drawn on the web
const THEMES: Record<CardTheme, { label: string; gradient: string }> = {
  sunset: { label: "Sunset", gradient: "from-amber-400 via-pink-500 to-purple-600" },
  ocean: { label: "Ocean", gradient: "from-cyan-400 via-sky-500 to-indigo-600" },
  forest: { label: "Forest", gradient: "from-lime-400 via-emerald-500 to-teal-700" },
};

const STICKER_EMOJI: Record<Sticker, { emoji: string; label: string }> = {
  music: { emoji: "🎵", label: "Music note" },
  party: { emoji: "🎉", label: "Party popper" },
  heart: { emoji: "❤️", label: "Heart" },
  star: { emoji: "⭐", label: "Star" },
  fire: { emoji: "🔥", label: "Fire" },
};

// Where the 1st, 2nd and 3rd sticker sit on the card
const SLOTS = ["top-4 right-4 rotate-12", "bottom-4 right-6 -rotate-6", "top-1/2 right-24 -translate-y-1/2 rotate-6"];

const SAVE_DELAY_MS = 600;
const EXIT_ANIMATION_MS = 200;

export function CardDesigner({ event }: { event: EventItem }) {
  const { user } = useAuth();
  const saved = useApi<{ card: CardDesign }>(user ? `/events/${event.id}/card` : null);

  return (
    <section className="mt-10 rounded-2xl border bg-card p-4 sm:p-6" aria-labelledby="designer-title">
      <div className="flex items-center gap-2">
        <Palette className="size-5 text-primary" aria-hidden />
        <h2 id="designer-title" className="text-lg font-semibold">
          Design your card
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a background and add up to {MAX_STICKERS} stickers. Your design is saved for this event.
      </p>

      <div className="mt-5">
        {user === null ? (
          <div className="space-y-4">
            <CardPreview event={event} theme="sunset" stickers={[]} leaving={null} />
            <Button asChild size="lg" className="h-10 w-full sm:w-auto">
              <Link href={`/login?next=/events/${event.id}`}>Log in to design your card</Link>
            </Button>
          </div>
        ) : saved.error ? (
          <ErrorState message={saved.error} onRetry={saved.reload} />
        ) : !saved.data ? (
          <div className="space-y-4">
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          // Mounted only after the saved design loads, so it starts from it
          <Designer event={event} initial={saved.data.card} />
        )}
      </div>
    </section>
  );
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function Designer({ event, initial }: { event: EventItem; initial: CardDesign }) {
  const [theme, setTheme] = useState<CardTheme>(initial.theme as CardTheme);
  const [stickers, setStickers] = useState<Sticker[]>(initial.stickers as Sticker[]);
  const [leaving, setLeaving] = useState<Sticker | null>(null); // sticker playing its exit animation
  const [status, setStatus] = useState<SaveStatus>("idle");

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestRequest = useRef(0);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  // Save the whole design shortly after the last change (one request instead of one per tap)
  function scheduleSave(design: { theme: CardTheme; stickers: Sticker[] }) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(design), SAVE_DELAY_MS);
  }

  async function save(design: { theme: CardTheme; stickers: Sticker[] }) {
    const request = ++latestRequest.current;
    setStatus("saving");
    try {
      await api(`/events/${event.id}/card`, { method: "PUT", json: design });
      if (request === latestRequest.current) setStatus("saved");
    } catch (err) {
      if (request !== latestRequest.current) return; // a newer save is already running
      setStatus("error");
      toast.error(`Couldn't save your card. ${(err as Error).message}`);
    }
  }

  function chooseTheme(next: CardTheme) {
    if (next === theme) return;
    setTheme(next);
    scheduleSave({ theme: next, stickers });
  }

  function addSticker(sticker: Sticker) {
    if (stickers.length >= MAX_STICKERS || stickers.includes(sticker)) return;
    const next = [...stickers, sticker];
    setStickers(next);
    scheduleSave({ theme, stickers: next });
  }

  function removeSticker(sticker: Sticker) {
    if (leaving) return;
    const next = stickers.filter((s) => s !== sticker);
    scheduleSave({ theme, stickers: next });
    // Let the sticker shrink away before it is taken out of the list
    setLeaving(sticker);
    setTimeout(() => {
      setStickers(next);
      setLeaving(null);
    }, EXIT_ANIMATION_MS);
  }

  const full = stickers.length >= MAX_STICKERS;

  return (
    <div className="space-y-5">
      <CardPreview event={event} theme={theme} stickers={stickers} leaving={leaving} onRemove={removeSticker} />

      <div>
        <h3 className="mb-2 text-sm font-medium">Background</h3>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Card background">
          {CARD_THEMES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              onClick={() => chooseTheme(t)}
              className={cn(
                "flex items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 text-sm font-medium transition-all active:scale-95",
                theme === t ? "border-primary bg-secondary" : "border-transparent bg-muted hover:border-primary/30",
              )}
            >
              <span className={cn("size-7 rounded-full bg-gradient-to-br", THEMES[t].gradient)} aria-hidden />
              {THEMES[t].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-medium">Stickers</h3>
          <span className="text-xs text-muted-foreground">
            {stickers.length}/{MAX_STICKERS} {full && "· tap a sticker on the card to remove it"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STICKERS.map((s) => {
            const onCard = stickers.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={onCard}
                aria-label={`${onCard ? "Remove" : "Add"} ${STICKER_EMOJI[s].label} sticker`}
                disabled={!onCard && full}
                onClick={() => (onCard ? removeSticker(s) : addSticker(s))}
                className={cn(
                  "grid size-12 place-items-center rounded-xl border-2 text-2xl transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40",
                  onCard ? "border-primary bg-secondary" : "border-transparent bg-muted hover:border-primary/30",
                )}
              >
                {STICKER_EMOJI[s].emoji}
              </button>
            );
          })}
        </div>
      </div>

      <SaveIndicator status={status} onRetry={() => save({ theme, stickers: stickers.filter((s) => s !== leaving) })} />
    </div>
  );
}

function CardPreview({
  event,
  theme,
  stickers,
  leaving,
  onRemove,
}: {
  event: EventItem;
  theme: CardTheme;
  stickers: Sticker[];
  leaving: Sticker | null;
  onRemove?: (s: Sticker) => void;
}) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl text-white shadow-lg">
      {/* One layer per theme; switching fades between them (CSS can't animate gradients directly) */}
      {CARD_THEMES.map((t) => (
        <div
          key={t}
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ease-out",
            THEMES[t].gradient,
            theme === t ? "opacity-100" : "opacity-0",
          )}
        />
      ))}

      <div className="relative flex h-full flex-col justify-end p-5 sm:p-7">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-90">{event.category}</p>
        <p className="mt-1 max-w-[70%] text-xl leading-tight font-bold sm:text-3xl">{event.title}</p>
        <p className="mt-2 text-sm opacity-90 sm:text-base">
          {formatEventDate(event.startsAt)} · {event.city} · {formatPrice(event.pricePaise)}
        </p>
      </div>

      {stickers.map((s, i) => (
        <button
          key={s}
          type="button"
          disabled={!onRemove}
          onClick={() => onRemove?.(s)}
          aria-label={`Remove ${STICKER_EMOJI[s].label} sticker`}
          className={cn(
            "group absolute text-4xl drop-shadow-md transition-transform duration-300 hover:scale-110 sm:text-6xl",
            SLOTS[i],
            s === leaving
              ? "animate-out fade-out zoom-out-50 fill-mode-forwards duration-200"
              : "animate-in fade-in zoom-in-50 spin-in-12 duration-300",
          )}
        >
          {STICKER_EMOJI[s].emoji}
          {onRemove && (
            <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-80 group-hover:opacity-100 sm:opacity-0">
              <X className="size-3" aria-hidden />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "idle") return null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
      {status === "saving" && (
        <>
          <Spinner /> Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="size-4 text-success" aria-hidden /> Saved
        </>
      )}
      {status === "error" && (
        <>
          <CloudAlert className="size-4 text-destructive" aria-hidden /> Not saved.
          <Button variant="link" className="h-auto p-0" onClick={onRetry}>
            Try again
          </Button>
        </>
      )}
    </p>
  );
}
