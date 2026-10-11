"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/event-card";
import { EventGrid } from "@/components/event-grid";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, EventGridSkeleton } from "@/components/states";
import { useRequireUser } from "@/components/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import type { EventItem, Paginated } from "@/lib/types";

type Feed = Paginated<EventItem> & { categories: string[] };

export default function FeedPage() {
  const user = useRequireUser();
  const [page, setPage] = useState(1);
  const feed = useApi<Feed>(user ? `/feed?page=${page}` : null);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">My Feed</h1>
          <p className="mt-1 text-muted-foreground">Upcoming events from your favourite categories.</p>
          {feed.data && feed.data.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {feed.data.categories.map((c) => (
                <CategoryBadge key={c} category={c} />
              ))}
            </div>
          )}
        </div>
        <Button asChild variant="outline" size="lg">
          <Link href="/favourites">
            <Settings2 aria-hidden /> Edit favourites
          </Link>
        </Button>
      </div>

      {feed.error ? (
        <ErrorState message={feed.error} onRetry={feed.reload} />
      ) : !feed.data ? (
        <EventGridSkeleton />
      ) : feed.data.categories.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your feed is waiting for you"
          message="Pick a few categories you love, like Music or Food, and we'll fill this page with matching events."
          action={
            <Button asChild size="lg">
              <Link href="/favourites">Pick favourites</Link>
            </Button>
          }
        />
      ) : feed.data.items.length === 0 ? (
        <EmptyState
          title="Nothing coming up in your favourites"
          message="There are no upcoming events in these categories right now. Try adding more categories or browse everything."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" size="lg">
                <Link href="/favourites">Add categories</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/">Browse all events</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className={feed.loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <EventGrid events={feed.data.items} />
          <Pagination
            page={page}
            totalPages={feed.data.totalPages}
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </section>
  );
}
