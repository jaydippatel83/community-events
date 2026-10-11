"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { CategoryBadge, EventImage } from "@/components/event-card";
import { EmptyState, ErrorState } from "@/components/states";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api-client";
import { formatEventDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EventItem } from "@/lib/types";

export default function AdminEventsPage() {
  const events = useApi<{ items: EventItem[] }>("/admin/events");

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Manage events</h1>
          <p className="mt-1 text-muted-foreground">
            Inactive events are hidden from visitors. Events are never deleted.
          </p>
        </div>
        <Button asChild size="lg" className="h-10">
          <Link href="/admin/new">
            <Plus aria-hidden /> Add event
          </Link>
        </Button>
      </div>

      {events.error ? (
        <ErrorState message={events.error} onRetry={events.reload} />
      ) : !events.data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : events.data.items.length === 0 ? (
        <EmptyState
          title="No events yet"
          message="Add your first event and it will show up for visitors."
          action={
            <Button asChild size="lg">
              <Link href="/admin/new">Add event</Link>
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {events.data.items.length} events · {events.data.items.filter((e) => e.isActive).length} active
          </p>
          <ul className="space-y-3">
            {events.data.items.map((event) => (
              <AdminEventRow key={event.id} event={event} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function AdminEventRow({ event }: { event: EventItem }) {
  const [active, setActive] = useState(event.isActive);
  const [saving, setSaving] = useState(false);
  const isPast = new Date(event.startsAt) < new Date();

  // Same optimistic pattern as "Remind me": flip now, roll back if the save fails
  async function toggle(next: boolean) {
    setActive(next);
    setSaving(true);
    try {
      await api(`/admin/events/${event.id}`, { method: "PATCH", json: { isActive: next } });
      toast.success(`"${event.title}" is now ${next ? "active" : "inactive"}`);
    } catch (err) {
      setActive(!next);
      toast.error(`Couldn't update "${event.title}". ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-opacity sm:gap-4",
        !active && "opacity-70",
      )}
    >
      <EventImage src={event.imageUrl} alt="" className="hidden size-20 shrink-0 rounded-xl sm:block" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
          {isPast && <Badge variant="outline">Past</Badge>}
        </div>
        <Link href={`/events/${event.id}`} className="mt-1 block truncate font-semibold hover:text-primary">
          {event.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden /> {formatEventDate(event.startsAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden /> {event.city}
          </span>
          <span>{formatPrice(event.pricePaise)}</span>
        </p>
      </div>

      <label className="flex shrink-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
        <Switch checked={active} onCheckedChange={toggle} disabled={saving} aria-label={`Active: ${event.title}`} />
        <span className={cn("w-14 text-xs font-medium", active ? "text-success" : "text-muted-foreground")}>
          {active ? "Active" : "Inactive"}
        </span>
      </label>
    </li>
  );
}
