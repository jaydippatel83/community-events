"use client";

import { EventCard } from "@/components/event-card";
import { RemindButton } from "@/components/remind-button";
import { useReminders } from "@/hooks/use-reminders";
import type { EventItem } from "@/lib/types";

// A grid of event cards, each with its own "Remind me" button. Used by Events and My Feed.
export function EventGrid({ events }: { events: EventItem[] }) {
  const reminders = useReminders();
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          action={
            <RemindButton
              on={reminders.isReminded(event.id)}
              pending={reminders.isPending(event.id)}
              onClick={() => reminders.toggle(event.id)}
              className="w-full"
            />
          }
        />
      ))}
    </div>
  );
}
