"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/providers/auth-provider";

const withId = (set: Set<string>, id: string, on: boolean) => {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
};

// "Remind me" state for the logged-in user.
// toggle() is optimistic: the button flips at once, and flips back with a message if the save fails.
export function useReminders() {
  const { user } = useAuth();
  const router = useRouter();
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Load saved reminders so the buttons are correct after a refresh
  useEffect(() => {
    if (!user) return;
    api<{ eventIds: string[] }>("/me/reminders")
      .then((r) => setReminded(new Set(r.eventIds)))
      .catch(() => toast.error("Couldn't load your reminders"));
  }, [user]);

  const toggle = useCallback(
    async (eventId: string) => {
      if (!user) {
        toast.info("Log in to set reminders");
        router.push(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      if (pending.has(eventId)) return; // ignore double taps while saving

      const wasOn = reminded.has(eventId);
      setReminded((s) => withId(s, eventId, !wasOn)); // 1. update the screen immediately
      setPending((s) => withId(s, eventId, true));

      try {
        // 2. save: PUT = on, DELETE = off (both are safe to repeat)
        await api(`/events/${eventId}/reminder`, { method: wasOn ? "DELETE" : "PUT" });
      } catch (err) {
        // 3. failed: put the button back and say why
        setReminded((s) => withId(s, eventId, wasOn));
        toast.error(`Couldn't ${wasOn ? "remove" : "save"} your reminder. ${(err as Error).message}`);
      } finally {
        setPending((s) => withId(s, eventId, false));
      }
    },
    [user, router, reminded, pending],
  );

  return {
    isReminded: (id: string) => user != null && reminded.has(id),
    isPending: (id: string) => pending.has(id),
    toggle,
  };
}
