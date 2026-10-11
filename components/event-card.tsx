import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EventItem } from "@/lib/types";

const CATEGORY_STYLES: Record<string, string> = {
  Music: "bg-violet-100 text-violet-700",
  Workshop: "bg-sky-100 text-sky-700",
  Food: "bg-orange-100 text-orange-700",
  Sports: "bg-emerald-100 text-emerald-700",
  Kids: "bg-pink-100 text-pink-700",
};

export function CategoryBadge({ category }: { category: string }) {
  return <Badge className={cn("font-semibold", CATEGORY_STYLES[category])}>{category}</Badge>;
}

export function EventImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    // Plain <img>: the admin can paste an image URL from any website, so next/image's host allow-list doesn't fit
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={cn("bg-muted object-cover", className)} />
  );
}

// `action` lets a page add a button (e.g. "Remind me") without the card knowing about it
export function EventCard({ event, action }: { event: EventItem; action?: React.ReactNode }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/events/${event.id}`} className="flex flex-1 flex-col">
        <EventImage src={event.imageUrl} alt="" className="aspect-[16/10] w-full" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={event.category} />
            <span className="text-sm font-semibold text-primary">{formatPrice(event.pricePaise)}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
            {event.title}
          </h3>
          <div className="mt-auto space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> {formatEventDate(event.startsAt)}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> {event.city}
            </p>
          </div>
        </div>
      </Link>
      {action && <div className="border-t px-4 py-3">{action}</div>}
    </article>
  );
}
