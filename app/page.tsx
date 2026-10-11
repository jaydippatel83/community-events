import { Suspense } from "react";
import { EventGridSkeleton } from "@/components/states";
import { EventsBrowser } from "./events-browser";

export default function EventsPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold sm:text-3xl">Upcoming events</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Music nights, workshops, food fairs and more near you.</p>
      {/* EventsBrowser reads the URL's ?filters, which Next.js requires to be inside Suspense */}
      <Suspense fallback={<EventGridSkeleton />}>
        <EventsBrowser />
      </Suspense>
    </section>
  );
}
