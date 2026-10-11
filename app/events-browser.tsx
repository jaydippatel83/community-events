"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventGrid } from "@/components/event-grid";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, EventGridSkeleton } from "@/components/states";
import { useApi } from "@/hooks/use-api";
import { CATEGORIES } from "@/lib/constants";
import type { EventItem, Paginated } from "@/lib/types";

const ALL = "all"; // shadcn Select can't use "" as a value, so "all" means "no filter"

// The filters live in the URL (?category=Music&city=Coimbatore&q=night&page=2),
// so they survive a refresh and can be shared as a link.
export function EventsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const category = params.get("category") ?? "";
  const city = params.get("city") ?? "";
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1);

  const events = useApi<Paginated<EventItem>>(`/events?${params.toString()}`);
  const cities = useApi<{ cities: string[] }>("/events/cities");

  function setFilters(changes: Record<string, string | number>) {
    // Read the live URL (not `params` from this render): the search box calls this after a delay,
    // and by then another filter may have changed
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === "" || value === ALL) next.delete(key);
      else next.set(key, String(value));
    }
    if (!("page" in changes)) next.delete("page"); // a new filter starts again from page 1
    router.replace(`${pathname}?${next}`, { scroll: false });
  }

  // Search box: update the URL 400ms after the user stops typing, not on every key press
  const [search, setSearch] = useState(q);
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(() => setFilters({ q: search.trim() }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed text changes
  }, [search]);

  function clearFilters() {
    setSearch("");
    router.replace(pathname, { scroll: false });
  }

  const hasFilters = Boolean(category || city || q);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:grid-cols-[1fr_180px_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, e.g. night"
            aria-label="Search events"
            className="h-10 pl-9"
          />
        </div>

        <Select value={category || ALL} onValueChange={(v) => setFilters({ category: v })}>
          <SelectTrigger className="h-10 w-full" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city || ALL} onValueChange={(v) => setFilters({ city: v })}>
          <SelectTrigger className="h-10 w-full" aria-label="City">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cities</SelectItem>
            {cities.data?.cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="lg"
          className="h-10"
          disabled={!hasFilters}
          onClick={clearFilters}
        >
          <X aria-hidden /> Clear
        </Button>
      </div>

      {events.error ? (
        <ErrorState message={events.error} onRetry={events.reload} />
      ) : !events.data ? (
        <EventGridSkeleton />
      ) : events.data.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No events match your filters" : "No upcoming events yet"}
          message={
            hasFilters
              ? "Try a different category, city or search word."
              : "New events are added often. Check back soon!"
          }
          action={
            hasFilters && (
              <Button variant="outline" size="lg" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className={events.loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <p className="mb-4 text-sm text-muted-foreground">
            {events.data.total} {events.data.total === 1 ? "event" : "events"}
          </p>
          <EventGrid events={events.data.items} />
          <Pagination
            page={page}
            totalPages={events.data.totalPages}
            onChange={(p) => {
              setFilters({ page: p });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}
