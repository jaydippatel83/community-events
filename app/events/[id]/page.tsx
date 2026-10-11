import { Suspense } from "react";
import { EventDetail, EventDetailSkeleton } from "./event-detail";

export default function EventPage({ params }: PageProps<"/events/[id]">) {
  // params is a Promise in Next.js 16; the client component unwraps it inside Suspense
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetail params={params} />
    </Suspense>
  );
}
