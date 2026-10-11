"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, IndianRupee, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge, EventImage } from "@/components/event-card";
import { RemindButton } from "@/components/remind-button";
import { EmptyState, ErrorState } from "@/components/states";
import { useApi } from "@/hooks/use-api";
import { useReminders } from "@/hooks/use-reminders";
import { formatEventDate, formatPrice } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, status, reload } = useApi<{ event: EventItem }>(`/events/${id}`);
  const reminders = useReminders();

  if (status === 404) {
    return (
      <EmptyState
        title="Event not found"
        message="This event may have been removed or is no longer available."
        action={
          <Button asChild size="lg">
            <Link href="/">Browse events</Link>
          </Button>
        }
      />
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EventDetailSkeleton />;

  const { event } = data;
  const isPast = new Date(event.startsAt) < new Date();

  return (
    <article className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="lg" className="-ml-2.5 mb-4 text-muted-foreground">
        <Link href="/">
          <ArrowLeft aria-hidden /> All events
        </Link>
      </Button>

      <EventImage src={event.imageUrl} alt={event.title} className="aspect-[16/9] w-full rounded-2xl border" />

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CategoryBadge category={event.category} />
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{event.title}</h1>
        </div>
        {!isPast && (
          <RemindButton
            on={reminders.isReminded(event.id)}
            pending={reminders.isPending(event.id)}
            onClick={() => reminders.toggle(event.id)}
            className="h-10 shrink-0"
          />
        )}
      </div>

      <dl className="mt-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
        <Fact icon={CalendarDays} label="When" value={formatEventDate(event.startsAt)} />
        <Fact icon={MapPin} label="Where" value={event.city} />
        <Fact icon={IndianRupee} label="Price" value={formatPrice(event.pricePaise)} />
      </dl>

      {isPast && <p className="mt-4 text-sm font-medium text-muted-foreground">This event has already happened.</p>}

      <p className="mt-6 leading-relaxed whitespace-pre-line">{event.description}</p>
    </article>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" aria-busy="true" aria-label="Loading event">
      <Skeleton className="mb-4 h-8 w-28" />
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <Skeleton className="mt-6 h-5 w-20" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <Skeleton className="mt-6 h-20 w-full rounded-2xl" />
      <Skeleton className="mt-6 h-24 w-full" />
    </div>
  );
}
